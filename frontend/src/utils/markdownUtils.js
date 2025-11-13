/**
 * Markdown 处理工具函数
 * 路径: frontend/src/utils/markdownUtils.js
 */

/**
 * 从 Markdown 内容中提取标题生成目录
 * @param {string} content Markdown 内容
 * @returns {Array} 目录项数组
 */
export function extractTableOfContents(content) {
  if (!content) return []

  const regex = /^(#{1,3})\s+(.+)$/gm
  const headings = []
  let match

  while ((match = regex.exec(content)) !== null) {
    const level = match[1].length // 1, 2, or 3
    const text = match[2].trim()
    const id = generateHeadingId(text)

    headings.push({
      level,
      text,
      id,
    })
  }

  return headings
}

/**
 * 生成标题 ID（用于锚点）
 * @param {string} text 标题文本
 * @returns {string} 生成的 ID
 */
export function generateHeadingId(text) {
  return (
    'heading-' +
    text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]/g, '')
  )
}

/**
 * 将 Markdown 内容中的标题添加 ID 属性
 * @param {string} content Markdown 内容
 * @returns {string} 修改后的内容
 */
export function addHeadingIds(content) {
  const headings = extractTableOfContents(content)
  let modifiedContent = content

  headings.forEach(({ text, id }) => {
    const regex = new RegExp(`^(#{1,3}\\s+)${text}$`, 'gm')
    modifiedContent = modifiedContent.replace(regex, `$1${text} {#${id}}`)
  })

  return modifiedContent
}

export default {
  extractTableOfContents,
  generateHeadingId,
  addHeadingIds,
}
