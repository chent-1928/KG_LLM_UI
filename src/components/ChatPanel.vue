<script setup>
import { ref, nextTick, watch, computed } from 'vue'
import { sendMessage } from '../api/assistDoctor.js'
import { createWelcomeMessage } from '../constants/chat.js'

const props = defineProps({
  messages: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:messages'])

const inputMessage = ref('')
const isLoading = ref(false)
const chatContainer = ref(null)
const isShowLoading = ref(false)

const messages = computed(() => props.messages ?? [])

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

watch(
  () => messages.value.length,
  () => {
    scrollToBottom()
  }
)

watch(
  () => props.messages,
  () => {
    scrollToBottom()
  },
  { deep: true }
)

const sendChatMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return

  const userMessage = {
    role: 'user',
    content: inputMessage.value.trim(),
    timestamp: new Date(),
  }

  const updatedMessages = [...messages.value, userMessage]
  emit('update:messages', updatedMessages)

  const currentInput = inputMessage.value
  inputMessage.value = ''
  isLoading.value = true
  isShowLoading.value = true

  scrollToBottom()

  // 创建初始的助手消息，用于流式更新
  let assistantMessage = null
  let isFirstChunk = true

  try {
    // 构建对话历史（转换为后端格式）
    const history = updatedMessages
      .slice(0, -1)
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

    // 调用 AssistDoctor API，传入流式更新回调
    const response = await sendMessage(currentInput, history, (chunk) => {
      // 第一个数据块到达时，创建助手消息
      if (isFirstChunk && chunk.fullContent) {
        isFirstChunk = false
        isShowLoading.value = false
        assistantMessage = {
          role: 'assistant',
          content: chunk.fullContent,
          timestamp: new Date(),
        }
        const currentMessages = [...updatedMessages, assistantMessage]
        emit('update:messages', currentMessages)
      } else if (assistantMessage) {
        // 后续数据块，更新助手消息内容
        assistantMessage.content = chunk.fullContent
        const currentMessages = [...updatedMessages, assistantMessage]
        emit('update:messages', currentMessages)
      }
      scrollToBottom()
    })

    // 确保最终内容已更新
    const finalContent = response.answer || response.content || assistantMessage?.content || '抱歉，我无法理解您的问题。'
    
    // 如果没有创建助手消息（可能没有收到数据块），现在创建
    if (!assistantMessage) {
      assistantMessage = {
        role: 'assistant',
        content: finalContent,
        timestamp: new Date(),
      }
    } else {
      assistantMessage.content = finalContent
    }
    
    // 如果后端返回了完整的消息列表，使用它（但需要转换格式）
    if (response.messages && Array.isArray(response.messages)) {
      // 将后端格式转换为前端格式
      const convertedMessages = response.messages.map((msg, index) => ({
        role: msg.role,
        content: msg.content,
        timestamp: index === response.messages.length - 1 ? new Date() : (updatedMessages[index]?.timestamp || new Date()),
      }))
      emit('update:messages', convertedMessages)
    } else {
      // 否则使用当前的消息列表
      emit('update:messages', [...updatedMessages, assistantMessage])
    }
  } catch (error) {
    console.error('Chat error:', error)
    // 如果还没有创建助手消息，创建一个错误消息
    if (!assistantMessage) {
      assistantMessage = {
        role: 'assistant',
        content: '抱歉，发生了错误。请稍后再试。',
        timestamp: new Date(),
      }
      emit('update:messages', [...updatedMessages, assistantMessage])
    } else {
      // 如果已经有助手消息，更新为错误消息
      assistantMessage.content = '抱歉，发生了错误。请稍后再试。'
      emit('update:messages', [...updatedMessages, assistantMessage])
    }
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}

const handleKeyPress = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendChatMessage()
  }
}

const clearChat = () => {
  emit('update:messages', [createWelcomeMessage()])
}
</script>

<template>
  <div class="chat-panel">
    <div class="chat-header">
      <div class="header-left">
        <div class="header-dot"></div>
        <h3>疾病咨询助手</h3>
      </div>
      <button class="clear-btn" @click="clearChat" title="清空对话">
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M4 7h12M7 7V5.5A1.5 1.5 0 0 1 8.5 4h3A1.5 1.5 0 0 1 13 5.5V7m2 0v8.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 5 15.5V7h10z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>清空</span>
      </button>
    </div>

    <div class="chat-messages" ref="chatContainer">
      <div
        v-for="(message, index) in messages"
        :key="index"
        :class="['message', message.role]"
      >
        <div class="message-avatar">
          <svg v-if="message.role === 'user'" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="7" r="3.5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M3.5 17.5c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <svg v-else viewBox="0 0 20 20" fill="none">
            <rect x="3" y="3" width="14" height="14" rx="3.5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M10 7v6M7 10h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="message-body">
          <div class="message-bubble">{{ message.content }}</div>
          <div class="message-time">
            {{ new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }}
          </div>
        </div>
      </div>

      <div v-if="isLoading && isShowLoading" class="message assistant">
        <div class="message-avatar">
          <svg viewBox="0 0 20 20" fill="none">
            <rect x="3" y="3" width="14" height="14" rx="3.5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M10 7v6M7 10h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="message-body">
          <div class="message-bubble loading-bubble">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
      </div>
    </div>

    <div class="chat-input-area">
      <div class="input-wrapper">
        <textarea
          v-model="inputMessage"
          @keypress="handleKeyPress"
          placeholder="描述您的症状或问题..."
          class="chat-input"
          rows="2"
          :disabled="isLoading"
        ></textarea>
        <button
          @click="sendChatMessage"
          :disabled="!inputMessage.trim() || isLoading"
          class="send-btn"
        >
          <svg v-if="!isLoading" viewBox="0 0 20 20" fill="none">
            <path d="M3.5 10h9M16.5 10l-6-6m6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span v-else class="loading-spinner"></span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-background);
}

/* ── Header ── */
.chat-header {
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
  animation: pulse-dot 2.5s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 3px var(--color-primary-soft); }
  50% { box-shadow: 0 0 0 6px transparent; }
}

.chat-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-heading);
}

.clear-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: none;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  padding: 0.4rem 0.7rem;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  font-family: inherit;
  transition: all var(--transition-fast);
}

.clear-btn:hover {
  color: var(--color-danger);
  background: var(--color-danger-soft);
  border-color: transparent;
}

.clear-btn svg {
  width: 15px;
  height: 15px;
}

/* ── Messages ── */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.message {
  display: flex;
  gap: 0.65rem;
  animation: msg-in 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes msg-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--color-background-mute);
  color: var(--color-text-muted);
}

.message-avatar svg {
  width: 18px;
  height: 18px;
}

.message.user .message-avatar {
  background: var(--color-primary);
  color: white;
}

.message-body {
  max-width: 72%;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  white-space: pre-wrap;
}

.message.user .message-body {
  align-items: flex-end;
}

.message-bubble {
  padding: 0.7rem 1rem;
  border-radius: var(--radius-md);
  line-height: 1.65;
  word-break: break-word;
  background: var(--color-background-mute);
  color: var(--color-text);
  font-size: 0.935rem;
}

.message.user .message-bubble {
  background: var(--color-primary-gradient);
  color: white;
  border-bottom-right-radius: 4px;
}

.message.assistant .message-bubble {
  border-bottom-left-radius: 4px;
}

.message-time {
  font-size: 0.72rem;
  color: var(--color-text-muted);
  padding: 0 0.25rem;
}

/* ── Loading dots ── */
.loading-bubble {
  display: flex;
  gap: 5px;
  padding: 0.9rem 1.1rem;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-primary);
  opacity: 0.5;
  animation: wave 1.3s ease-in-out infinite;
}

.dot:nth-child(2) { animation-delay: 0.15s; }
.dot:nth-child(3) { animation-delay: 0.3s; }

@keyframes wave {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
  30% { transform: translateY(-6px); opacity: 1; }
}

/* ── Input area ── */
.chat-input-area {
  padding: 0.85rem 1.5rem 1rem;
  border-top: 1px solid var(--color-border);
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 0.6rem;
  background: var(--color-background-mute);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.5rem 0.6rem 0.5rem 0;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.input-wrapper:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}

.chat-input {
  flex: 1;
  padding: 0.45rem 0 0.45rem 0.9rem;
  border: none;
  font-size: 0.92rem;
  resize: none;
  background: transparent;
  color: var(--color-text);
  line-height: 1.5;
}

.chat-input::placeholder {
  color: var(--color-text-muted);
}

.chat-input:focus {
  outline: none;
}

.chat-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  background: var(--color-primary-gradient);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.send-btn:hover:not(:disabled) {
  transform: translateX(2px);
  box-shadow: var(--shadow-primary);
}

.send-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  transform: none;
}

.send-btn svg {
  width: 18px;
  height: 18px;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

