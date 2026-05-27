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

const emit = defineEmits(['select-record', 'delete-record', 'add-diagnosis'])

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

const handleAdd = () => {
  emit('add-diagnosis')
}
</script>

<template>
  <div class="diagnosis-history">
    <div class="history-header">
      <h3>诊断记录</h3>
      <button class="add-btn" type="button" @click="handleAdd">
        <svg viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
        新诊断
      </button>
    </div>

    <div class="history-content">
      <div v-if="!items.length" class="empty-state">
        <svg viewBox="0 0 32 32" fill="none" class="empty-icon">
          <circle cx="16" cy="16" r="12" stroke="currentColor" stroke-width="1.5" opacity="0.25"/>
          <path d="M16 10v12M10 16h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.25"/>
        </svg>
        <p>暂无诊断记录</p>
      </div>

      <ul v-else class="history-list">
        <li
          v-for="record in items"
          :key="record.id"
          :class="['history-item', { active: record.id === activeId }]"
          @click="handleSelect(record.id)"
        >
          <div class="item-top">
            <div class="item-icon">
              <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.3"/><path d="M8 5.5v5M5.5 8h5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
            </div>
            <div class="item-title">{{ getDiseaseLabel(record) }}</div>
            <button class="delete-btn" type="button" @click="(event) => handleDelete(event, record.id)">
              <svg viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
            </button>
          </div>
          <div class="item-summary">{{ getSummary(record) }}</div>
          <div class="item-meta">{{ getTimeLabel(record) }}</div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.diagnosis-history {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: 0.75rem;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1rem;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.history-header h3 {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--color-heading);
}

.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.7rem;
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  background: var(--color-primary-gradient);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 500;
  font-family: inherit;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-primary);
}

.add-btn svg {
  width: 14px;
  height: 14px;
}

.add-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.35);
}

.history-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 2px;
}

.empty-state {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.empty-icon {
  width: 32px;
  height: 32px;
}

.empty-state p {
  font-size: 0.85rem;
  margin: 0;
}

.history-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0;
  margin: 0;
}

.history-item {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.75rem 0.85rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  background: var(--color-background-soft);
}

.history-item:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
}

.history-item.active {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.06);
}

.item-top {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.item-icon {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: var(--color-background-mute);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--color-text-muted);
}

.item-icon svg {
  width: 13px;
  height: 13px;
}

.history-item.active .item-icon {
  background: var(--color-primary);
  color: white;
}

.item-title {
  flex: 1;
  font-weight: 600;
  font-size: 0.88rem;
  color: var(--color-heading);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-btn {
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  opacity: 0;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.delete-btn svg {
  width: 12px;
  height: 12px;
}

.history-item:hover .delete-btn {
  opacity: 0.6;
}

.delete-btn:hover {
  opacity: 1 !important;
  color: var(--color-danger);
  background: var(--color-danger-soft);
}

.item-summary {
  font-size: 0.82rem;
  color: var(--color-text-muted);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-left: 1.85rem;
}

.item-meta {
  font-size: 0.73rem;
  color: var(--color-text-muted);
  padding-left: 1.85rem;
}

@media (max-width: 768px) {
  .history-item {
    padding: 0.65rem 0.75rem;
  }
}
</style>
