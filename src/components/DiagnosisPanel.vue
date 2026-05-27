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
const currentCount = ref(4)

const fillWidth = computed(() => {
  const clamped = Math.max(min, Math.min(currentCount.value, max))
  return ((clamped - min) / (max - min)) * 100
})

const exampleRecord = {
  chiefComplaint: '男，32岁。反复咳嗽、咳痰10余年，再发加重伴胸闷1周。',
  presentIllness:
    '患者于10余年前开始出现反复咳嗽，呈阵发性，伴咳痰，少许白色粘痰，多在感冒受凉后出现，反复就诊于当地医院，考虑慢性支气管炎，予抗感染、止咳化痰、平喘等治疗后可缓解，但症状仍反复，此次于1周前受凉后再发咳嗽、咳痰，咳白色粘痰，并感胸闷，无胸痛，无心慌，无腹痛、腹胀、腹泻，无抽搐、昏迷，无畏寒、发热，行胸部CT检查提示慢性支气管炎，今日就诊我院，起病来，患者精神软，饮食、睡眠一般，大小便未见明显异常，近期体重无明显改变。',
  pastHistory: '否认"高血压"、"糖尿病"、"冠心病"等病史，否认"肝炎"、"肺结核"等传染病史，无药物及食物过敏史、无外伤手术史。无输血史。预防接种史不详。',
  physicalExam:
    'T：37.5℃，P：89次/分，R：21次/分，BP：136/68mmHg。发育正常，表情自如，呼吸稍促，神志清楚，自主体位，查体合作。全身皮肤黏膜无黄染及出血点，全身浅表淋巴结无肿大。头颅无畸形，睑结无苍白，双侧瞳孔等大等圆，直径约3.0mm,对光反射灵敏，口唇无发绀，舌居中，咽稍红，扁桃体无肿大，颈软无抵抗。胸廓两侧对称，无畸形，肋间隙增宽，双侧呼吸运动对称，触诊语颤减弱，叩诊双肺呈过清音，双肺呼吸音粗，双肺可闻及少细小湿性啰音。心前区无隆起，心尖搏动不弥散，位于左侧第5肋间锁骨中线内侧0.5cm处，无震颤，叩诊心界不扩大，心率89次/分，律齐，心音有力，心脏各瓣膜听诊区未闻及病理性杂音。腹平，未见胃肠型及蠕动波，腹壁静脉无曲张，无手术瘢痕，腹软，全腹部无压痛，无反跳痛，肝脾肋下未及，麦氏点无压痛及反跳痛，莫非氏征阴性，双肾区无压痛和叩击痛，移动性浊音阴性，肠鸣音3次/分。肛门外生殖器未见异常，脊柱呈生理性弯曲，四肢无畸形，活动自如，双下肢无浮肿。生理反射存在，病例反射未引出。',
  auxiliaryExam: '胸部CT示：慢性支气管炎表现。\n血液分析：白细胞11.2*109/L，中性粒细胞比73.3%，淋巴细胞比率 19.0%，血红蛋白142g/L，血小板245*109/L。\n肝功能、肾功能、心肌酶、电解质、血糖、血脂、凝血功能未见明显异常，结合抗体阴性，痰未找到抗酸杆菌。',
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
      <div class="header-left">
        <div class="header-dot"></div>
        <h3>电子病历智能诊断</h3>
      </div>
      <div class="header-actions">
        <button class="action-btn example-btn" @click="loadExample">
          <svg viewBox="0 0 16 16" fill="none"><path d="M2 3.5h12M2 8h8M2 12.5h10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
          示例
        </button>
        <button class="action-btn clear-btn-d" @click="clearRecord">
          <svg viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
          清空
        </button>
      </div>
    </div>

    <div class="diagnosis-content" data-export-scroll>
      <div class="input-section">
        <div class="record-grid">
          <div v-for="field in [
            { key: 'chiefComplaint', label: '主诉', rows: 2, placeholder: '男，32岁。反复咳嗽、咳痰10余年，再发加重伴胸闷1周。' },
            { key: 'presentIllness', label: '现病史', rows: 3, placeholder: '患者的起病时间、症状演变、诊治经过...' },
            { key: 'pastHistory', label: '既往史', rows: 2, placeholder: '既往疾病史、手术史、过敏史等...' },
            { key: 'physicalExam', label: '查体', rows: 3, placeholder: '体温、脉搏、呼吸、血压及体格检查结果...' },
            { key: 'auxiliaryExam', label: '辅助检查', rows: 3, placeholder: '影像学检查、实验室检查等结果...' },
          ]" :key="field.key" class="input-group">
            <label class="field-label">
              <span class="label-indicator"></span>
              {{ field.label }}
            </label>
            <textarea
              v-model="medicalRecord[field.key]"
              :placeholder="field.placeholder"
              class="medical-input"
              :rows="field.rows"
              :disabled="isDiagnosing"
            ></textarea>
          </div>

          <div class="input-group range-group">
            <label class="field-label">
              <span class="label-indicator"></span>
              诊断疾病数量
              <span class="count-badge">{{ currentCount }}</span>
            </label>
            <div class="range-wrapper">
              <span class="range-label">{{ min }}</span>
              <div class="range-track-container">
                <input
                  v-model.number="currentCount"
                  type="range"
                  :min="min"
                  :max="max"
                  step="1"
                  :disabled="isDiagnosing"
                  class="range-input"
                />
                <div class="range-fill" :style="{ width: fillWidth + '%' }"></div>
              </div>
              <span class="range-label">{{ max }}</span>
            </div>
            <p class="range-hint">数量越多诊断耗时越长</p>
          </div>
        </div>

        <button
          @click="handleDiagnose"
          :disabled="!hasMedicalRecordInput || isDiagnosing"
          class="diagnose-btn"
        >
          <template v-if="!isDiagnosing">
            <svg viewBox="0 0 20 20" fill="none" class="btn-icon"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.6"/><path d="M10 7v6M7 10h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            开始诊断
          </template>
          <span v-else class="diagnosing">
            <span class="spinner"></span>
            正在分析病历...
          </span>
        </button>
      </div>

      <div v-show="diagnosisResult" class="result-section">
        <div class="result-divider">
          <span>诊断结果</span>
        </div>

        <div
          v-if="diagnosisResult && diagnosisResult.diseases.length > 0"
          class="diseases-grid"
        >
          <div
            v-for="(disease, index) in diagnosisResult.diseases"
            :key="index"
            :class="['disease-card', { active: selectedDisease === disease }]"
            @click="selectDisease(disease)"
          >
            <div class="card-rank">{{ index + 1 }}</div>
            <div class="card-body">
              <div class="disease-name">{{ disease.name || disease }}</div>
              <div v-if="disease.score" class="disease-score">{{ disease.score }}</div>
            </div>
            <svg v-if="selectedDisease === disease" class="check-icon" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3.5 3.5L13 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
        </div>

        <div v-else class="no-result">
          <svg viewBox="0 0 40 40" fill="none" class="empty-icon">
            <circle cx="20" cy="20" r="16" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
            <path d="M14 20h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.3"/>
          </svg>
          <p>未找到明确的疾病诊断</p>
        </div>

        <div v-if="selectedDisease && selectedDisease.analysis" class="analysis-card">
          <div class="analysis-header">
            <svg viewBox="0 0 18 18" fill="none" class="analysis-icon"><path d="M9 2v14M2 9h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/><circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.5"/></svg>
            <h5>疾病分析</h5>
          </div>
          <div class="analysis-body">
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

/* ── Header ── */
.diagnosis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.9rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.header-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}

.diagnosis-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-heading);
}

.header-actions {
  display: flex;
  gap: 0.4rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.38rem 0.7rem;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-family: inherit;
  transition: all var(--transition-fast);
}

.action-btn svg {
  width: 14px;
  height: 14px;
}

.example-btn:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
}

.clear-btn-d:hover {
  color: var(--color-danger);
  border-color: var(--color-danger);
  background: var(--color-danger-soft);
}

/* ── Content ── */
.diagnosis-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem 1.5rem;
}

.input-section {
  margin-bottom: 1.5rem;
}

.record-grid {
  display: grid;
  gap: 0.9rem;
  margin-bottom: 1.25rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-weight: 500;
  color: var(--color-heading);
  font-size: 0.85rem;
}

.label-indicator {
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: var(--color-primary-gradient);
}

.medical-input {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  background: var(--color-background-mute);
  color: var(--color-text);
  line-height: 1.6;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.medical-input::placeholder {
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.medical-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
  background: var(--color-background);
}

.medical-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Range slider ── */
.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 20px;
  padding: 0 5px;
  border-radius: 5px;
  background: var(--color-primary);
  color: white;
  font-size: 0.72rem;
  font-weight: 700;
  margin-left: auto;
}

.range-wrapper {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.6rem 0.85rem;
  background: var(--color-background-mute);
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--color-border);
}

.range-label {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  font-weight: 600;
  min-width: 18px;
  text-align: center;
}

.range-track-container {
  flex: 1;
  position: relative;
  height: 6px;
}

.range-fill {
  position: absolute;
  top: 50%;
  left: 0;
  height: 6px;
  transform: translateY(-50%);
  background: var(--color-primary-gradient);
  border-radius: 3px;
  pointer-events: none;
  z-index: 1;
}

.range-input {
  width: 100%;
  position: relative;
  z-index: 2;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
  height: 6px;
}

.range-input::-webkit-slider-runnable-track {
  height: 6px;
  border-radius: 3px;
  background: var(--color-border);
}

.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  border: 2.5px solid var(--color-primary);
  margin-top: -6px;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-fast);
}

.range-input::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

.range-input::-moz-range-track {
  height: 6px;
  border-radius: 3px;
  background: var(--color-border);
  border: none;
}

.range-input::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  border: 2.5px solid var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.range-hint {
  margin: 0.3rem 0 0;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* ── Diagnose button ── */
.diagnose-btn {
  width: 100%;
  padding: 0.75rem;
  background: var(--color-primary-gradient);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-primary);
}

.btn-icon {
  width: 18px;
  height: 18px;
}

.diagnose-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(13, 148, 136, 0.35);
}

.diagnose-btn:active:not(:disabled) {
  transform: translateY(0);
}

.diagnose-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
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
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Result section ── */
.result-section {
  padding-top: 0.5rem;
}

.result-divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.5rem 0 1.25rem;
  color: var(--color-heading);
  font-size: 0.9rem;
  font-weight: 600;
}

.result-divider::before,
.result-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

.diseases-grid {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  margin-bottom: 1.25rem;
}

.disease-card {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem 1rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  background: var(--color-background-mute);
}

.disease-card:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
}

.disease-card.active {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.08);
}

.card-rank {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: var(--color-background-soft);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
  font-weight: 700;
  flex-shrink: 0;
}

.disease-card.active .card-rank {
  background: var(--color-primary);
  color: white;
}

.card-body {
  flex: 1;
  min-width: 0;
}

.disease-name {
  font-weight: 600;
  color: var(--color-heading);
  font-size: 0.92rem;
}

.disease-score {
  font-size: 0.8rem;
  color: var(--color-primary);
  font-weight: 600;
  margin-top: 0.15rem;
}

.check-icon {
  width: 16px;
  height: 16px;
  color: var(--color-primary);
  flex-shrink: 0;
}

.no-result {
  padding: 2.5rem 1rem;
  text-align: center;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.empty-icon {
  width: 40px;
  height: 40px;
}

.no-result p {
  margin: 0;
  font-size: 0.9rem;
}

/* ── Analysis card ── */
.analysis-card {
  margin-top: 1rem;
  border-radius: var(--radius-md);
  background: var(--color-background-mute);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.analysis-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);
}

.analysis-icon {
  width: 16px;
  height: 16px;
  color: var(--color-primary);
}

.analysis-header h5 {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--color-heading);
}

.analysis-body {
  padding: 1rem;
  white-space: pre-wrap;
}

.analysis-body p {
  margin: 0;
  line-height: 1.7;
  color: var(--color-text);
  font-size: 0.9rem;
}
</style>
