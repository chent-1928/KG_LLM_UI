export const createWelcomeMessage = () => ({
  role: 'assistant',
  content:
    '您好！我是 AssistDoctor 医疗助手。我可以回答您关于疾病的问题，也可以基于您提供的电子病历进行诊断。请告诉我您需要什么帮助？',
  timestamp: new Date(),
})

export const createConversation = (index = 1) => ({
  id: `conversation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: `对话 ${index}`,
  createdAt: new Date(),
  messages: [createWelcomeMessage()],
})

