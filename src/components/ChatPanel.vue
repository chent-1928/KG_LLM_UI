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

  scrollToBottom()

  try {
    // 构建对话历史
    const history = updatedMessages
      .slice(0, -1)
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

    // 调用 AssistDoctor API
    const response = await sendMessage(currentInput, history)

    const assistantMessage = {
      role: 'assistant',
      content: response.answer || response.content || '抱歉，我无法理解您的问题。',
      timestamp: new Date(),
    }

    emit('update:messages', [...updatedMessages, assistantMessage])
  } catch (error) {
    const errorMessage = {
      role: 'assistant',
      content: '抱歉，发生了错误。请稍后再试。',
      timestamp: new Date(),
    }
    emit('update:messages', [...updatedMessages, errorMessage])
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
      <h3>对话助手</h3>
      <button class="clear-btn" @click="clearChat" title="清空对话">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <div class="chat-messages" ref="chatContainer">
      <div
        v-for="(message, index) in messages"
        :key="index"
        :class="['message', message.role]"
      >
        <div class="message-avatar">
          <span v-if="message.role === 'user'">👤</span>
          <span v-else>🤖</span>
        </div>
        <div class="message-content">
          <div class="message-text">{{ message.content }}</div>
          <div class="message-time">
            {{ new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }}
          </div>
        </div>
      </div>

      <div v-if="isLoading" class="message assistant">
        <div class="message-avatar">🤖</div>
        <div class="message-content">
          <div class="loading-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

    <div class="chat-input-container">
      <textarea
        v-model="inputMessage"
        @keypress="handleKeyPress"
        placeholder="请输入您的问题..."
        class="chat-input"
        rows="3"
        :disabled="isLoading"
      ></textarea>
      <button
        @click="sendChatMessage"
        :disabled="!inputMessage.trim() || isLoading"
        class="send-btn"
      >
        <svg v-if="!isLoading" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span v-else class="loading-spinner"></span>
      </button>
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

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background-soft);
}

.chat-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-heading);
}

.clear-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: var(--color-text);
  opacity: 0.6;
  transition: opacity 0.3s;
  display: flex;
  align-items: center;
}

.clear-btn:hover {
  opacity: 1;
}

.clear-btn svg {
  width: 18px;
  height: 18px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.message {
  display: flex;
  gap: 0.75rem;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
  background: var(--color-background-soft);
}

.message.user .message-avatar {
  background: #667eea;
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.message.user .message-content {
  align-items: flex-end;
}

.message-text {
  padding: 0.75rem 1rem;
  border-radius: 12px;
  line-height: 1.6;
  word-wrap: break-word;
  background: var(--color-background-soft);
  color: var(--color-text);
}

.message.user .message-text {
  background: #667eea;
  color: white;
}

.message-time {
  font-size: 0.75rem;
  color: var(--color-text);
  opacity: 0.6;
  padding: 0 0.5rem;
}

.loading-indicator {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
}

.loading-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-text);
  opacity: 0.6;
  animation: bounce 1.4s infinite ease-in-out;
}

.loading-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.chat-input-container {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-background-soft);
}

.chat-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  resize: none;
  background: var(--color-background);
  color: var(--color-text);
  transition: border-color 0.3s;
}

.chat-input:focus {
  outline: none;
  border-color: #667eea;
}

.chat-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.send-btn {
  padding: 0.75rem 1.25rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
  min-width: 48px;
}

.send-btn:hover:not(:disabled) {
  background: #5568d3;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn svg {
  width: 20px;
  height: 20px;
}

.loading-spinner {
  width: 20px;
  height: 20px;
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
</style>

