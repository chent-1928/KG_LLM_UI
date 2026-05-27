<script setup>
import { computed } from 'vue'

const props = defineProps({
  conversations: {
    type: Array,
    default: () => [],
  },
  activeId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['add-conversation', 'select-conversation', 'delete-conversation'])

const items = computed(() => props.conversations ?? [])

const getPreview = (conversation) => {
  if (!conversation?.messages?.length) return '暂无消息'
  const lastMessage = [...conversation.messages].reverse().find((message) => message?.content)
  if (!lastMessage) return '暂无消息'
  return lastMessage.content.length > 30
    ? `${lastMessage.content.slice(0, 30)}...`
    : lastMessage.content
}

const getTimeLabel = (conversation) => {
  if (!conversation?.messages?.length) return ''
  const lastMessage = conversation.messages[conversation.messages.length - 1]
  const date = lastMessage?.timestamp || conversation.createdAt
  if (!date) return ''
  return new Date(date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const handleSelect = (id) => {
  emit('select-conversation', id)
}

const handleAdd = () => {
  emit('add-conversation')
}

const handleDelete = (event, id) => {
  event.stopPropagation()
  emit('delete-conversation', id)
}
</script>

<template>
  <div class="conversation-history">
    <div class="history-header">
      <h3>对话历史</h3>
      <button class="add-btn" type="button" @click="handleAdd">
        <svg viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
        新对话
      </button>
    </div>

    <div class="history-content">
      <div v-if="!items.length" class="empty-state">
        <svg viewBox="0 0 32 32" fill="none" class="empty-icon">
          <rect x="4" y="6" width="24" height="20" rx="4" stroke="currentColor" stroke-width="1.5" opacity="0.25"/>
          <path d="M10 14h12M10 19h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.25"/>
        </svg>
        <p>暂无对话记录</p>
      </div>

      <ul v-else class="history-list">
        <li
          v-for="item in items"
          :key="item.id"
          :class="['history-item', { active: item.id === activeId }]"
          @click="handleSelect(item.id)"
        >
          <div class="history-top">
            <div class="item-icon">
              <svg viewBox="0 0 16 16" fill="none"><path d="M3 3.5A1.5 1.5 0 0 1 4.5 2h7A1.5 1.5 0 0 1 13 3.5v7a1.5 1.5 0 0 1-1.5 1.5H6l-2.4 2a.4.4 0 0 1-.6-.3V3.5z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <div class="history-title">{{ item.title }}</div>
            <button class="delete-btn" type="button" @click="(event) => handleDelete(event, item.id)">
              <svg viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
            </button>
          </div>
          <div class="history-preview">{{ getPreview(item) }}</div>
          <div class="history-meta">
            <span>{{ getTimeLabel(item) }}</span>
            <span>{{ item.messages?.length ?? 0 }} 条消息</span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.conversation-history {
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

.history-top {
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

.history-title {
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

.history-preview {
  font-size: 0.82rem;
  color: var(--color-text-muted);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-left: 1.85rem;
}

.history-meta {
  display: flex;
  justify-content: space-between;
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
