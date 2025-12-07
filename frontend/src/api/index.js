import axios from 'axios'
import { ElMessage } from 'element-plus'

// 统一创建 axios 实例，支持通过 VITE_API_BASE_URL 配置后端地址
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 90000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器：自动附加 token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：统一处理 code !== 200 的业务错误和 HTTP 错误
// 同时对响应数据进行统一适配，确保所有调用方看到一致的结构
api.interceptors.response.use(
  (response) => {
    const res = response.data

    // 检查业务错误（code !== 200）
    if (res && typeof res.code !== 'undefined' && res.code !== 200) {
      const msg = res.message || '请求失败，请稍后重试'
      ElMessage.error(msg)
      return Promise.reject(new Error(msg))
    }

    // 统一适配响应结构
    // 确保返回的对象始终是 { code, message, data } 的格式
    // 新 API 调用可以安全地使用 response.data 获取业务数据
    if (res && typeof res === 'object' && 'code' in res) {
      return res
    }

    return res
  },
  (error) => {
    const status = error?.response?.status
    const backendMessage = error?.response?.data?.message
    const message = backendMessage || error?.message || '请求失败，请稍后重试'
    const url = error?.response?.config?.url || error?.config?.url

    console.error('API Error:', { status, message, url })

    if (error.response) {
      const { data } = error.response

      switch (status) {
        case 401:
          ElMessage.error('登录状态已过期，请重新登录')
          localStorage.removeItem('token')
          window.location.href = '/login'
          break
        case 403:
          ElMessage.error('没有权限访问该资源')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误，请稍后重试')
          break
        default: {
          // 对 /users/me 的 400 错误不弹出提示（通常是未登录状态）
          if (status === 400 && typeof url === 'string' && url.includes('/users/me')) {
            console.warn('[API] Suppressing toast for /users/me 400 error:', message)
          } else {
            ElMessage.error(data?.message || message || '请求失败，请稍后重试')
          }
        }
      }
    } else if (error.request) {
      ElMessage.error('网络异常，请检查您的网络连接')
    } else {
      ElMessage.error('请求出错，请稍后重试')
    }

    return Promise.reject(error)
  }
)

export { api }
export default api
