<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import ChatPanel from './components/ChatPanel.vue'
import DiagnosisPanel from './components/DiagnosisPanel.vue'
import ConversationHistory from './components/ConversationHistory.vue'
import DiagnosisHistory from './components/DiagnosisHistory.vue'
import KnowledgeGraph from './components/KnowledgeGraph.vue'
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
    if (storedActiveTab === 'chat' || storedActiveTab === 'diagnosis' || storedActiveTab === 'graph') {
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

const addDiagnosis = () => {
  // 创建新的空白诊断记录
  const now = new Date().toISOString()
  const newRecord = {
    id: `diagnosis-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    medicalRecord: {
      chiefComplaint: '',
      presentIllness: '',
      pastHistory: '',
      physicalExam: '',
      auxiliaryExam: '',
    },
    diagnosisResult: null,
    diagnosisBasis: null,
    selectedDisease: null,
    currentCount: 4, // 默认值与DiagnosisPanel组件中的初始值一致
  }
  
  // 将新记录添加到列表顶部
  diagnosisRecords.value = [newRecord, ...diagnosisRecords.value]
  
  // 设置为当前活动记录
  activeDiagnosisRecordId.value = newRecord.id
}
</script>

<template>
  <div class="app-container">
    <header class="navbar">
      <div class="navbar-inner">
        <div class="logo">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="url(#logo-grad)" opacity="0.15"/>
              <path d="M12 8v8M8 12h8" stroke="url(#logo-grad)" stroke-width="2.5" stroke-linecap="round"/>
              <defs>
                <linearGradient id="logo-grad" x1="2" y1="2" x2="22" y2="22">
                  <stop stop-color="#0d9488"/>
                  <stop offset="1" stop-color="#2dd4bf"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span class="logo-text">Assist<span class="logo-accent">Doctor</span></span>
        </div>

        <nav class="nav-tabs" role="tablist">
          <button
            v-for="tab in [
              { key: 'chat', label: '疾病咨询', icon: 'chat' },
              { key: 'diagnosis', label: '智能诊断', icon: 'diagnosis' },
              { key: 'graph', label: '知识图谱', icon: 'graph' },
            ]"
            :key="tab.key"
            role="tab"
            :aria-selected="activeTab === tab.key"
            :class="['tab-btn', { active: activeTab === tab.key }]"
            @click="activeTab = tab.key"
          >
            <svg v-if="tab.icon === 'chat'" class="tab-icon" viewBox="0 0 20 20" fill="none">
              <path d="M5 7h10M5 10.5h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              <path d="M3 4.5A1.5 1.5 0 0 1 4.5 3h11A1.5 1.5 0 0 1 17 4.5v8a1.5 1.5 0 0 1-1.5 1.5H7l-3.3 2.8a.5.5 0 0 1-.7-.4V4.5z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg v-else-if="tab.icon === 'diagnosis'" class="tab-icon" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.6"/>
              <path d="M10 7v6M7 10h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
            <svg v-else class="tab-icon" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="4.5" r="2.5" stroke="currentColor" stroke-width="1.4"/>
              <circle cx="4" cy="15" r="2.5" stroke="currentColor" stroke-width="1.4"/>
              <circle cx="16" cy="15" r="2.5" stroke="currentColor" stroke-width="1.4"/>
              <path d="M8.5 6.5L5.5 13M11.5 6.5L14.5 13" stroke="currentColor" stroke-width="1.3"/>
            </svg>
            {{ tab.label }}
          </button>
        </nav>
      </div>
    </header>

    <main class="main-content" :class="{ 'full-width': activeTab === 'graph' }">
      <aside v-if="activeTab !== 'graph'" class="left-panel">
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
          @add-diagnosis="addDiagnosis"
        />
      </aside>

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
        <KnowledgeGraph v-if="activeTab === 'graph'" />
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

/* ── Navbar ── */
.navbar {
  background: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: var(--shadow-sm);
}

.navbar-inner {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0.75rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  user-select: none;
}

.logo-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon svg {
  width: 100%;
  height: 100%;
}

.logo-text {
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-heading);
}

.logo-accent {
  color: var(--color-primary);
}

/* ── Tab buttons ── */
.nav-tabs {
  display: flex;
  gap: 0.375rem;
  background: var(--color-background-mute);
  padding: 4px;
  border-radius: var(--radius-md);
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1.15rem;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-muted);
  transition: all var(--transition-fast);
  font-family: inherit;
  white-space: nowrap;
}

.tab-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.tab-btn:hover {
  color: var(--color-heading);
}

.tab-btn.active {
  background: var(--color-background-soft);
  color: var(--color-primary);
  box-shadow: var(--shadow-xs);
  font-weight: 600;
}

/* ── Main layout ── */
.main-content {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 290px 1fr;
  gap: 1rem;
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
  padding: 1rem 1.5rem 1rem;
  overflow: hidden;
}

.left-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.left-panel > * {
  flex: 1;
  min-height: 0;
}

.right-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.right-panel > * {
  flex: 1;
  min-height: 0;
}

.main-content.full-width {
  grid-template-columns: 1fr;
  max-width: none;
  padding: 0.5rem;
}

/* ── Responsive ── */
@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 250px 1fr;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
  }
}

@media (max-width: 768px) {
  .navbar-inner {
    padding: 0.75rem 1rem;
    flex-direction: column;
    gap: 0.75rem;
  }

  .nav-tabs {
    width: 100%;
    justify-content: center;
  }

  .main-content {
    grid-template-columns: 1fr;
    padding: 0.75rem;
  }

  .left-panel {
    order: 2;
  }

  .right-panel {
    order: 1;
  }
}
</style>
