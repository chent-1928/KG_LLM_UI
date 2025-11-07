<script setup>
import { ref } from 'vue'
import ChatPanel from './components/ChatPanel.vue'
import DiagnosisPanel from './components/DiagnosisPanel.vue'
import PatientInfo from './components/PatientInfo.vue'

const activeTab = ref('chat') // 'chat' 或 'diagnosis'
const patientInfo = ref({
  name: '张三',
  age: '45岁',
  gender: '男',
  id: 'MR20240101001',
  visitDate: new Date().toLocaleDateString('zh-CN'),
})
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
            💬 对话助手
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
        <PatientInfo :patient-info="patientInfo" />
      </aside>

      <!-- 右侧面板 -->
      <div class="right-panel">
        <ChatPanel v-if="activeTab === 'chat'" />
        <DiagnosisPanel v-if="activeTab === 'diagnosis'" />
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
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
  overflow-y: auto;
}

/* 右侧面板 */
.right-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
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
