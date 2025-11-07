<script setup>
import { computed } from 'vue'

const props = defineProps({
  records: {
    type: Array,
    default: () => [],
  },
  activeId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['select-record', 'delete-record', 'clear-records'])

const items = computed(() => props.records ?? [])

const getSummary = (record) => {
  const medical = record?.medicalRecord
  if (!medical) return '暂无病历信息'
  if (medical.chiefComplaint) {
    return medical.chiefComplaint.length > 40
      ? `${medical.chiefComplaint.slice(0, 40)}...`
      : medical.chiefComplaint
  }
  if (medical.presentIllness) {
    return medical.presentIllness.length > 40
      ? `${medical.presentIllness.slice(0, 40)}...`
      : medical.presentIllness
  }
  return '暂无病历信息'
}

const getTimeLabel = (record) => {
  const time = record?.updatedAt || record?.createdAt
  if (!time) return ''
  try {
    return new Date(time).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch (error) {
    return ''
  }
}

const getDiseaseLabel = (record) => {
  const diseases = record?.diagnosisResult?.diseases
  if (!Array.isArray(diseases) || diseases.length === 0) return '未得出明确诊断'
  const first = diseases[0]
  if (typeof first === 'string') return first
  if (first?.name) return first.name
  return '未得出明确诊断'
}

const handleSelect = (id) => {
  emit('select-record', id)
}

const handleDelete = (event, id) => {
  event.stopPropagation()
  emit('delete-record', id)
}

const handleClear = () => {
  emit('clear-records')
}
</script>

<template>
  <div class="diagnosis-history">
    <div class="history-header">
      <h3>诊断记录</h3>
      <button class="clear-btn" type="button" :disabled="!items.length" @click="handleClear">
        清空记录
      </button>
    </div>

    <div v-if="!items.length" class="empty-state">
      <p>暂无诊断记录，完成诊断后会自动保存。</p>
    </div>

    <ul v-else class="history-list">
      <li
        v-for="record in items"
        :key="record.id"
        :class="['history-item', { active: record.id === activeId }]"
        @click="handleSelect(record.id)"
      >
        <div class="item-top">
          <div class="item-title">{{ getDiseaseLabel(record) }}</div>
          <button class="delete-btn" type="button" @click="(event) => handleDelete(event, record.id)">
            ✕
          </button>
        </div>
        <div class="item-summary">{{ getSummary(record) }}</div>
        <div class="item-meta">{{ getTimeLabel(record) }}</div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.diagnosis-history {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.history-header h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--color-heading);
}

.clear-btn {
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: transparent;
  cursor: pointer;
  color: var(--color-text);
  transition: all 0.3s ease;
  font-size: 0.85rem;
}

.clear-btn:hover:enabled {
  border-color: #f56565;
  color: #f56565;
}

.clear-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-state {
  padding: 1rem 1.25rem;
  border: 1px dashed var(--color-border);
  border-radius: 12px;
  text-align: center;
  color: var(--color-text);
  opacity: 0.7;
}

.history-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0;
  margin: 0;
}

.history-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  background: var(--color-background);
}

.history-item:hover {
  border-color: #667eea;
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.12);
}

.history-item.active {
  border-color: #667eea;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.18);
}

.item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.item-title {
  font-weight: 600;
  color: var(--color-heading);
}

.delete-btn {
  border: none;
  background: transparent;
  color: var(--color-text);
  opacity: 0.4;
  cursor: pointer;
  font-size: 0.9rem;
  transition: opacity 0.2s ease;
}

.delete-btn:hover {
  opacity: 0.9;
}

.item-summary {
  font-size: 0.9rem;
  color: var(--color-text);
  opacity: 0.8;
  line-height: 1.4;
}

.item-meta {
  font-size: 0.8rem;
  color: var(--color-text);
  opacity: 0.6;
}

@media (max-width: 768px) {
  .diagnosis-history {
    gap: 0.75rem;
  }

  .history-item {
    padding: 0.75rem 0.9rem;
  }
}
</style>

