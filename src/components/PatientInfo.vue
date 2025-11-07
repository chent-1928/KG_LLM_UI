<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  patientInfo: {
    type: Object,
    default: () => ({}),
  },
})

const patient = ref({
  name: props.patientInfo.name || '未填写',
  age: props.patientInfo.age || '未填写',
  gender: props.patientInfo.gender || '未填写',
  id: props.patientInfo.id || '未填写',
  visitDate: props.patientInfo.visitDate || new Date().toLocaleDateString('zh-CN'),
})

watch(() => props.patientInfo, (newInfo) => {
  if (newInfo) {
    patient.value = {
      name: newInfo.name || patient.value.name,
      age: newInfo.age || patient.value.age,
      gender: newInfo.gender || patient.value.gender,
      id: newInfo.id || patient.value.id,
      visitDate: newInfo.visitDate || patient.value.visitDate,
    }
  }
}, { deep: true })
</script>

<template>
  <div class="patient-info">
    <div class="info-header">
      <h3>患者信息</h3>
    </div>
    <div class="info-content">
      <div class="info-item">
        <span class="info-label">姓名</span>
        <span class="info-value">{{ patient.name }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">年龄</span>
        <span class="info-value">{{ patient.age }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">性别</span>
        <span class="info-value">{{ patient.gender }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">病历号</span>
        <span class="info-value">{{ patient.id }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">就诊日期</span>
        <span class="info-value">{{ patient.visitDate }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.patient-info {
  background: var(--color-background-soft);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.info-header {
  padding: 1rem 1.25rem;
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border);
}

.info-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-heading);
}

.info-content {
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.info-label {
  font-size: 0.9rem;
  color: var(--color-text);
  opacity: 0.7;
}

.info-value {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-heading);
}
</style>

