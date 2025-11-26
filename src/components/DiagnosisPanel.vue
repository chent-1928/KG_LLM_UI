<script setup>
import { ref, computed, reactive, watch } from 'vue'
import { diagnoseDisease } from '../api/assistDoctor.js'

const props = defineProps({
  activeRecord: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['save-record', 'clear-active-record'])

const createEmptyMedicalRecord = () => ({
  chiefComplaint: '',
  presentIllness: '',
  pastHistory: '',
  physicalExam: '',
  auxiliaryExam: '',
})

const medicalRecord = reactive(createEmptyMedicalRecord())
const isDiagnosing = ref(false)
const diagnosisResult = ref(null)
const selectedDisease = ref(null)
const diagnosisBasis = ref(null)
const currentRecordId = ref('')
const min = 4
const max = 12
const currentCount = ref(4) // ← 初始值可任意设（如 6）

const fillWidth = computed(() => {
  const clamped = Math.max(min, Math.min(currentCount.value, max))
  return ((clamped - min) / (max - min)) * 100
})

const exampleRecord = {
  chiefComplaint: '男，32岁。反复咳嗽、咳痰10余年，再发加重伴胸闷1周。',
  presentIllness:
    '患者于10余年前开始出现反复咳嗽，呈阵发性，伴咳痰，少许白色粘痰，多在感冒受凉后出现，反复就诊于当地医院，考虑慢性支气管炎，予抗感染、止咳化痰、平喘等治疗后可缓解，但症状仍反复，此次于1周前受凉后再发咳嗽、咳痰，咳白色粘痰，并感胸闷，无胸痛，无心慌，无腹痛、腹胀、腹泻，无抽搐、昏迷，无畏寒、发热，行胸部CT检查提示慢性支气管炎，今日就诊我院，起病来，患者精神软，饮食、睡眠一般，大小便未见明显异常，近期体重无明显改变。',
  pastHistory: '否认“高血压”、“糖尿病”、“冠心病”等病史，否认“肝炎”、“肺结核”等传染病史，无药物及食物过敏史、无外伤手术史。无输血史。预防接种史不详。',
  physicalExam:
    'T：37.5℃，P：89次\/分，R：21次\/分，BP：136\/68mmHg。发育正常，表情自如，呼吸稍促，神志清楚，自主体位，查体合作。全身皮肤黏膜无黄染及出血点，全身浅表淋巴结无肿大。头颅无畸形，睑结无苍白，双侧瞳孔等大等圆，直径约3.0mm,对光反射灵敏，口唇无发绀，舌居中，咽稍红，扁桃体无肿大，颈软无抵抗。胸廓两侧对称，无畸形，肋间隙增宽，双侧呼吸运动对称，触诊语颤减弱，叩诊双肺呈过清音，双肺呼吸音粗，双肺可闻及少细小湿性啰音。心前区无隆起，心尖搏动不弥散，位于左侧第5肋间锁骨中线内侧0.5cm处，无震颤，叩诊心界不扩大，心率89次\/分，律齐，心音有力，心脏各瓣膜听诊区未闻及病理性杂音。腹平，未见胃肠型及蠕动波，腹壁静脉无曲张，无手术瘢痕，腹软，全腹部无压痛，无反跳痛，肝脾肋下未及，麦氏点无压痛及反跳痛，莫非氏征阴性，双肾区无压痛和叩击痛，移动性浊音阴性，肠鸣音3次\/分。肛门外生殖器未见异常，脊柱呈生理性弯曲，四肢无畸形，活动自如，双下肢无浮肿。生理反射存在，病例反射未引出。',
  auxiliaryExam: '胸部CT示：慢性支气管炎表现。\n血液分析：白细胞11.2*109\/L，中性粒细胞比73.3%，淋巴细胞比率 19.0%，血红蛋白142g\/L，血小板245*109\/L。\n肝功能、肾功能、心肌酶、电解质、血糖、血脂、凝血功能未见明显异常，结合抗体阴性，痰未找到抗酸杆菌。',
}

const hasMedicalRecordInput = computed(() =>
  Object.values(medicalRecord).some((section) => section && section.trim())
)

const buildMedicalRecordText = () => {
  const sections = [
    { label: '主诉', value: medicalRecord.chiefComplaint },
    { label: '现病史', value: medicalRecord.presentIllness },
    { label: '既往史', value: medicalRecord.pastHistory },
    { label: '查体', value: medicalRecord.physicalExam },
    { label: '辅助检查', value: medicalRecord.auxiliaryExam },
  ]

  return sections
    .filter((section) => section.value && section.value.trim())
    .map((section) => `${section.label}：${section.value.trim()}`)
    .join('\n')
}

const loadExample = () => {
  Object.assign(medicalRecord, exampleRecord)
}

const resetLocalDiagnosisState = () => {
  diagnosisResult.value = null
  selectedDisease.value = null
  diagnosisBasis.value = null
}

const clearRecord = () => {
  Object.keys(medicalRecord).forEach((key) => {
    medicalRecord[key] = ''
  })
  resetLocalDiagnosisState()
  currentRecordId.value = ''
  emit('clear-active-record')
}

const clonePlain = (value) => {
  if (value === null || value === undefined) return value
  return JSON.parse(JSON.stringify(value))
}

const persistCurrentRecord = () => {
  if (!diagnosisResult.value) return

  const now = new Date().toISOString()
  const recordId = currentRecordId.value || `diagnosis-${Date.now()}`
  const createdAt =
    props.activeRecord && props.activeRecord.id === recordId
      ? props.activeRecord.createdAt || now
      : now

  const diagnosisResultSnapshot = clonePlain(diagnosisResult.value)
  if (diagnosisResultSnapshot && diagnosisResultSnapshot.timestamp) {
    diagnosisResultSnapshot.timestamp =
      diagnosisResultSnapshot.timestamp instanceof Date
        ? diagnosisResultSnapshot.timestamp.toISOString()
        : diagnosisResultSnapshot.timestamp
  } else if (diagnosisResultSnapshot) {
    diagnosisResultSnapshot.timestamp = now
  }

  const recordPayload = {
    id: recordId,
    createdAt,
    updatedAt: now,
    medicalRecord: clonePlain(medicalRecord),
    diagnosisResult: diagnosisResultSnapshot,
    diagnosisBasis: clonePlain(diagnosisBasis.value),
    selectedDisease: clonePlain(selectedDisease.value),
    currentCount: currentCount.value,
  }

  emit('save-record', recordPayload)
  currentRecordId.value = recordId
}

const handleDiagnose = async () => {
  const medicalRecordText = buildMedicalRecordText()

  if (!medicalRecordText.trim() || isDiagnosing.value) return

  isDiagnosing.value = true
  diagnosisResult.value = null
  selectedDisease.value = null
  diagnosisBasis.value = null

  try {
    const result = await diagnoseDisease(medicalRecord, currentCount.value)

    // 转换新 API 的响应格式
    // API 返回: { results: [{ dia, ala, score }] }
    // 转换为: { diseases: [{ name, analysis, score }] }
    const diseases = (result.results || []).map((item) => {
      return {
        name: item.dia || '',
        analysis: item.ala || '',
        score: item.score || '',
      }
    })

    diagnosisResult.value = {
      diseases: diseases,
      timestamp: new Date(),
    }

    // 如果有诊断结果，默认选择第一个
    if (diagnosisResult.value.diseases.length > 0) {
      selectedDisease.value = diagnosisResult.value.diseases[0]
      diagnosisBasis.value = {
        basis: diagnosisResult.value.diseases[0].analysis || '暂无诊断分析',
        suggestions: [],
      }
      persistCurrentRecord()
    } else {
      persistCurrentRecord()
    }
  } catch (error) {
    console.error('诊断错误:', error)
    diagnosisResult.value = {
      diseases: [],
      timestamp: new Date(),
    }
  } finally {
    isDiagnosing.value = false
  }
}

const selectDisease = (disease) => {
  selectedDisease.value = disease
  // 直接设置诊断依据，因为分析信息已经在疾病对象中
  diagnosisBasis.value = {
    basis: disease.analysis || '暂无诊断分析',
    suggestions: [],
  }
  persistCurrentRecord()
}

watch(
  () => props.activeRecord,
  (newRecord) => {
    if (!newRecord) {
      currentRecordId.value = ''
      return
    }

    currentRecordId.value = newRecord.id ?? ''

    Object.keys(medicalRecord).forEach((key) => {
      medicalRecord[key] = newRecord.medicalRecord?.[key] ?? ''
    })

    if (newRecord.diagnosisResult) {
      const result = { ...newRecord.diagnosisResult }
      if (result.timestamp) {
        result.timestamp = new Date(result.timestamp)
      }
      diagnosisResult.value = result
    } else {
      diagnosisResult.value = null
    }

    selectedDisease.value = newRecord.selectedDisease || null
    diagnosisBasis.value = newRecord.diagnosisBasis || null
    // 恢复currentCount值
    if (newRecord.currentCount !== undefined) {
      currentCount.value = newRecord.currentCount
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="diagnosis-panel">
    <div class="diagnosis-header">
      <h3>电子病历智能诊断</h3>
      <div class="header-actions">
        <button class="action-btn" @click="loadExample" title="加载示例病历">
          示例
        </button>
        <button class="action-btn" @click="clearRecord" title="清空">
          清空
        </button>
      </div>
    </div>

    <div class="diagnosis-content">
      <div class="input-section">
        <div class="record-grid">
          <div class="input-group">
            <label>主诉</label>
            <textarea
              v-model="medicalRecord.chiefComplaint"
              placeholder="示例：男，32岁。反复咳嗽、咳痰10余年，再发加重伴胸闷1周。"
              class="medical-record-input"
              rows="3"
              :disabled="isDiagnosing"
            ></textarea>
          </div>
          <div class="input-group">
            <label>现病史</label>
            <textarea
              v-model="medicalRecord.presentIllness"
              placeholder="示例：患者于10余年前开始出现反复咳嗽，呈阵发性，伴咳痰，少许白色粘痰，多在感冒受凉后出现，反复就诊于当地医院，考虑慢性支气管炎，予抗感染、止咳化痰、平喘等治疗后可缓解，但症状仍反复，此次于1周前受凉后再发咳嗽、咳痰，咳白色粘痰，并感胸闷，无胸痛，无心慌，无腹痛、腹胀、腹泻，无抽搐、昏迷，无畏寒、发热，行胸部CT检查提示慢性支气管炎，今日就诊我院，起病来，患者精神软，饮食、睡眠一般，大小便未见明显异常，近期体重无明显改变。"
              class="medical-record-input"
              rows="3"
              :disabled="isDiagnosing"
            ></textarea>
          </div>
          <div class="input-group">
            <label>既往史</label>
            <textarea
              v-model="medicalRecord.pastHistory"
              placeholder="示例：否认“高血压”、“糖尿病”、“冠心病”等病史，否认“肝炎”、“肺结核”等传染病史，无药物及食物过敏史、无外伤手术史。无输血史。预防接种史不详。"
              class="medical-record-input"
              rows="3"
              :disabled="isDiagnosing"
            ></textarea>
          </div>
          <div class="input-group">
            <label>查体</label>
            <textarea
              v-model="medicalRecord.physicalExam"
              placeholder="示例：T:37.5℃ ,P:89次\/分,R:21次\/分,BP:136\/68\/mmhg。发育正常，表情自如，呼吸稍促，神志清楚，自主体位，查体合作。全身皮肤黏膜无黄染及出血点，全身浅表淋巴结无肿大。头颅无畸形，睑结无苍白，双侧瞳孔等大等圆，直径约3.0mm,对光反射灵敏，口唇无发绀，舌居中，咽稍红，扁桃体无肿大，颈软无抵抗。胸廓两侧对称，无畸形，肋间隙增宽，双侧呼吸运动对称，触诊语颤减弱，叩诊双肺呈过清音，双肺呼吸音粗，双肺可闻及少细小湿性啰音。心前区无隆起，心尖搏动不弥散，位于左侧第5肋间锁骨中线内侧0.5cm处，无震颤，叩诊心界不扩大，心率89次\/分，律齐，心音有力，心脏各瓣膜听诊区未闻及病理性杂音。腹平，未见胃肠型及蠕动波，腹壁静脉无曲张，无手术瘢痕，腹软，全腹部无压痛，无反跳痛，肝脾肋下未及，麦氏点无压痛及反跳痛，莫非氏征阴性，双肾区无压痛和叩击痛，移动性浊音阴性，肠鸣音3次\/分。肛门外生殖器未见异常，脊柱呈生理性弯曲，四肢无畸形，活动自如，双下肢无浮肿。生理反射存在，病例反射未引出。"
              class="medical-record-input"
              rows="3"
              :disabled="isDiagnosing"
            ></textarea>
          </div>
          <div class="input-group">
            <label>辅助检查</label>
            <textarea
              v-model="medicalRecord.auxiliaryExam"
              placeholder="示例：胸部CT示：慢性支气管炎表现。\n血液分析：白细胞11.2*109\/L，中性粒细胞比73.3%，淋巴细胞比率 19.0%，血红蛋白142g\/L，血小板245*109\/L。\n肝功能、肾功能、心肌酶、电解质、血糖、血脂、凝血功能未见明显异常，结合抗体阴性，痰未找到抗酸杆菌。"
              class="medical-record-input"
              rows="3"
              :disabled="isDiagnosing"
            ></textarea>
          </div>
          <div class="input-group">
            <!-- ✅ 新增：允许用户自由设置数量的控件 -->
            <label>设置初步诊断疾病数量：<span style="color:red; font-weight:500">{{currentCount}}</span>（数量越高，诊断越慢）</label>
            <div class="control medical-record-input">
              <!-- 或滑块 -->
              <span>4</span>
              <input 
                v-model.number="currentCount" 
                type="range" 
                :min="min" 
                :max="max" 
                step="1" 
                :disabled="isDiagnosing"
              />
              <span>12</span>
            </div>
          </div>
         
        </div>

        <button
          @click="handleDiagnose"
          :disabled="!hasMedicalRecordInput || isDiagnosing"
          class="diagnose-btn"
        >
          <span v-if="!isDiagnosing">开始诊断</span>
          <span v-else class="diagnosing">
            <span class="spinner"></span>
            诊断中...
          </span>
        </button>
      </div>

      <div v-show="diagnosisResult" class="result-section">
        <div class="result-header">
          <h4>诊断结果</h4>
        </div>

        <div
          v-if="diagnosisResult && diagnosisResult.diseases.length > 0"
          class="diseases-list"
        >
          <div
            v-for="(disease, index) in diagnosisResult.diseases"
            :key="index"
            :class="['disease-item', { active: selectedDisease === disease }]"
            @click="selectDisease(disease)"
          >
            <div class="disease-name">{{ disease.name || disease }}</div>
            <div v-if="disease.score" class="disease-probability">
              {{ disease.score }}
            </div>
          </div>
        </div>

        <div v-else class="no-result">
          <p>未找到明确的疾病诊断</p>
        </div>

        <div v-if="selectedDisease && selectedDisease.analysis" class="basis-section">
          <h5>疾病分析</h5>
          <div class="basis-content">
            <p>{{ selectedDisease.analysis }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.diagnosis-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-background);
}

.diagnosis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background-soft);
}

.diagnosis-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-heading);
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.4rem 0.8rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--color-text);
  transition: all 0.3s;
}

.action-btn:hover {
  background: var(--color-background-soft);
  border-color: #667eea;
}

.progress-bar {
  height: 12px;
  background-color: #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  border-radius: 6px;
  transition: width 0.3s ease;
}

.control {
  margin-top: 12px;
  display: flex;
  
  gap: 8px;
}
.control input[type="number"] {
  padding: 6px;
  width: 100px;
}
.control input[type="range"] {
  width: 100%;
}

.diagnosis-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.input-section {
  margin-bottom: 2rem;
}

.record-grid {
  display: grid;
  gap: 1rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-weight: 500;
  color: var(--color-heading);
  font-size: 0.9rem;
}

.input-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--color-heading);
  font-size: 0.95rem;
}

.medical-record-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
  background: var(--color-background);
  color: var(--color-text);
  line-height: 1.6;
  margin-bottom: 1rem;
  transition: border-color 0.3s;
}

.medical-record-input:focus {
  outline: none;
  border-color: #667eea;
}

.medical-record-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.diagnose-btn {
  width: 100%;
  padding: 0.75rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.3s;
}

.diagnose-btn:hover:not(:disabled) {
  background: #5568d3;
}

.diagnose-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.diagnosing {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.result-section {
  border-top: 1px solid var(--color-border);
  padding-top: 1.5rem;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.result-header h4 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-heading);
}

.diseases-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.disease-item {
  padding: 1rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-background-soft);
}

.disease-item:hover {
  border-color: #667eea;
  background: var(--color-background);
}

.disease-item.active {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.disease-name {
  font-weight: 500;
  color: var(--color-heading);
  font-size: 1rem;
}

.disease-probability {
  font-size: 0.9rem;
  color: #667eea;
  font-weight: 600;
}

.no-result {
  padding: 2rem;
  text-align: center;
  color: var(--color-text);
  opacity: 0.7;
}

.basis-section {
  margin-top: 1.5rem;
  padding: 1rem;
  background: var(--color-background-soft);
  border-radius: 8px;
}

.basis-section h5 {
  margin: 0 0 0.75rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-heading);
}

.basis-content {
  margin-bottom: 1rem;
  white-space: pre-wrap;
}

.basis-content p {
  margin: 0;
  line-height: 1.6;
  color: var(--color-text);
}

.suggestions {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.suggestions h6 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-heading);
}

.suggestions ul {
  margin: 0;
  padding-left: 1.5rem;
  color: var(--color-text);
}

.suggestions li {
  margin: 0.5rem 0;
  line-height: 1.6;
}
</style>

