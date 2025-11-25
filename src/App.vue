<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import ChatPanel from './components/ChatPanel.vue'
import DiagnosisPanel from './components/DiagnosisPanel.vue'
import ConversationHistory from './components/ConversationHistory.vue'
import DiagnosisHistory from './components/DiagnosisHistory.vue'
import { createConversation } from './constants/chat.js'

const activeTab = ref('chat') // 'chat' 或 'diagnosis'

const STORAGE_KEY = 'assist-doctor-conversations'
const COUNTER_KEY = 'assist-doctor-conversation-counter'
const ACTIVE_KEY = 'assist-doctor-active-conversation'
const DIAGNOSIS_STORAGE_KEY = 'assist-doctor-diagnosis-records'
const DIAGNOSIS_ACTIVE_KEY = 'assist-doctor-active-diagnosis-record'
const ACTIVE_TAB_KEY = 'assist-doctor-active-tab'

const conversationCounter = ref(1)
const conversations = ref([])
const activeConversationId = ref('')
const diagnosisRecords = ref([])
const activeDiagnosisRecordId = ref('')

const ensureDefaultConversation = () => {
  if (!conversations.value.length) {
    const fallback = createConversation(conversationCounter.value)
    conversations.value = [fallback]
    activeConversationId.value = fallback.id
  }
}

onMounted(() => {
  if (typeof window === 'undefined') {
    ensureDefaultConversation()
    return
  }

  try {
    const storedConversations = window.localStorage.getItem(STORAGE_KEY)
    const storedCounter = window.localStorage.getItem(COUNTER_KEY)
    const storedActiveId = window.localStorage.getItem(ACTIVE_KEY)

    if (storedConversations) {
      const parsed = JSON.parse(storedConversations)
      if (Array.isArray(parsed) && parsed.length) {
        conversations.value = parsed
      }
    }

    if (!conversations.value.length) {
      const initial = createConversation(conversationCounter.value)
      conversations.value = [initial]
    }

    if (storedCounter) {
      const parsedCounter = parseInt(storedCounter, 10)
      if (!Number.isNaN(parsedCounter) && parsedCounter > 0) {
        conversationCounter.value = parsedCounter
      }
    } else {
      conversationCounter.value = conversations.value.length
    }

    if (storedActiveId && conversations.value.some((item) => item.id === storedActiveId)) {
      activeConversationId.value = storedActiveId
    } else {
      activeConversationId.value = conversations.value[0]?.id ?? ''
    }
  } catch (error) {
    ensureDefaultConversation()
  }

  try {
    const storedDiagnosisRecords = window.localStorage.getItem(DIAGNOSIS_STORAGE_KEY)
    const storedDiagnosisActiveId = window.localStorage.getItem(DIAGNOSIS_ACTIVE_KEY)

    if (storedDiagnosisRecords) {
      const parsed = JSON.parse(storedDiagnosisRecords)
      if (Array.isArray(parsed)) {
        diagnosisRecords.value = parsed
      }
    }

    if (storedDiagnosisActiveId && diagnosisRecords.value.some((item) => item.id === storedDiagnosisActiveId)) {
      activeDiagnosisRecordId.value = storedDiagnosisActiveId
    } else if (diagnosisRecords.value.length) {
      activeDiagnosisRecordId.value = diagnosisRecords.value[0].id
    }
  } catch (error) {
    diagnosisRecords.value = []
    activeDiagnosisRecordId.value = ''
  }

  try {
    const storedActiveTab = window.localStorage.getItem(ACTIVE_TAB_KEY)
    if (storedActiveTab === 'chat' || storedActiveTab === 'diagnosis') {
      activeTab.value = storedActiveTab
    }
  } catch (error) {
    activeTab.value = 'chat'
  }
})

watch(
  conversations,
  (newValue) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newValue))
  },
  { deep: true }
)

watch(conversationCounter, (newValue) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(COUNTER_KEY, String(newValue))
})

watch(activeConversationId, (newValue) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ACTIVE_KEY, newValue)
})

watch(
  diagnosisRecords,
  (newValue) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(DIAGNOSIS_STORAGE_KEY, JSON.stringify(newValue))
  },
  { deep: true }
)

watch(activeDiagnosisRecordId, (newValue) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(DIAGNOSIS_ACTIVE_KEY, newValue)
})

watch(activeTab, (newValue) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ACTIVE_TAB_KEY, newValue)
  }

  if (newValue === 'diagnosis' && !activeDiagnosisRecordId.value && diagnosisRecords.value.length) {
    activeDiagnosisRecordId.value = diagnosisRecords.value[0].id
  }
})

const activeConversation = computed(() =>
  conversations.value.find((item) => item.id === activeConversationId.value)
)

const activeMessages = computed(() => activeConversation.value?.messages ?? [])
const activeDiagnosisRecord = computed(() =>
  diagnosisRecords.value.find((item) => item.id === activeDiagnosisRecordId.value) || null
)

const addConversation = () => {
  conversationCounter.value += 1
  const newConversation = createConversation(conversationCounter.value)
  conversations.value = [newConversation, ...conversations.value]
  activeConversationId.value = newConversation.id
}

const selectConversation = (id) => {
  activeConversationId.value = id
}

const updateActiveConversationMessages = (updatedMessages) => {
  const index = conversations.value.findIndex((item) => item.id === activeConversationId.value)
  if (index === -1) return

  const updatedConversation = {
    ...conversations.value[index],
    messages: updatedMessages,
  }

  conversations.value = [
    ...conversations.value.slice(0, index),
    updatedConversation,
    ...conversations.value.slice(index + 1),
  ]
}

const deleteConversation = (id) => {
  const index = conversations.value.findIndex((item) => item.id === id)
  if (index === -1) return

  const updatedList = conversations.value.filter((item) => item.id !== id)

  if (updatedList.length === 0) {
    conversationCounter.value += 1
    const fallback = createConversation(conversationCounter.value)
    conversations.value = [fallback]
    activeConversationId.value = fallback.id
    return
  }

  conversations.value = updatedList

  if (activeConversationId.value === id) {
    const nextIndex = index < updatedList.length ? index : updatedList.length - 1
    activeConversationId.value = updatedList[nextIndex].id
  }
}

const upsertDiagnosisRecord = (record) => {
  if (!record?.id) return

  const filtered = diagnosisRecords.value.filter((item) => item.id !== record.id)
  diagnosisRecords.value = [record, ...filtered]
  activeDiagnosisRecordId.value = record.id
}

const selectDiagnosisRecord = (id) => {
  activeDiagnosisRecordId.value = id
}

const deleteDiagnosisRecord = (id) => {
  const existingIndex = diagnosisRecords.value.findIndex((item) => item.id === id)
  if (existingIndex === -1) return

  const updated = diagnosisRecords.value.filter((item) => item.id !== id)
  diagnosisRecords.value = updated

  if (activeDiagnosisRecordId.value === id) {
    activeDiagnosisRecordId.value = updated[0]?.id ?? ''
  }
}

const clearDiagnosisRecords = () => {
  diagnosisRecords.value = []
  activeDiagnosisRecordId.value = ''
}

const handleClearActiveDiagnosisRecord = () => {
  activeDiagnosisRecordId.value = ''
}
</script>

<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <header class="navbar">
      <div class="navbar-content">
        <div class="logo">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="logo-text">AssistDoctor</span>
        </div>
        <div class="nav-tabs">
          <button
            :class="['tab-btn', { active: activeTab === 'chat' }]"
            @click="activeTab = 'chat'"
          >
            💬 疾病咨询助手
          </button>
          <button
            :class="['tab-btn', { active: activeTab === 'diagnosis' }]"
            @click="activeTab = 'diagnosis'"
          >
            🔬 智能诊断
          </button>
        </div>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="main-content">
      <!-- 左侧面板 -->
      <aside class="left-panel">
        <ConversationHistory
          v-if="activeTab === 'chat'"
          :conversations="conversations"
          :active-id="activeConversationId"
          @add-conversation="addConversation"
          @select-conversation="selectConversation"
          @delete-conversation="deleteConversation"
        />
        <DiagnosisHistory
          v-else
          :records="diagnosisRecords"
          :active-id="activeDiagnosisRecordId"
          @select-record="selectDiagnosisRecord"
          @delete-record="deleteDiagnosisRecord"
          @clear-records="clearDiagnosisRecords"
        />
      </aside>

      <!-- 右侧面板 -->
      <div class="right-panel">
        <ChatPanel
          v-if="activeTab === 'chat'"
          :key="activeConversationId"
          :messages="activeMessages"
          @update:messages="updateActiveConversationMessages"
        />
        <DiagnosisPanel
          v-if="activeTab === 'diagnosis'"
          :active-record="activeDiagnosisRecord"
          @save-record="upsertDiagnosisRecord"
          @clear-active-record="handleClearActiveDiagnosisRecord"
        />
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
  overflow: hidden;
}

/* 导航栏样式 */
.navbar {
  background: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.navbar-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-heading);
  font-weight: 600;
  font-size: 1.25rem;
}

.logo svg {
  width: 32px;
  height: 32px;
  color: #667eea;
}

.logo-text {
  color: var(--color-heading);
}

.nav-tabs {
  display: flex;
  gap: 0.5rem;
}

.tab-btn {
  padding: 0.5rem 1.25rem;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  color: var(--color-text);
  transition: all 0.3s ease;
  font-family: inherit;
}

.tab-btn:hover {
  background: var(--color-background);
  border-color: #667eea;
}

.tab-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

/* 主内容区域 */
.main-content {
  flex: 1;
  min-height: 0;
  height: 100%;
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 1.5rem;
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
  padding: 1.5rem;
  overflow: hidden;
}

/* 左侧面板 */
.left-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.left-panel > * {
  flex: 1;
  min-height: 0;
}

/* 右侧面板 */
.right-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
}

.right-panel > * {
  flex: 1;
  min-height: 0;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 250px 1fr;
    gap: 1rem;
    padding: 1rem;
  }
}

@media (max-width: 768px) {
  .navbar-content {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
  }

  .nav-tabs {
    width: 100%;
    justify-content: center;
  }

  .main-content {
    grid-template-columns: 1fr;
    padding: 1rem;
  }

  .left-panel {
    order: 2;
  }

  .right-panel {
    order: 1;
  }
}
</style>
