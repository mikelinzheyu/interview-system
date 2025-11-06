#!/usr/bin/env node
/**
 * 生成13学科完整JSON数据
 */
const fs = require('fs')
const path = require('path')

const DISCIPLINES = [
  { code: '01', name: '哲学', icon: '🤔', color: '#9B59B6', desc: '研究人生观、世界观、方法论的学科' },
  { code: '02', name: '经济学', icon: '💰', color: '#FF6B6B', desc: '研究经济现象和经济规律的学科' },
  { code: '03', name: '法学', icon: '⚖️', color: '#3498DB', desc: '研究法律现象和法律规律的学科' },
  { code: '04', name: '教育学', icon: '📚', color: '#2ECC71', desc: '研究教育现象和教育规律的学科' },
  { code: '05', name: '文学', icon: '✍️', color: '#F39C12', desc: '研究文学现象和文学创作的学科' },
  { code: '06', name: '历史学', icon: '📖', color: '#E74C3C', desc: '研究历史现象和历史规律的学科' },
  { code: '07', name: '理学', icon: '🔬', color: '#1ABC9C', desc: '研究自然现象和自然规律的学科' },
  { code: '08', name: '工学', icon: '🏗️', color: '#34495E', desc: '研究工程应用和技术创新的学科' },
  { code: '09', name: '农学', icon: '🌾', color: '#27AE60', desc: '研究农业生产和农业科学的学科' },
  { code: '10', name: '医学', icon: '⚕️', color: '#C0392B', desc: '研究医学现象和医疗技术的学科' },
  { code: '11', name: '军事学', icon: '🎖️', color: '#8E44AD', desc: '研究军事理论和军事技术的学科' },
  { code: '12', name: '管理学', icon: '💼', color: '#16A085', desc: '研究管理现象和管理规律的学科' },
  { code: '13', name: '艺术学', icon: '🎨', color: '#D35400', desc: '研究艺术现象和艺术创作的学科' }
]

function rand(min, max) { return Math.floor(Math.random() * (max - min) + min) }

function createSpecializations(name) {
  const specs = {
    '哲学': ['伦理学', '逻辑学', '宗教学'],
    '经济学': ['宏观经济学', '微观经济学'],
    '金融学': ['国际金融', '公司金融', '量化金融'],
    '法学': ['民商法', '刑法', '经济法'],
    '计算机科学与技术': ['人工智能', '网络安全', '计算机图形学'],
    '软件工程': ['软件开发', '云计算'],
    '临床医学': ['内科学', '外科学'],
    '工商管理': ['战略管理', '市场营销'],
  }
  const examples = specs[name] || []
  return examples.slice(0, Math.min(3, examples.length)).map((spec, i) => ({
    id: `${name.toLowerCase()}-${i}`, name: spec, description: `${spec}方向`,
    coreCourses: [`${spec}基础`, `${spec}研究`], relatedSkills: ['研究', '分析', '应用'],
    questionCount: rand(20, 100)
  }))
}

function createMajor(code, name, desc) {
  return {
    id: code, code: code, name: name, description: desc || `${name}专业`, icon: '📚',
    questionCount: rand(80, 180), difficulty: ['beginner','intermediate','advanced','hard'][Math.floor(Math.random()*4)],
    popularity: rand(40, 95), specializations: createSpecializations(name)
  }
}

function createMajorGroup(code, name, majors) {
  return { id: code, code: code, name: name, description: `${name}专业类`, questionCount: rand(250, 350), majors: majors }
}

const DISCIPLINE_DATA = {
  '01': [{ id: '0101', name: '哲学类', majors: [createMajor('010101','哲学','研究哲学基本问题'), createMajor('010102','逻辑学','研究思维规律'), createMajor('010103','宗教学','研究宗教现象')] }],
  '02': [{ id: '0201', name: '经济学类', majors: [createMajor('020101','经济学','研究经济现象'), createMajor('020102','经济统计学','经济数据分析')] }, { id: '0203', name: '金融学类', majors: [createMajor('020301','金融学','研究金融规律'), createMajor('020302','金融工程','金融产品设计'), createMajor('020303','保险学','保险理论与实务')] }],
  '03': [{ id: '0301', name: '法学类', majors: [createMajor('030101','法学','研究法律现象')] }],
  '04': [{ id: '0401', name: '教育学类', majors: [createMajor('040101','教育学','研究教育规律'), createMajor('040102','科学教育','科学教学方法')] }],
  '05': [{ id: '0501', name: '中国语言文学类', majors: [createMajor('050101','汉语言文学','中文语言文学'), createMajor('050102','汉语言','汉语语法研究')] }, { id: '0502', name: '外国语言文学类', majors: [createMajor('050201','英语','英语语言文学'), createMajor('050202','日语','日语语言文学')] }],
  '06': [{ id: '0601', name: '历史学类', majors: [createMajor('060101','历史学','历史理论与研究'), createMajor('060102','世界史','世界历史研究')] }],
  '07': [{ id: '0701', name: '数学类', majors: [createMajor('070101','数学与应用数学','数学理论与应用'), createMajor('070102','信息与计算科学','计算数学')] }, { id: '0702', name: '物理学类', majors: [createMajor('070201','物理学','物理理论研究')] }],
  '08': [{ id: '0809', name: '计算机类', majors: [createMajor('080901','计算机科学与技术','计算机理论与应用'), createMajor('080902','软件工程','软件开发与管理'), createMajor('080903','网络工程','网络设计与管理'), createMajor('080904','信息安全','信息系统安全')] }, { id: '0802', name: '机械类', majors: [createMajor('080201','机械工程','机械设计与制造')] }],
  '09': [{ id: '0901', name: '植物生产类', majors: [createMajor('090101','农学','作物栽培与育种')] }],
  '10': [{ id: '1002', name: '临床医学类', majors: [createMajor('100201','临床医学','临床诊断与治疗')] }, { id: '1007', name: '药学类', majors: [createMajor('100701','药学','药物化学与应用')] }],
  '11': [{ id: '1101', name: '军事学理论类', majors: [createMajor('110101','军事学','军事理论与战略')] }],
  '12': [{ id: '1202', name: '工商管理类', majors: [createMajor('120201','工商管理','企业经营管理'), createMajor('120202','市场营销','营销战略与管理'), createMajor('120203','会计学','财务会计与管理')] }, { id: '1204', name: '公共管理类', majors: [createMajor('120402','行政管理','政府行政管理')] }],
  '13': [{ id: '1304', name: '美术学类', majors: [createMajor('130401','美术学','美术理论与创作'), createMajor('130402','绘画','绘画创作与理论')] }, { id: '1305', name: '设计学类', majors: [createMajor('130502','视觉传达设计','平面设计'), createMajor('130503','环境设计','室内外设计')] }]
}

const result = DISCIPLINES.map(disc => {
  const majorGroupsData = DISCIPLINE_DATA[disc.code] || []
  return {
    id: disc.code, code: disc.code, name: disc.name, icon: disc.icon, description: disc.desc, color: disc.color,
    majorGroups: majorGroupsData.map(mg => createMajorGroup(mg.id, mg.name, mg.majors))
  }
})

const output = path.join(__dirname, '../frontend/src/data/disciplines-complete.json')
fs.writeFileSync(output, JSON.stringify(result, null, 2), 'utf-8')
console.log('✅ Generated:', output)
