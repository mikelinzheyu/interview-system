import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * 批量操作服务 - Batch Operation Service
 * 支持对多个错题进行批量操作，包括状态更新、批量删除、标签管理等
 */

const API_BASE = '/api/v1/wrong-answers'

export const messageBatchOperationService = {
  /**
   * 批量更新状态
   * @param {Array<number>} recordIds - 记录ID列表
   * @param {string} status - 目标状态 (mastered/reviewing/unreveiwed)
   * @returns {Promise<Object>}
   */
  async batchUpdateStatus(recordIds, status) {
    try {
      const response = await fetch(`${API_BASE}/batch/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recordIds,
          status,
          timestamp: Date.now()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to batch update status')
      }

      return await response.json()
    } catch (error) {
      console.error('Batch update status error:', error)
      throw error
    }
  },

  /**
   * 批量添加标签
   * @param {Array<number>} recordIds - 记录ID列表
   * @param {Array<string>} tags - 标签列表
   * @returns {Promise<Object>}
   */
  async batchAddTags(recordIds, tags) {
    try {
      const response = await fetch(`${API_BASE}/batch/add-tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recordIds,
          tags,
          timestamp: Date.now()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to batch add tags')
      }

      return await response.json()
    } catch (error) {
      console.error('Batch add tags error:', error)
      throw error
    }
  },

  /**
   * 批量删除标签
   * @param {Array<number>} recordIds - 记录ID列表
   * @param {Array<string>} tags - 标签列表
   * @returns {Promise<Object>}
   */
  async batchRemoveTags(recordIds, tags) {
    try {
      const response = await fetch(`${API_BASE}/batch/remove-tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recordIds,
          tags,
          timestamp: Date.now()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to batch remove tags')
      }

      return await response.json()
    } catch (error) {
      console.error('Batch remove tags error:', error)
      throw error
    }
  },

  /**
   * 批量删除
   * @param {Array<number>} recordIds - 记录ID列表
   * @returns {Promise<Object>}
   */
  async batchDelete(recordIds) {
    try {
      const response = await fetch(`${API_BASE}/batch/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recordIds,
          timestamp: Date.now()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to batch delete')
      }

      return await response.json()
    } catch (error) {
      console.error('Batch delete error:', error)
      throw error
    }
  },

  /**
   * 批量导出为PDF
   * @param {Array<number>} recordIds - 记录ID列表
   * @returns {Promise<Blob>}
   */
  async batchExportPDF(recordIds) {
    try {
      const response = await fetch(`${API_BASE}/batch/export-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recordIds,
          timestamp: Date.now()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to export PDF')
      }

      return await response.blob()
    } catch (error) {
      console.error('Export PDF error:', error)
      throw error
    }
  },

  /**
   * 批量导出为Excel
   * @param {Array<number>} recordIds - 记录ID列表
   * @returns {Promise<Blob>}
   */
  async batchExportExcel(recordIds) {
    try {
      const response = await fetch(`${API_BASE}/batch/export-excel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recordIds,
          timestamp: Date.now()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to export Excel')
      }

      return await response.blob()
    } catch (error) {
      console.error('Export Excel error:', error)
      throw error
    }
  },

  /**
   * 批量导出为CSV
   * @param {Array<number>} recordIds - 记录ID列表
   * @returns {Promise<Blob>}
   */
  async batchExportCSV(recordIds) {
    try {
      const response = await fetch(`${API_BASE}/batch/export-csv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recordIds,
          timestamp: Date.now()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to export CSV')
      }

      return await response.blob()
    } catch (error) {
      console.error('Export CSV error:', error)
      throw error
    }
  },

  /**
   * 获取批量操作进度
   * @param {string} operationId - 操作ID
   * @returns {Promise<Object>}
   */
  async getBatchOperationProgress(operationId) {
    try {
      const response = await fetch(`${API_BASE}/batch/progress/${operationId}`)

      if (!response.ok) {
        throw new Error('Failed to get batch operation progress')
      }

      return await response.json()
    } catch (error) {
      console.error('Get batch operation progress error:', error)
      throw error
    }
  },

  /**
   * 取消批量操作
   * @param {string} operationId - 操作ID
   * @returns {Promise<Object>}
   */
  async cancelBatchOperation(operationId) {
    try {
      const response = await fetch(`${API_BASE}/batch/cancel/${operationId}`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to cancel batch operation')
      }

      return await response.json()
    } catch (error) {
      console.error('Cancel batch operation error:', error)
      throw error
    }
  },

  /**
   * 导出下载文件辅助函数
   * @param {Blob} blob - 文件Blob
   * @param {string} filename - 文件名
   */
  downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },

  /**
   * 生成本地CSV导出 (无需后端)
   * @param {Array<Object>} data - 数据数组
   * @param {string} filename - 文件名
   */
  exportToCSVLocal(data, filename = 'export.csv') {
    if (!data || data.length === 0) {
      throw new Error('No data to export')
    }

    // Get all unique keys from data objects
    const keys = [...new Set(data.flatMap(obj => Object.keys(obj)))]

    // Create CSV header
    const header = keys.join(',')

    // Create CSV rows
    const rows = data.map(obj => {
      return keys.map(key => {
        const value = obj[key]
        // Handle values with commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value || ''
      }).join(',')
    })

    // Combine header and rows
    const csv = [header, ...rows].join('\n')

    // Create and download blob
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    this.downloadFile(blob, filename)
  },

  /**
   * 生成本地JSON导出
   * @param {Array<Object>} data - 数据数组
   * @param {string} filename - 文件名
   */
  exportToJSONLocal(data, filename = 'export.json') {
    if (!data) {
      throw new Error('No data to export')
    }

    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
    this.downloadFile(blob, filename)
  },

  /**
   * 生成本地Markdown导出
   * @param {Array<Object>} records
   * @param {string} filename
   */
  exportToMarkdownLocal(records, filename = 'wrong-answers.md') {
    if (!Array.isArray(records) || records.length === 0) {
      throw new Error('No records to export')
    }
    const lines = []
    lines.push(`# 错题导出 (${new Date().toLocaleString()})`)
    for (const r of records) {
      lines.push('')
      lines.push(`## ${r.questionTitle || '(无标题题目)'}`)
      lines.push('')
      lines.push(`- 来源: ${r.source || ''}`)
      lines.push(`- 难度: ${r.difficulty || ''}`)
      lines.push(`- 状态: ${r.reviewStatus || ''}`)
      lines.push(`- 错误次数: ${r.wrongCount ?? 0}  正确次数: ${r.correctCount ?? 0}`)
      if (r.nextReviewTime) lines.push(`- 下次复习: ${new Date(r.nextReviewTime).toLocaleString()}`)
      if (Array.isArray(r.userTags) && r.userTags.length) lines.push(`- 标签: ${r.userTags.join(', ')}`)
      lines.push('')
      if (r.questionContent) {
        lines.push('**题目内容**')
        lines.push('')
        lines.push('```')
        lines.push(String(r.questionContent))
        lines.push('```')
        lines.push('')
      }
      if (r.userNotes) {
        lines.push('**我的笔记**')
        lines.push('')
        lines.push(String(r.userNotes))
        lines.push('')
      }
    }
    const md = lines.join('\n')
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' })
    this.downloadFile(blob, filename)
  },

  /**
   * 生成本地PDF导出（文本排版）
   * @param {Array<Object>} records
   * @param {string} filename
   */
  exportWrongAnswersToPDFLocal(records, filename = 'wrong-answers.pdf') {
    if (!Array.isArray(records) || records.length === 0) {
      throw new Error('No records to export')
    }
    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    const left = 15
    let y = 20

    const addLine = (text = '', fontSize = 11, bold = false) => {
      doc.setFontSize(fontSize)
      doc.setFont(undefined, bold ? 'bold' : 'normal')
      const lines = doc.splitTextToSize(text, pageWidth - left * 2)
      for (const line of lines) {
        if (y > 280) { doc.addPage(); y = 20 }
        doc.text(line, left, y)
        y += 6
      }
    }

    doc.setFontSize(14)
    doc.text(`错题导出 ${new Date().toLocaleString()}`, left, y)
    y += 8

    records.forEach((r, idx) => {
      if (idx > 0) { y += 4 }
      addLine(`${idx + 1}. ${r.questionTitle || '(无标题题目)'}`, 12, true)
      addLine(`来源: ${r.source || ''}    难度: ${r.difficulty || ''}    状态: ${r.reviewStatus || ''}`)
      addLine(`错误次数: ${r.wrongCount ?? 0}    正确次数: ${r.correctCount ?? 0}`)
      if (r.nextReviewTime) addLine(`下次复习: ${new Date(r.nextReviewTime).toLocaleString()}`)
      if (Array.isArray(r.userTags) && r.userTags.length) addLine(`标签: ${r.userTags.join(', ')}`)
      if (r.questionContent) { addLine('题目内容：', 11, true); addLine(String(r.questionContent)) }
      if (r.userNotes) { addLine('我的笔记：', 11, true); addLine(String(r.userNotes)) }
    })

    doc.save(filename)
  },

  /**
   * 生成本地PDF导出（HTML 模板渲染，样式更美观）
   * 依赖 jsPDF + html2canvas
   * @param {Array<Object>} records
   * @param {string} filename
   */
  async exportWrongAnswersToPDFHtmlLocal(records, filename = 'wrong-answers.pdf') {
    if (!Array.isArray(records) || records.length === 0) {
      throw new Error('No records to export')
    }

    // 临时容器，渲染 HTML 模板
    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.left = '-9999px'
    container.style.top = '0'
    container.style.width = '794px' // A4 width @ 96dpi approx
    container.style.background = '#fff'
    container.className = 'wa-pdf-root'

    const esc = (s) => {
      if (s == null) return ''
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    }

    const toHtmlPara = (s) => {
      if (!s) return ''
      return esc(s).replace(/\n/g, '<br/>')
    }

    const nowStr = new Date().toLocaleString()
    const total = records.length

    const style = `
      <style>
        .wa-doc { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans SC', 'Microsoft YaHei', sans-serif; color: #222; padding: 24px; }
        .wa-header { display:flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px; }
        .wa-title { font-size: 20px; font-weight: 700; }
        .wa-sub { color:#666; font-size: 12px; }
        .wa-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; margin: 10px 0; background: #fff; }
        .wa-qtitle { font-size: 14px; font-weight: 600; margin: 0 0 8px; color:#111; }
        .wa-meta { display:flex; flex-wrap: wrap; gap:8px; margin-bottom: 8px; }
        .wa-tag { background:#f3f4f6; color:#374151; border-radius: 999px; padding: 2px 8px; font-size: 11px; }
        .wa-kv { color:#4b5563; font-size: 12px; }
        .wa-section { margin-top: 8px; }
        .wa-section-title { font-size: 12px; color:#374151; font-weight: 600; margin-bottom: 4px; }
        .wa-box { background:#fafafa; border:1px solid #eee; border-radius:6px; padding:8px; font-size:12px; white-space:pre-wrap; word-break: break-word; }
      </style>
    `

    const cards = records.map((r, i) => {
      const tags = Array.isArray(r.userTags) && r.userTags.length ? `<span class="wa-tag">标签: ${r.userTags.map(esc).join(', ')}</span>` : ''
      const next = r.nextReviewTime ? `<span class="wa-tag">下次复习: ${new Date(r.nextReviewTime).toLocaleString()}</span>` : ''
      return `
        <div class="wa-card">
          <div class="wa-qtitle">${i + 1}. ${esc(r.questionTitle) || '(无标题题目)'}</div>
          <div class="wa-meta">
            <span class="wa-tag">来源: ${esc(r.source) || ''}</span>
            <span class="wa-tag">难度: ${esc(r.difficulty) || ''}</span>
            <span class="wa-tag">状态: ${esc(r.reviewStatus) || ''}</span>
            <span class="wa-kv">错: ${r.wrongCount ?? 0}</span>
            <span class="wa-kv">对: ${r.correctCount ?? 0}</span>
            ${next}
            ${tags}
          </div>
          ${r.questionContent ? `
            <div class="wa-section">
              <div class="wa-section-title">题目内容</div>
              <div class="wa-box">${toHtmlPara(r.questionContent)}</div>
            </div>
          ` : ''}
          ${r.userNotes ? `
            <div class="wa-section">
              <div class="wa-section-title">我的笔记</div>
              <div class="wa-box">${toHtmlPara(r.userNotes)}</div>
            </div>
          ` : ''}
        </div>
      `
    }).join('')

    container.innerHTML = `
      <div class="wa-doc">
        <div class="wa-header">
          <div class="wa-title">错题导出</div>
          <div class="wa-sub">共 ${total} 条 · 生成时间 ${esc(nowStr)}</div>
        </div>
        ${style}
        ${cards}
      </div>
    `
    document.body.appendChild(container)

    try {
      const doc = new jsPDF('p', 'mm', 'a4')
      // 通过 jsPDF.html 渲染，内部使用 html2canvas
      await new Promise((resolve) => {
        doc.html(container, {
          x: 10,
          y: 10,
          width: 190, // A4 210 - margins
          html2canvas: { scale: 2, useCORS: true, logging: false, windowWidth: 794 },
          callback: () => resolve()
        })
      })
      doc.save(filename)
    } finally {
      // 清理临时 DOM
      document.body.removeChild(container)
    }
  }
}

export default messageBatchOperationService
