/**
 * AssistDoctor API 接口调用
 * 这里留出大模型调用的接口位置
 */

const API_BASE_URL = 'http://10.4.0.141:8000'

/**
 * 发送对话消息给 AssistDoctor（流式响应）
 * @param {string} query - 用户输入的问题
 * @param {Array} messages - 对话历史记录，格式为 [{role: string, content: string}]
 * @param {Function} onChunk - 接收到数据块时的回调函数，参数为 (chunk: {content: string, done: boolean, messages?: Array, error?: string})
 * @returns {Promise} 返回完整的响应数据
 */
export async function sendMessage(query, messages = [], onChunk = null) {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query.trim(),
        messages: messages,
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // 处理 SSE 流式响应
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let fullContent = ''
    let finalMessages = null

    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        break
      }

      // 解码数据块
      buffer += decoder.decode(value, { stream: true })
      
      // 处理可能包含多个 SSE 消息的缓冲区
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // 保留最后一个不完整的行

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const dataStr = line.slice(6) // 移除 'data: ' 前缀
            const data = JSON.parse(dataStr)

            if (data.error) {
              throw new Error(data.error)
            }

            if (data.content !== undefined) {
              fullContent += data.content
              
              // 调用回调函数，实时更新 UI
              if (onChunk && typeof onChunk === 'function') {
                onChunk({
                  content: data.content,
                  fullContent: fullContent,
                  done: data.done || false,
                })
              }
            }

            // 如果完成，保存最终的消息列表
            if (data.done && data.messages) {
              finalMessages = data.messages
            }
          } catch (parseError) {
            console.error('Error parsing SSE data:', parseError, line)
          }
        }
      }
    }

    // 返回最终结果
    return {
      answer: fullContent,
      content: fullContent,
      messages: finalMessages || messages,
    }
  } catch (error) {
    console.error('Error calling AssistDoctor API:', error)
    // 模拟返回，实际使用时需要连接真实 API
    return {
      answer: '抱歉，当前无法连接到 AssistDoctor 服务。请检查 API 配置。',
      content: '抱歉，当前无法连接到 AssistDoctor 服务。请检查 API 配置。',
      error: error.message,
    }
  }
}

/**
 * 基于电子病历进行疾病诊断
 * @param {Object} medicalRecord - 电子病历对象，包含：
 *   - chiefComplaint: 主诉
 *   - presentIllness: 现病史
 *   - pastHistory: 既往史
 *   - physicalExam: 查体
 *   - auxiliaryExam: 辅助检查
 * @returns {Promise} 返回诊断结果
 */
export async function diagnoseDisease(medicalRecord) {
  try {
    const response = await fetch(`${API_BASE_URL}/diagnosis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chief_complaint: medicalRecord.chiefComplaint || '',
        present_illness: medicalRecord.presentIllness || '',
        past_illness: medicalRecord.pastHistory || '',
        physical_examination: medicalRecord.physicalExam || '',
        auxiliary_exam: medicalRecord.auxiliaryExam || '',
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
      results: [],
      error: error.message,
    }
  }
}
