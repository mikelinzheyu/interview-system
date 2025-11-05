import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

/**
 * 收藏管理 Store
 * 支持收藏学科、专业、细分方向
 * 提供备注、标签、时间戳等元数据
 */
export const useFavoritesStore = defineStore('favorites', () => {
  // ============ 状态 ============
  const favorites = ref([])
  const tags = ref(new Set()) // 所有使用过的标签
  const loading = ref(false)
  const error = ref(null)

  // ============ 初始化 ============
  function initFavorites() {
    try {
      const saved = localStorage.getItem('favorites')
      if (saved) {
        const parsed = JSON.parse(saved)
        favorites.value = parsed
        // 重建标签集合
        parsed.forEach(fav => {
          if (Array.isArray(fav.tags)) {
            fav.tags.forEach(tag => tags.value.add(tag))
          }
        })
      }
    } catch (err) {
      console.error('Failed to load favorites from localStorage:', err)
    }
  }

  // ============ 保存到 localStorage ============
  function saveFavorites() {
    try {
      localStorage.setItem('favorites', JSON.stringify(favorites.value))
    } catch (err) {
      console.error('Failed to save favorites to localStorage:', err)
      error.value = err
    }
  }

  // ============ 添加收藏 ============
  /**
   * 添加收藏项
   * @param {Object} item - 收藏项（可以是学科、专业、细分方向）
   * @param {string} type - 类型: 'discipline', 'majorGroup', 'major', 'specialization'
   * @param {Object} options - 选项 { notes, tags, parentId, parentName }
   */
  function addFavorite(item, type, options = {}) {
    if (!item || !item.id) {
      ElMessage.error('收藏项不完整')
      return false
    }

    // 检查是否已收藏
    const exists = favorites.value.some(fav => fav.id === item.id && fav.type === type)
    if (exists) {
      ElMessage.warning('该项已收藏')
      return false
    }

    const favorite = {
      id: item.id,
      name: item.name,
      type,
      icon: item.icon,
      description: item.description,
      notes: options.notes || '',
      tags: options.tags || [],
      parentId: options.parentId || null,
      parentName: options.parentName || null,
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    favorites.value.unshift(favorite)

    // 更新标签集合
    if (Array.isArray(favorite.tags)) {
      favorite.tags.forEach(tag => tags.value.add(tag))
    }

    saveFavorites()
    ElMessage.success('收藏成功')
    return true
  }

  // ============ 移除收藏 ============
  function removeFavorite(id) {
    const index = favorites.value.findIndex(fav => fav.id === id)
    if (index > -1) {
      favorites.value.splice(index, 1)
      saveFavorites()
      ElMessage.success('已移除收藏')
      return true
    }
    return false
  }

  // ============ 更新收藏 ============
  function updateFavorite(id, updates) {
    const favorite = favorites.value.find(fav => fav.id === id)
    if (!favorite) {
      return false
    }

    // 更新标签集合
    if (updates.tags && Array.isArray(updates.tags)) {
      const oldTags = favorite.tags || []
      const newTags = updates.tags

      oldTags.forEach(tag => {
        // 检查这个标签是否还被其他收藏使用
        if (!favorites.value.some(fav => fav.id !== id && fav.tags && fav.tags.includes(tag))) {
          // 如果没有其他收藏使用，删除这个标签
          if (!newTags.includes(tag)) {
            tags.value.delete(tag)
          }
        }
      })

      newTags.forEach(tag => tags.value.add(tag))
    }

    Object.assign(favorite, updates, {
      updatedAt: new Date().toISOString()
    })

    saveFavorites()
    ElMessage.success('已更新')
    return true
  }

  // ============ 查询函数 ============
  /**
   * 检查是否已收藏
   */
  function isFavorited(id) {
    return favorites.value.some(fav => fav.id === id)
  }

  /**
   * 根据ID获取收藏项
   */
  function getFavoriteById(id) {
    return favorites.value.find(fav => fav.id === id)
  }

  /**
   * 按类型过滤收藏
   */
  function getFavoritesByType(type) {
    return favorites.value.filter(fav => fav.type === type)
  }

  /**
   * 按标签过滤收藏
   */
  function getFavoritesByTag(tag) {
    return favorites.value.filter(fav => fav.tags && fav.tags.includes(tag))
  }

  /**
   * 按搜索词查询收藏
   */
  function searchFavorites(query) {
    if (!query.trim()) {
      return favorites.value
    }

    const lowerQuery = query.toLowerCase()
    return favorites.value.filter(fav =>
      fav.name.toLowerCase().includes(lowerQuery) ||
      (fav.description && fav.description.toLowerCase().includes(lowerQuery)) ||
      (fav.notes && fav.notes.toLowerCase().includes(lowerQuery))
    )
  }

  // ============ 批量操作 ============
  /**
   * 清空所有收藏
   */
  function clearAllFavorites() {
    if (confirm('确定要清空所有收藏吗？')) {
      favorites.value = []
      tags.value.clear()
      saveFavorites()
      ElMessage.success('已清空所有收藏')
    }
  }

  /**
   * 导出收藏为 JSON
   */
  function exportFavorites() {
    const dataStr = JSON.stringify(favorites.value, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `favorites-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  /**
   * 导入收藏从 JSON
   */
  function importFavorites(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result)
          if (!Array.isArray(imported)) {
            throw new Error('Invalid format')
          }

          // 合并导入的收藏
          imported.forEach(item => {
            if (!favorites.value.some(fav => fav.id === item.id)) {
              favorites.value.push(item)
              if (item.tags) {
                item.tags.forEach(tag => tags.value.add(tag))
              }
            }
          })

          saveFavorites()
          ElMessage.success(`已导入 ${imported.length} 条收藏`)
          resolve(imported)
        } catch (err) {
          ElMessage.error('导入失败：文件格式不正确')
          reject(err)
        }
      }
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  // ============ 统计信息 ============
  const favoritesCount = computed(() => favorites.value.length)

  const typeStats = computed(() => {
    const stats = {
      discipline: 0,
      majorGroup: 0,
      major: 0,
      specialization: 0
    }
    favorites.value.forEach(fav => {
      if (stats.hasOwnProperty(fav.type)) {
        stats[fav.type]++
      }
    })
    return stats
  })

  const recentFavorites = computed(() => {
    return [...favorites.value].slice(0, 10)
  })

  const allTags = computed(() => {
    return Array.from(tags.value).sort()
  })

  const tagStats = computed(() => {
    const stats = {}
    allTags.value.forEach(tag => {
      stats[tag] = favorites.value.filter(fav => fav.tags && fav.tags.includes(tag)).length
    })
    return stats
  })

  // ============ 导出 ============
  return {
    // 状态
    favorites,
    tags,
    loading,
    error,

    // 计算属性
    favoritesCount,
    typeStats,
    recentFavorites,
    allTags,
    tagStats,

    // 初始化
    initFavorites,

    // 基础操作
    addFavorite,
    removeFavorite,
    updateFavorite,
    isFavorited,

    // 查询
    getFavoriteById,
    getFavoritesByType,
    getFavoritesByTag,
    searchFavorites,

    // 批量操作
    clearAllFavorites,
    exportFavorites,
    importFavorites
  }
})
