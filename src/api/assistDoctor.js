/**
 * AssistDoctor API 接口调用
 * 这里留出大模型调用的接口位置
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

/**
 * 发送对话消息给 AssistDoctor
 * @param {string} message - 用户输入的问题
 * @param {Array} history - 对话历史记录
 * @returns {Promise} 返回 AI 的回答
 */
export async function sendMessage(message, history = []) {
  try {
    const response = await fetch(`${API_BASE_URL}/assist-doctor/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        history,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error calling AssistDoctor API:', error)
    // 模拟返回，实际使用时需要连接真实 API
    return {
      answer: '抱歉，当前无法连接到 AssistDoctor 服务。请检查 API 配置。',
      error: error.message,
    }
  }
}

/**
 * 基于电子病历进行疾病诊断
 * @param {string} medicalRecord - 电子病历文本
 * @returns {Promise} 返回诊断结果
 */
export async function diagnoseDisease(medicalRecord) {
  try {
    const response = await fetch(`${API_BASE_URL}/assist-doctor/diagnose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        medical_record: medicalRecord,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error calling AssistDoctor diagnosis API:', error)
    // 模拟返回，实际使用时需要连接真实 API
    return {
      diseases: [],
      confidence: 0,
      reasoning: '抱歉，当前无法连接到 AssistDoctor 服务。请检查 API 配置。',
      error: error.message,
    }
  }
}

/**
 * 获取诊断依据和建议
 * @param {string} disease - 疾病名称
 * @param {string} medicalRecord - 电子病历文本
 * @returns {Promise} 返回诊断依据和建议
 */
export async function getDiagnosisBasis(disease, medicalRecord) {
  try {
    const response = await fetch(`${API_BASE_URL}/assist-doctor/basis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        disease,
        medical_record: medicalRecord,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error calling AssistDoctor basis API:', error)
    return {
      basis: '无法获取诊断依据',
      suggestions: [],
      error: error.message,
    }
  }
}

