/**
 * 语音识别工具类
 * 支持浏览器原生 Web Speech API 和第三方服务
 */
export class SpeechUtils {
  constructor() {
    this.recognition = null
    this.isListening = false
    this.onResult = null
    this.onError = null
    this.onEnd = null
    this.onStart = null
  }

  /**
   * 初始化语音识别
   * @param {Object} options 配置选项
   */
  init(options = {}) {
    const defaultOptions = {
      lang: 'zh-CN',
      continuous: true,
      interimResults: true,
      maxAlternatives: 1
    }

    const config = { ...defaultOptions, ...options }

    if (!this.isWebSpeechSupported()) {
      throw new Error('浏览器不支持 Web Speech API')
    }

    this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)()

    this.recognition.lang = config.lang
    this.recognition.continuous = config.continuous
    this.recognition.interimResults = config.interimResults
    this.recognition.maxAlternatives = config.maxAlternatives

    this.setupEventListeners()
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    if (!this.recognition) return

    this.recognition.onstart = () => {
      this.isListening = true
      console.log('语音识别开始')
      this.onStart && this.onStart()
    }

    this.recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript

        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      this.onResult && this.onResult({
        final: finalTranscript,
        interim: interimTranscript,
        confidence: event.results[event.results.length - 1][0].confidence
      })
    }

    this.recognition.onerror = (event) => {
      console.error('语音输入未捕获:', event.error)
      this.onError && this.onError(this.handleSpeechError(event.error))
    }

    this.recognition.onend = () => {
      this.isListening = false
      console.log('语音识别结束')
      this.onEnd && this.onEnd()
    }
  }

  /**
   * 开始语音识别
   */
  start() {
    if (!this.recognition) {
      throw new Error('语音识别未初始化')
    }

    if (this.isListening) {
      console.warn('语音识别已在运行中')
      return
    }

    try {
      this.recognition.start()
    } catch (error) {
      console.error('启动语音识别失败:', error)
      throw error
    }
  }

  /**
   * 停止语音识别
   */
  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
    }
  }

  /**
   * 中止语音识别
   */
  abort() {
    if (this.recognition) {
      this.recognition.abort()
      this.isListening = false
    }
  }

  /**
   * 设置回调函数
   */
  setCallbacks({ onResult, onError, onEnd, onStart }) {
    this.onResult = onResult
    this.onError = onError
    this.onEnd = onEnd
    this.onStart = onStart
  }

  /**
   * 检查浏览器是否支持 Web Speech API
   * @returns {boolean}
   */
  isWebSpeechSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  }

  /**
   * 处理语音识别错误
   * @param {string} error
   * @returns {Object}
   */
  handleSpeechError(error) {
    const errorMessages = {
      'no-speech': '系统未能检测到您的语音输入，请确认麦克风已正确连接、音量适中',
      'aborted': '语音识别被中止',
      'audio-capture': '音频捕获失败',
      'network': '网络错误',
      'not-allowed': '麦克风权限被拒绝',
      'service-not-allowed': '语音识别服务不可用',
      'bad-grammar': '语法错误',
      'language-not-supported': '不支持的语言'
    }

    return {
      code: error,
      message: errorMessages[error] || '未知语音识别错误'
    }
  }

  /**
   * 获取支持的语言列表
   * @returns {Array}
   */
  static getSupportedLanguages() {
    return [
      { code: 'zh-CN', name: '中文（普通话）' },
      { code: 'en-US', name: 'English (US)' },
      { code: 'ja-JP', name: '日本語' },
      { code: 'ko-KR', name: '한국어' },
      { code: 'fr-FR', name: 'Français' },
      { code: 'de-DE', name: 'Deutsch' },
      { code: 'es-ES', name: 'Español' }
    ]
  }

  /**
   * 获取当前状态
   * @returns {Object}
   */
  getStatus() {
    return {
      isSupported: this.isWebSpeechSupported(),
      isListening: this.isListening,
      isInitialized: !!this.recognition
    }
  }
}

/**
 * 录音工具类
 * 用于录制音频并发送到后端进行处理
 */
export class AudioRecorder {
  constructor() {
    this.mediaRecorder = null
    this.audioChunks = []
    this.stream = null
    this.isRecording = false
  }

  /**
   * 开始录音
   * @param {Object} options 录音选项
   */
  async startRecording(options = {}) {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          ...options.audio
        }
      })

      const mimeType = this.getBestMimeType()
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType })
      this.audioChunks = []

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.onstop = () => {
        this.isRecording = false
      }

      this.mediaRecorder.start(options.timeslice || 1000)
      this.isRecording = true

      console.log('录音开始')
    } catch (error) {
      console.error('录音启动失败:', error)
      throw error
    }
  }

  /**
   * 停止录音
   * @returns {Promise<Blob>}
   */
  stopRecording() {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecording) {
        resolve(null)
        return
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, {
          type: this.getBestMimeType()
        })

        this.stream.getTracks().forEach(track => track.stop())
        this.isRecording = false

        console.log('录音结束')
        resolve(audioBlob)
      }

      this.mediaRecorder.stop()
    })
  }

  /**
   * 获取最佳的 MIME 类型
   * @returns {string}
   */
  getBestMimeType() {
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/wav'
    ]

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType
      }
    }

    return 'audio/webm'
  }

  /**
   * 检查录音支持
   * @returns {boolean}
   */
  static isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder)
  }
}

export default new SpeechUtils()