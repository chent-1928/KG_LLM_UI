# AssistDoctor - 医疗诊断助手

基于 Vue 3 和 Vite 构建的医疗诊断助手前端应用，集成了 AssistDoctor 大模型，提供智能对话和疾病诊断功能。

## 功能特性

- 💬 **智能对话**：用户可以输入疾病相关问题，AssistDoctor 会提供专业的医疗建议和回答
- 🔬 **智能诊断**：基于用户输入的电子病历文本信息，诊断患者可能的疾病
- 📋 **患者信息管理**：显示和管理患者基本信息
- 🎨 **现代化界面**：美观、响应式的用户界面设计

## 技术栈

- Vue 3 (Composition API)
- Vite
- JavaScript

## 项目结构

```
src/
├── api/
│   └── assistDoctor.js      # AssistDoctor API 接口调用
├── components/
│   ├── ChatPanel.vue         # 对话面板组件
│   ├── DiagnosisPanel.vue    # 诊断面板组件
│   └── PatientInfo.vue      # 患者信息组件
├── App.vue                   # 主应用组件
└── main.js                   # 应用入口
```

## API 接口配置

API 接口调用位置在 `src/api/assistDoctor.js` 文件中，包含以下接口：

1. **sendMessage(message, history)** - 发送对话消息
2. **diagnoseDisease(medicalRecord)** - 基于病历进行诊断
3. **getDiagnosisBasis(disease, medicalRecord)** - 获取诊断依据

### 配置 API 地址

在 `src/api/assistDoctor.js` 中修改 `API_BASE_URL`：

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
```

或者创建 `.env` 文件：

```env
VITE_API_BASE_URL=http://your-api-server.com/api
```

### API 接口格式

#### 1. 对话接口
**POST** `/api/assist-doctor/chat`

请求体：
```json
{
  "message": "用户的问题",
  "history": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ]
}
```

响应：
```json
{
  "answer": "AI 的回答内容"
}
```

#### 2. 诊断接口
**POST** `/api/assist-doctor/diagnose`

请求体：
```json
{
  "medical_record": "电子病历文本"
}
```

响应：
```json
{
  "diseases": [
    {"name": "疾病名称", "probability": 0.85}
  ],
  "confidence": 0.85,
  "reasoning": "诊断分析"
}
```

#### 3. 诊断依据接口
**POST** `/api/assist-doctor/basis`

请求体：
```json
{
  "disease": "疾病名称",
  "medical_record": "电子病历文本"
}
```

响应：
```json
{
  "basis": "诊断依据",
  "suggestions": ["建议1", "建议2"]
}
```

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) 
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```
