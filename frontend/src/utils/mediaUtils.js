/**
 * 媒体设备工具类
 * 处理摄像头和麦克风访问
 */
export class MediaUtils {
  constructor() {
    this.stream = null
    this.videoElement = null
  }

  /**
   * 获取摄像头权限并启动视频流
   * @param {HTMLVideoElement} videoElement 视频元素
   * @param {Object} constraints 约束条件
   * @returns {Promise<MediaStream>}
   */
  async startCamera(videoElement, constraints = {}) {
    try {
      const defaultConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      }

      const finalConstraints = { ...defaultConstraints, ...constraints }

      this.stream = await navigator.mediaDevices.getUserMedia(finalConstraints)
      this.videoElement = videoElement

      if (videoElement) {
        videoElement.srcObject = this.stream
      }

      console.log('摄像头启动成功')
      return this.stream
    } catch (error) {
      console.error('摄像头启动失败:', error)
      throw this.handleMediaError(error)
    }
  }

  /**
   * 停止摄像头
   */
  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null

      if (this.videoElement) {
        this.videoElement.srcObject = null
      }

      console.log('摄像头已停止')
    }
  }

  /**
   * 设备管理中心 (增强版)
   * @returns {Promise<Object>}
   */
  async detectDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const deviceInfo = {
        videoDevices: devices.filter(device => device.kind === 'videoinput'),
        audioInputDevices: devices.filter(device => device.kind === 'audioinput'),
        audioOutputDevices: devices.filter(device => device.kind === 'audiooutput'),
        total: devices.length
      }

      deviceInfo.quality = this.assessDeviceQuality(deviceInfo)
      return deviceInfo
    } catch (error) {
      console.error('设备检测失败:', error)
      return {
        videoDevices: [],
        audioInputDevices: [],
        audioOutputDevices: [],
        total: 0,
        quality: 'unknown',
        error: this.handleMediaError(error)
      }
    }
  }

  /**
   * 获取可用的媒体设备列表 (保持兼容性)
   * @returns {Promise<MediaDeviceInfo[]>}
   */
  async getAvailableDevices() {
    const devices = await this.detectDevices()
    return {
      videoDevices: devices.videoDevices,
      audioDevices: devices.audioInputDevices
    }
  }

  /**
   * 评估设备质量
   * @param {Object} deviceInfo
   * @returns {string}
   */
  assessDeviceQuality(deviceInfo) {
    const videoCount = deviceInfo.videoDevices.length
    const audioCount = deviceInfo.audioInputDevices.length

    if (videoCount >= 2 && audioCount >= 2) return 'excellent'
    if (videoCount >= 1 && audioCount >= 1) return 'good'
    if (videoCount >= 1 || audioCount >= 1) return 'basic'
    return 'poor'
  }

  /**
   * 切换摄像头
   * @param {string} deviceId 设备ID
   */
  async switchCamera(deviceId) {
    if (this.videoElement) {
      this.stopCamera()
      await this.startCamera(this.videoElement, {
        video: { deviceId: { exact: deviceId } },
        audio: true
      })
    }
  }

  /**
   * 检查浏览器媒体支持能力 (修复为实例方法)
   * @returns {Object}
   */
  checkSupport() {
    return {
      video: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      audio: !!(window.webkitSpeechRecognition || window.SpeechRecognition),
      webRTC: !!(window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection),
      mediaRecorder: !!window.MediaRecorder,
      screenShare: !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia)
    }
  }

  /**
   * 权限管理系统
   * @returns {Promise<Object>}
   */
  async requestPermissions() {
    const permissions = {
      camera: false,
      microphone: false,
      errors: []
    }

    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true })
      permissions.camera = true
      videoStream.getTracks().forEach(track => track.stop())
    } catch (error) {
      permissions.errors.push({
        type: 'camera',
        error: this.handleMediaError(error)
      })
    }

    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      permissions.microphone = true
      audioStream.getTracks().forEach(track => track.stop())
    } catch (error) {
      permissions.errors.push({
        type: 'microphone',
        error: this.handleMediaError(error)
      })
    }

    return permissions
  }

  /**
   * 处理媒体错误
   * @param {Error} error
   * @returns {Object}
   */
  handleMediaError(error) {
    const errorMessages = {
      'NotAllowedError': '用户拒绝了摄像头权限',
      'NotFoundError': '未找到摄像头设备',
      'NotReadableError': '摄像头被其他应用占用',
      'OverconstrainedError': '摄像头不支持指定的配置',
      'SecurityError': '安全错误，请使用HTTPS访问',
      'AbortError': '操作被中止'
    }

    return {
      name: error.name,
      message: errorMessages[error.name] || error.message || '未知媒体错误',
      originalError: error,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent.substring(0, 100)
    }
  }

  /**
   * 获取当前流的状态
   * @returns {Object}
   */
  getStreamStatus() {
    if (!this.stream) {
      return { active: false, tracks: [] }
    }

    return {
      active: this.stream.active,
      tracks: this.stream.getTracks().map(track => ({
        kind: track.kind,
        enabled: track.enabled,
        ready: track.readyState
      }))
    }
  }
}

export default new MediaUtils()