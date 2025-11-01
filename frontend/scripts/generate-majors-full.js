#!/usr/bin/env node
/**
 * Generate ~200 majors across 13 disciplines into CSV (majors-full.csv)
 * Fields: discipline_name,field_name,major_slug,major_name,aliases,pinyin,abbr,alt_en,popularity
 */
const fs = require('fs')
const path = require('path')

const OUT = path.resolve(__dirname, '../src/data/import/majors-full.csv')

const D = {
  理学: {
    计算机类: ['计算机科学与技术','软件工程','人工智能','数据科学与大数据技术','物联网工程','信息安全','网络工程','数字媒体技术','智能科学与技术','空间信息与数字技术'],
    数学类: ['数学与应用数学','信息与计算科学','统计学','应用统计学'],
    物理学类: ['物理学','应用物理学','材料物理','核物理'],
    化学类: ['化学','应用化学','化学生物学']
  },
  工学: {
    电子信息类: ['电子信息工程','通信工程','电子科学与技术','微电子科学与工程','光电信息科学与工程','信息工程','电磁场与无线技术'],
    自动化类: ['自动化','机器人工程','测控技术与仪器'],
    计算机类: ['软件工程','网络工程','信息安全','数据工程'],
    机械类: ['机械工程','机械电子工程','车辆工程','智能制造工程'],
    土木类: ['土木工程','建筑环境与能源应用工程','给排水科学与工程'],
    材料类: ['材料科学与工程','材料成型及控制工程','功能材料']
  },
  医学: {
    临床医学类: ['临床医学','麻醉学','医学影像学','儿科学'],
    基础医学类: ['基础医学','预防医学','口腔医学'],
    药学类: ['药学','药物制剂','临床药学']
  },
  法学: {
    法学类: ['法学','知识产权','国际政治','政治学与行政学'],
    社会学类: ['社会学','社会工作']
  },
  经济学: {
    经济学类: ['经济学','国际经济与贸易','国民经济管理','贸易经济'],
    金融学类: ['金融学','金融工程','保险学','投资学'],
    经济与贸易类: ['国际商务','税收学']
  },
  管理学: {
    工商管理类: ['工商管理','市场营销','人力资源管理','会展经济与管理','物流管理','电子商务'],
    公共管理类: ['行政管理','公共事业管理'],
    会计学类: ['会计学','财务管理','审计学']
  },
  教育学: {
    教育学类: ['教育学','教育技术学','学前教育','小学教育','特殊教育']
  },
  文学: {
    中国语言文学类: ['汉语言文学','汉语国际教育','古典文献学'],
    外国语言文学类: ['英语','日语','德语','法语','西班牙语','俄语']
  },
  历史学: {
    历史学类: ['历史学','世界史','考古学']
  },
  哲学: {
    哲学类: ['哲学','逻辑学','宗教学']
  },
  农学: {
    农学类: ['农学','种子科学与工程','植物保护'],
    园艺类: ['园艺','设施农业科学与工程'],
    动物科学类: ['动物科学','动物医学','水产养殖学']
  },
  艺术学: {
    设计学类: ['工业设计','视觉传达设计','环境设计','产品设计'],
    美术学类: ['美术学','绘画','雕塑'],
    戏剧与影视学类: ['戏剧影视文学','广播电视编导','影视摄影与制作']
  },
  军事学: {
    军事指挥: ['军事指挥','边防指挥','海军指挥']
  }
}

function slugify(text){
  return String(text||'')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]+/g,'-')
    .replace(/[\u4e00-\u9fa5]/g,'')
    .toLowerCase()
    .replace(/-+/g,'-')
    .replace(/(^-|-$)/g,'')
}

function abbrFromSlug(slug){
  return slug.split('-').map(s=>s[0]||'').join('').toUpperCase().slice(0,6)
}

function altEnFromSlug(slug){
  return slug.split('-').join(' ')
}

function row(discipline, field, name){
  let baseSlug = slugify(altEnFromSlug(name)) || slugify(name)
  if(!baseSlug) baseSlug = Math.random().toString(36).slice(2,8)
  const aliases = [name]
  const abbr = abbrFromSlug(baseSlug)
  const alt_en = altEnFromSlug(baseSlug)
  const popularity = Math.min(100, 50 + Math.floor(Math.random()*50))
  return [discipline, field, baseSlug, name, aliases.join(';'), '', abbr, alt_en, popularity].join(',')
}

function main(){
  const out = []
  out.push('discipline_name,field_name,major_slug,major_name,aliases,pinyin,abbr,alt_en,popularity')
  let count = 0
  for(const [disc, fields] of Object.entries(D)){
    for(const [field, majors] of Object.entries(fields)){
      for(const name of majors){
        out.push(row(disc, field, name)); count++
      }
    }
  }
  // pad to >= 200 by duplicating with qualifiers
  const qualifiers = ['（智能方向）','（国际班）','（卓越计划）','（实验班）']
  outer: for(const [disc, fields] of Object.entries(D)){
    for(const [field, majors] of Object.entries(fields)){
      for(const name of majors){
        for(const q of qualifiers){
          if(count>=200) break outer
          out.push(row(disc, field, name + q)); count++
        }
      }
    }
  }
  fs.writeFileSync(OUT, out.join('\n'), 'utf8')
  console.log('✅ Generated', OUT, 'rows:', count)
}

if(require.main===module) main()

