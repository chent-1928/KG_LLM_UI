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
        <span>＋ 新增对话</span>
      </button>
    </div>

    <div class="history-content">
      <div v-if="!items.length" class="empty-state">
        <p>暂无对话记录，点击“新增对话”开始。</p>
      </div>

      <ul v-else class="history-list">
        <li
          v-for="item in items"
          :key="item.id"
          :class="['history-item', { active: item.id === activeId }]"
          @click="handleSelect(item.id)"
        >
          <div class="history-top">
            <div class="history-title">{{ item.title }}</div>
            <button class="delete-btn" type="button" @click="(event) => handleDelete(event, item.id)">
              ✕
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
  gap: 1rem;
  height: 100%;
  min-height: 0;
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

.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  background: #667eea;
  color: #fff;
  font-size: 0.9rem;
  transition: background 0.3s ease;
}

.add-btn:hover {
  background: #5568d3;
}

.history-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.history-content::-webkit-scrollbar {
  width: 6px;
}

.history-content::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.4);
  border-radius: 999px;
}

.history-content::-webkit-scrollbar-track {
  background: transparent;
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

.history-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.history-item:hover {
  border-color: #667eea;
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.12);
}

.history-item.active {
  border-color: #667eea;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.18);
}

.history-title {
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

.history-preview {
  font-size: 0.9rem;
  color: var(--color-text);
  opacity: 0.8;
  line-height: 1.4;
}

.history-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--color-text);
  opacity: 0.6;
}

@media (max-width: 768px) {
  .conversation-history {
    gap: 0.75rem;
  }

  .history-item {
    padding: 0.75rem 0.9rem;
  }
}
</style>

