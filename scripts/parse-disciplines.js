#!/usr/bin/env node

/**
 * 学科体系数据解析脚本
 * 将 test3/7.txt 中的学科体系转换为 JSON 格式
 *
 * 用法: node scripts/parse-disciplines.js
 */

const fs = require('fs')
const path = require('path')

// 学科门类的颜色和icon映射
const DISCIPLINE_CONFIG = {
  '哲学': {
    code: '01',
    icon: '🤔',
    color: '#9B59B6',
    description: '研究人生观、世界观、方法论的学科'
  },
  '经济学': {
    code: '02',
    icon: '💰',
    color: '#FF6B6B',
    description: '研究经济现象和经济规律的学科'
  },
  '法学': {
    code: '03',
    icon: '⚖️',
    color: '#3498DB',
    description: '研究法律现象和法律规律的学科'
  },
  '教育学': {
    code: '04',
    icon: '📚',
    color: '#2ECC71',
    description: '研究教育现象和教育规律的学科'
  },
  '文学': {
    code: '05',
    icon: '✍️',
    color: '#F39C12',
    description: '研究文学现象和文学创作的学科'
  },
  '历史学': {
    code: '06',
    icon: '📖',
    color: '#E74C3C',
    description: '研究历史现象和历史规律的学科'
  },
  '理学': {
    code: '07',
    icon: '🔬',
    color: '#1ABC9C',
    description: '研究自然现象和自然规律的学科'
  },
  '工学': {
    code: '08',
    icon: '🏗️',
    color: '#34495E',
    description: '研究工程应用和技术创新的学科'
  },
  '农学': {
    code: '09',
    icon: '🌾',
    color: '#27AE60',
    description: '研究农业生产和农业科学的学科'
  },
  '医学': {
    code: '10',
    icon: '⚕️',
    color: '#C0392B',
    description: '研究医学现象和医疗技术的学科'
  },
  '军事学': {
    code: '11',
    icon: '🎖️',
    color: '#8E44AD',
    description: '研究军事理论和军事技术的学科'
  },
  '管理学': {
    code: '12',
    icon: '💼',
    color: '#16A085',
    description: '研究管理现象和管理规律的学科'
  },
  '艺术学': {
    code: '13',
    icon: '🎨',
    color: '#D35400',
    description: '研究艺术现象和艺术创作的学科'
  }
}

// 示例细分方向
const SPECIALIZATIONS_EXAMPLES = {
  '哲学': ['伦理学', '逻辑学', '宗教学', '马克思主义哲学', '中国哲学', '西方哲学'],
  '经济学': ['宏观经济学', '微观经济学', '计量经济学', '产业经济学'],
  '金融学': ['国际金融', '公司金融', '量化金融', '金融科技 (FinTech)', '金融风险管理'],
  '法学': ['民商法', '刑法', '经济法', '国际法', '知识产权法', '行政法'],
  '计算机科学与技术': ['计算机系统结构', '计算机软件与理论', '人工智能', '网络安全', '计算机图形学'],
  '软件工程': ['软件开发', '软件测试', '嵌入式系统', '项目管理', '云计算']
}

// 颜色调色板
const COLORS = [
  '#667EEA', '#764BA2', '#F093FB', '#4FACFE', '#00F2FE',
  '#43E97B', '#FA709A', '#FEE140', '#FF6B6B', '#4ECDC4',
  '#45B7D1', '#96CEB4', '#FFEAA7', '#DFE6E9', '#74B9FF'
]

/**
 * 为专业生成问题数量
 */
function generateQuestionCount(level) {
  const ranges = {
    discipline: [200, 400],
    majorGroup: [250, 350],
    major: [80, 180],
    specialization: [20, 100]
  }
  const [min, max] = ranges[level] || [50, 100]
  return Math.floor(Math.random() * (max - min) + min)
}

/**
 * 为专业生成难度等级
 */
function generateDifficulty() {
  const difficulties = ['beginner', 'intermediate', 'advanced', 'hard']
  return difficulties[Math.floor(Math.random() * difficulties.length)]
}

/**
 * 为专业生成热度
 */
function generatePopularity() {
  return Math.floor(Math.random() * 100)
}

/**
 * 为专业类创建专业
 * 基于代码和名称
 */
function createMajor(code, name, description = '') {
  return {
    id: code,
    code: code,
    name: name,
    description: description || `${name}专业培养方案`,
    icon: '📚',
    questionCount: generateQuestionCount('major'),
    difficulty: generateDifficulty(),
    popularity: generatePopularity(),
    specializations: createSpecializations(name)
  }
}

/**
 * 为专业创建细分方向
 */
function createSpecializations(majorName) {
  const examples = SPECIALIZATIONS_EXAMPLES[majorName] || []

  if (examples.length === 0) {
    return []
  }

  // 随机选择1-3个细分方向
  const count = Math.min(3, examples.length)
  const selected = []
  const indices = new Set()

  while (indices.size < count) {
    indices.add(Math.floor(Math.random() * examples.length))
  }

  Array.from(indices).forEach((idx, i) => {
    const spec = examples[idx]
    selected.push({
      id: `${majorName.toLowerCase().replace(/\s+/g, '-')}-${i}`,
      name: spec,
      description: `${spec}方向培养方案`,
      coreCourses: [
        `${spec}基础`,
        `${spec}专题研究`,
        `${spec}实践应用`
      ],
      relatedSkills: ['批判性思维', '团队协作', '实践能力'],
      questionCount: generateQuestionCount('specialization')
    })
  })

  return selected
}

/**
 * 创建专业类（Major Group）
 */
function createMajorGroup(code, name, majorsData) {
  const majors = majorsData.map(item => {
    const majorCode = item.code || `${code}${item.name}`
    return createMajor(majorCode, item.name, item.description || '')
  })

  return {
    id: code,
    code: code,
    name: name,
    description: `${name}专业类培养方案`,
    questionCount: generateQuestionCount('majorGroup'),
    majors: majors
  }
}

/**
 * 创建完整的学科
 */
function createDiscipline(chineseName, majorGroupsData) {
  const config = DISCIPLINE_CONFIG[chineseName]

  if (!config) {
    console.error(`❌ 未找到学科 ${chineseName} 的配置`)
    return null
  }

  const majorGroups = majorGroupsData.map(item => {
    return createMajorGroup(item.code, item.name, item.majors || [])
  })

  return {
    id: config.code,
    code: config.code,
    name: chineseName,
    icon: config.icon,
    description: config.description,
    color: config.color,
    majorGroups: majorGroups
  }
}

/**
 * 解析文本文件中的学科数据
 */
function parseDisciplinesFromText(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')

  const disciplines = []
  let currentDiscipline = null
  let currentMajorGroup = null

  for (const line of lines) {
    const trimmed = line.trim()

    // 匹配学科行: "1. 哲学 (Philosophy)"
    const disciplineMatch = trimmed.match(/^\d+\.\s+(.+?)\s*\([A-Za-z\s()]+\)/)
    if (disciplineMatch) {
      // 保存前一个学科
      if (currentDiscipline) {
        disciplines.push(currentDiscipline)
      }

      currentDiscipline = {
        name: disciplineMatch[1],
        majorGroups: []
      }
      currentMajorGroup = null
      continue
    }

    // 匹配专业类行: "0101 哲学类"
    const majorGroupMatch = trimmed.match(/^(\d{4})\s+(.+)/)
    if (majorGroupMatch && currentDiscipline) {
      currentMajorGroup = {
        code: majorGroupMatch[1],
        name: majorGroupMatch[2],
        majors: []
      }
      currentDiscipline.majorGroups.push(currentMajorGroup)
      continue
    }

    // 匹配专业行: "010101 哲学"
    const majorMatch = trimmed.match(/^(\d{6})\s+(.+)/)
    if (majorMatch && currentMajorGroup) {
      const majorName = majorMatch[2]
      const majorCode = majorMatch[1]

      currentMajorGroup.majors.push({
        code: majorCode,
        name: majorName,
        description: ''
      })
    }
  }

  // 保存最后一个学科
  if (currentDiscipline) {
    disciplines.push(currentDiscipline)
  }

  return disciplines
}

/**
 * 主函数
 */
function main() {
  console.log('📖 开始解析学科体系数据...\n')

  const inputPath = path.join(__dirname, '../D:/code7/test3/7.txt')
  const outputPath = path.join(__dirname, '../frontend/src/data/disciplines-complete-new.json')

  try {
    // 解析源文件
    console.log('📖 正在读取源文件: D:/code7/test3/7.txt')
    const parsedData = parseDisciplinesFromText('D:/code7/test3/7.txt')
    console.log(`✅ 成功解析 ${parsedData.length} 个学科门类\n`)

    // 创建完整的JSON结构
    console.log('🔨 正在生成完整的JSON结构...')
    const disciplines = parsedData.map(disc => {
      return createDiscipline(disc.name, disc.majorGroups)
    }).filter(d => d !== null)

    console.log(`✅ 成功生成 ${disciplines.length} 个学科\n`)

    // 统计数据
    console.log('📊 数据统计:')
    disciplines.forEach(disc => {
      const majorGroupCount = disc.majorGroups.length
      const majorCount = disc.majorGroups.reduce((sum, mg) => sum + mg.majors.length, 0)
      const specCount = disc.majorGroups.reduce((sum, mg) => {
        return sum + mg.majors.reduce((s, m) => s + m.specializations.length, 0)
      }, 0)
      console.log(`  ${disc.name}: ${majorGroupCount} 专业类, ${majorCount} 专业, ${specCount} 细分方向`)
    })
    console.log()

    // 写入文件
    const jsonContent = JSON.stringify(disciplines, null, 2)
    fs.writeFileSync(outputPath, jsonContent, 'utf-8')
    console.log(`✅ 已保存至: ${outputPath}`)
    console.log(`📝 文件大小: ${(jsonContent.length / 1024).toFixed(2)} KB`)

    console.log('\n✨ 完成！')
    console.log('下一步: 将 disciplines-complete-new.json 重命名为 disciplines-complete.json')

  } catch (error) {
    console.error('❌ 错误:', error.message)
    process.exit(1)
  }
}

// 运行
if (require.main === module) {
  main()
}

module.exports = {
  createDiscipline,
  createMajorGroup,
  createMajor,
  createSpecializations,
  parseDisciplinesFromText,
  DISCIPLINE_CONFIG,
  SPECIALIZATIONS_EXAMPLES
}
