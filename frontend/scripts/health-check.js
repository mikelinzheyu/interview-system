#!/usr/bin/env node

/**
 * 系统健康检查脚本
 * 全面检查系统状态和依赖
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const ServiceChecker = require('./check-services')

class HealthChecker {
  constructor() {
    this.results = {
      environment: {},
      dependencies: {},
      services: {},
      configuration: {},
      system: {},
      overall: 'unknown'
    }
  }

  /**
   * 执行完整健康检查
   */
  async performHealthCheck() {
    console.log('🏥 AI智能面试系统 - 健康检查')
    console.log('=' .repeat(50))
    console.log(`检查时间: ${new Date().toLocaleString()}`)
    console.log('=' .repeat(50))
    console.log('')

    // 环境检查
    await this.checkEnvironment()

    // 依赖检查
    await this.checkDependencies()

    // 配置检查
    await this.checkConfiguration()

    // 系统检查
    await this.checkSystem()

    // 服务检查
    await this.checkServices()

    // 生成总体评估
    this.generateOverallAssessment()

    // 打印结果
    this.printResults()

    // 生成报告文件
    this.generateReport()
  }

  /**
   * 环境检查
   */
  async checkEnvironment() {
    console.log('🌍 检查运行环境...')

    try {
      // Node.js 版本
      const nodeVersion = process.version
      this.results.environment.node = {
        version: nodeVersion,
        status: this.checkNodeVersion(nodeVersion) ? 'ok' : 'warning'
      }

      // npm 版本
      try {
        const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim()
        this.results.environment.npm = {
          version: npmVersion,
          status: 'ok'
        }
      } catch (error) {
        this.results.environment.npm = {
          status: 'error',
          error: error.message
        }
      }

      // 操作系统
      this.results.environment.os = {
        platform: process.platform,
        arch: process.arch,
        status: 'ok'
      }

      // Java 检查 (后端需要)
      try {
        const javaVersion = execSync('java -version 2>&1', { encoding: 'utf8' })
        this.results.environment.java = {
          version: this.parseJavaVersion(javaVersion),
          status: 'ok'
        }
      } catch (error) {
        this.results.environment.java = {
          status: 'warning',
          error: 'Java not found - 后端需要Java运行环境'
        }
      }

      console.log('✅ 环境检查完成\n')
    } catch (error) {
      console.log('❌ 环境检查失败:', error.message, '\n')
    }
  }

  /**
   * 依赖检查
   */
  async checkDependencies() {
    console.log('📦 检查依赖...')

    try {
      // package.json
      const packagePath = path.join(process.cwd(), 'package.json')
      if (fs.existsSync(packagePath)) {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
        this.results.dependencies.packageJson = {
          status: 'ok',
          dependencies: Object.keys(packageJson.dependencies || {}).length,
          devDependencies: Object.keys(packageJson.devDependencies || {}).length
        }
      }

      // node_modules
      const nodeModulesPath = path.join(process.cwd(), 'node_modules')
      this.results.dependencies.nodeModules = {
        exists: fs.existsSync(nodeModulesPath),
        status: fs.existsSync(nodeModulesPath) ? 'ok' : 'warning'
      }

      // 关键依赖检查
      const criticalDeps = ['vue', 'axios', 'element-plus']
      this.results.dependencies.critical = {}

      criticalDeps.forEach(dep => {
        const depPath = path.join(nodeModulesPath, dep)
        this.results.dependencies.critical[dep] = {
          exists: fs.existsSync(depPath),
          status: fs.existsSync(depPath) ? 'ok' : 'error'
        }
      })

      console.log('✅ 依赖检查完成\n')
    } catch (error) {
      console.log('❌ 依赖检查失败:', error.message, '\n')
    }
  }

  /**
   * 配置检查
   */
  async checkConfiguration() {
    console.log('⚙️  检查配置...')

    try {
      // 环境配置文件
      const envFiles = ['.env.development', '.env.production', 'vite.config.js']
      this.results.configuration.files = {}

      envFiles.forEach(file => {
        const filePath = path.join(process.cwd(), file)
        this.results.configuration.files[file] = {
          exists: fs.existsSync(filePath),
          status: fs.existsSync(filePath) ? 'ok' : 'warning'
        }
      })

      // 环境变量
      this.results.configuration.env = {
        NODE_ENV: process.env.NODE_ENV || 'development',
        MODE: process.env.MODE || 'development',
        status: 'ok'
      }

      console.log('✅ 配置检查完成\n')
    } catch (error) {
      console.log('❌ 配置检查失败:', error.message, '\n')
    }
  }

  /**
   * 系统检查
   */
  async checkSystem() {
    console.log('🖥️  检查系统资源...')

    try {
      // 内存使用
      const memUsage = process.memoryUsage()
      this.results.system.memory = {
        used: Math.round(memUsage.heapUsed / 1024 / 1024),
        total: Math.round(memUsage.heapTotal / 1024 / 1024),
        status: memUsage.heapUsed / memUsage.heapTotal < 0.9 ? 'ok' : 'warning'
      }

      // 端口检查
      this.results.system.ports = await this.checkPorts([5174, 8080, 3306])

      console.log('✅ 系统检查完成\n')
    } catch (error) {
      console.log('❌ 系统检查失败:', error.message, '\n')
    }
  }

  /**
   * 服务检查
   */
  async checkServices() {
    console.log('🌐 检查服务状态...')

    try {
      const serviceChecker = new ServiceChecker()
      const serviceResults = await serviceChecker.checkAllServices()

      this.results.services = {
        results: serviceResults,
        healthy: serviceResults.filter(r => r.status === 'healthy').length,
        total: serviceResults.length,
        status: serviceResults.every(r => r.status === 'healthy' || !r.critical) ? 'ok' : 'error'
      }

      console.log('✅ 服务检查完成\n')
    } catch (error) {
      console.log('❌ 服务检查失败:', error.message, '\n')
      this.results.services.status = 'error'
    }
  }

  /**
   * 检查端口占用
   */
  async checkPorts(ports) {
    const portResults = {}

    for (const port of ports) {
      try {
        const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: 'pipe' })
        portResults[port] = {
          inUse: result.trim().length > 0,
          status: 'ok',
          process: result.split('\n')[0]?.trim() || ''
        }
      } catch (error) {
        portResults[port] = {
          inUse: false,
          status: 'ok',
          process: ''
        }
      }
    }

    return portResults
  }

  /**
   * 检查 Node.js 版本
   */
  checkNodeVersion(version) {
    const majorVersion = parseInt(version.substring(1).split('.')[0])
    return majorVersion >= 16 // 至少需要 Node.js 16
  }

  /**
   * 解析 Java 版本
   */
  parseJavaVersion(versionOutput) {
    const match = versionOutput.match(/version "(.+?)"/)
    return match ? match[1] : 'unknown'
  }

  /**
   * 生成总体评估
   */
  generateOverallAssessment() {
    let score = 0
    let maxScore = 0

    // 环境评分
    Object.values(this.results.environment).forEach(env => {
      maxScore += 10
      if (env.status === 'ok') score += 10
      else if (env.status === 'warning') score += 5
    })

    // 依赖评分
    maxScore += 20
    if (this.results.dependencies.nodeModules?.status === 'ok') score += 10
    if (this.results.dependencies.packageJson?.status === 'ok') score += 10

    // 服务评分
    maxScore += 30
    if (this.results.services.status === 'ok') score += 30
    else if (this.results.services.status === 'warning') score += 15

    // 配置评分
    maxScore += 10
    const configFiles = Object.values(this.results.configuration.files || {})
    const configScore = configFiles.filter(f => f.status === 'ok').length
    score += Math.min(configScore * 2, 10)

    const percentage = Math.round((score / maxScore) * 100)

    if (percentage >= 90) {
      this.results.overall = 'excellent'
    } else if (percentage >= 70) {
      this.results.overall = 'good'
    } else if (percentage >= 50) {
      this.results.overall = 'fair'
    } else {
      this.results.overall = 'poor'
    }

    this.results.score = {
      current: score,
      max: maxScore,
      percentage
    }
  }

  /**
   * 打印结果
   */
  printResults() {
    console.log('📋 健康检查报告')
    console.log('=' .repeat(50))

    // 总体状态
    const statusIcon = this.getOverallStatusIcon(this.results.overall)
    console.log(`${statusIcon} 总体健康状态: ${this.results.overall.toUpperCase()}`)
    if (this.results.score) {
      console.log(`   评分: ${this.results.score.current}/${this.results.score.max} (${this.results.score.percentage}%)`)
    }
    console.log('')

    // 详细结果
    console.log('📊 详细检查结果:')

    // 环境
    console.log('\n🌍 运行环境:')
    Object.entries(this.results.environment).forEach(([key, value]) => {
      const icon = this.getStatusIcon(value.status)
      console.log(`   ${icon} ${key}: ${value.version || value.error || 'N/A'}`)
    })

    // 依赖
    console.log('\n📦 依赖状态:')
    if (this.results.dependencies.packageJson) {
      const deps = this.results.dependencies.packageJson
      console.log(`   ✅ package.json: ${deps.dependencies} 依赖, ${deps.devDependencies} 开发依赖`)
    }
    if (this.results.dependencies.nodeModules) {
      const icon = this.getStatusIcon(this.results.dependencies.nodeModules.status)
      console.log(`   ${icon} node_modules: ${this.results.dependencies.nodeModules.exists ? '已安装' : '未安装'}`)
    }

    // 关键依赖
    if (this.results.dependencies.critical) {
      console.log('   关键依赖:')
      Object.entries(this.results.dependencies.critical).forEach(([dep, status]) => {
        const icon = this.getStatusIcon(status.status)
        console.log(`     ${icon} ${dep}: ${status.exists ? '已安装' : '未安装'}`)
      })
    }

    // 服务状态
    console.log('\n🌐 服务状态:')
    if (this.results.services.results) {
      this.results.services.results.forEach(service => {
        const icon = this.getStatusIcon(service.status === 'healthy' ? 'ok' : 'error')
        const time = service.responseTime ? ` (${service.responseTime}ms)` : ''
        console.log(`   ${icon} ${service.name}: ${service.status}${time}`)
      })
    }

    // 系统资源
    console.log('\n🖥️  系统资源:')
    if (this.results.system.memory) {
      const mem = this.results.system.memory
      const icon = this.getStatusIcon(mem.status)
      console.log(`   ${icon} 内存: ${mem.used}MB / ${mem.total}MB`)
    }

    // 端口状态
    if (this.results.system.ports) {
      console.log('   端口状态:')
      Object.entries(this.results.system.ports).forEach(([port, status]) => {
        const icon = status.inUse ? '🔴' : '🟢'
        console.log(`     ${icon} ${port}: ${status.inUse ? '被占用' : '可用'}`)
      })
    }

    console.log('\n' + '=' .repeat(50))
    this.printRecommendations()
  }

  /**
   * 打印建议
   */
  printRecommendations() {
    console.log('\n💡 建议:')

    if (this.results.overall === 'poor' || this.results.overall === 'fair') {
      console.log('   🔧 系统存在问题，建议执行以下操作:')

      if (!this.results.dependencies.nodeModules?.exists) {
        console.log('      • 安装依赖: npm install')
      }

      if (this.results.services.status === 'error') {
        console.log('      • 启动后端服务: npm run backend:start')
      }

      if (this.results.environment.java?.status === 'warning') {
        console.log('      • 安装Java运行环境 (JDK 17+)')
      }

      console.log('      • 重置开发环境: npm run reset')
    } else if (this.results.overall === 'good') {
      console.log('   ✅ 系统基本正常，可以开始开发')
      console.log('      • 启动完整开发环境: npm run dev:full')
    } else {
      console.log('   🎉 系统状态优秀，开发环境就绪！')
      console.log('      • 启动开发服务器: npm run dev')
      console.log('      • 启动完整环境: npm run dev:full')
    }
  }

  /**
   * 获取状态图标
   */
  getStatusIcon(status) {
    switch (status) {
      case 'ok': return '✅'
      case 'warning': return '⚠️ '
      case 'error': return '❌'
      default: return '❓'
    }
  }

  /**
   * 获取总体状态图标
   */
  getOverallStatusIcon(status) {
    switch (status) {
      case 'excellent': return '🎉'
      case 'good': return '✅'
      case 'fair': return '⚠️ '
      case 'poor': return '❌'
      default: return '❓'
    }
  }

  /**
   * 生成报告文件
   */
  generateReport() {
    const reportPath = path.join(process.cwd(), 'health-report.json')
    const report = {
      timestamp: new Date().toISOString(),
      version: require(path.join(process.cwd(), 'package.json')).version,
      results: this.results
    }

    try {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
      console.log(`\n📄 详细报告已保存: ${reportPath}`)
    } catch (error) {
      console.log('⚠️  报告保存失败:', error.message)
    }
  }
}

/**
 * 主函数
 */
async function main() {
  const checker = new HealthChecker()
  await checker.performHealthCheck()

  // 根据检查结果设置退出码
  if (checker.results.overall === 'poor') {
    process.exit(1)
  } else {
    process.exit(0)
  }
}

// 运行检查
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 健康检查过程中发生错误:', error.message)
    process.exit(1)
  })
}

module.exports = HealthChecker