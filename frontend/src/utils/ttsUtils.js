/**
 * TTS 工具 — 使用浏览器内置 Web Speech API
 * 无需额外 API Key，中文支持良好
 */

const ttsUtils = {
  _utterance: null,
  isSpeaking: false,

  get isSupported() {
    return typeof window !== 'undefined' && !!window.speechSynthesis
  },

  /**
   * 播报文本
   * @param {string} text
   * @param {Object} options - { lang, rate, pitch, volume }
   */
  speak(text, options = {}) {
    if (!this.isSupported || !text) return

    this.stop()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = options.lang || 'zh-CN'
    utterance.rate = options.rate ?? 0.9
    utterance.pitch = options.pitch ?? 1.0
    utterance.volume = options.volume ?? 1.0

    utterance.onstart = () => { this.isSpeaking = true }
    utterance.onend = () => { this.isSpeaking = false }
    utterance.onerror = () => { this.isSpeaking = false }

    this._utterance = utterance
    window.speechSynthesis.speak(utterance)
  },

  /**
   * 停止播报
   */
  stop() {
    if (this.isSupported) {
      window.speechSynthesis.cancel()
    }
    this.isSpeaking = false
    this._utterance = null
  },
}

export default ttsUtils
