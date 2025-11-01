/**
 * Collection Service - User's domain collections and learning plans
 *
 * Features:
 * - Create/edit/delete collections
 * - Add/remove domains from collections
 * - Organize domains by category
 * - Add notes and tags to domains
 * - Share collections (optional)
 * - Export collections
 * - Track collection statistics
 *
 * @module collectionService
 */

/**
 * Collection Data Structure
 * @typedef {Object} Collection
 * @property {string} id - Unique collection identifier
 * @property {string} userId - Owner user ID
 * @property {string} name - Collection name
 * @property {string} description - Collection description
 * @property {string} color - Color tag (#hex)
 * @property {string} icon - Icon name/emoji
 * @property {CollectionDomain[]} domains - Domains in collection
 * @property {string[]} tags - Collection tags
 * @property {number} orderIndex - Sort order
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 * @property {boolean} isPublic - Whether shareable
 * @property {string[]} sharedWith - User IDs collection is shared with
 */

/**
 * Collection Domain Entry
 * @typedef {Object} CollectionDomain
 * @property {number} domainId - Domain ID
 * @property {string} domainName - Domain name
 * @property {string} notes - User notes for this domain
 * @property {string[]} customTags - User-defined tags
 * @property {number} priority - 1-5 priority level
 * @property {Date} addedAt - When added to collection
 * @property {boolean} isCompleted - User marked as complete
 */

const DEFAULT_COLORS = [
  '#5e7ce0', // Blue
  '#67c23a', // Green
  '#e6a23c', // Yellow
  '#f56c6c', // Red
  '#909399', // Gray
  '#8e44ad', // Purple
  '#3498db', // Light Blue
  '#1abc9c'  // Turquoise
]

const DEFAULT_ICONS = [
  '📚', '🎓', '💻', '🚀', '🎯', '📖', '⭐', '🔥'
]

const collectionService = {
  /**
   * Create a new collection
   * @param {Object} data - Collection data
   * @returns {Collection} Created collection
   */
  createCollection(data) {
    const {
      userId = 'current_user',
      name = 'New Collection',
      description = '',
      color = DEFAULT_COLORS[0],
      icon = DEFAULT_ICONS[0],
      tags = [],
      isPublic = false
    } = data

    if (!name || name.trim().length === 0) {
      throw new Error('Collection name is required')
    }

    return {
      id: this._generateId(),
      userId,
      name: name.trim(),
      description: description.trim(),
      color,
      icon,
      domains: [],
      tags: Array.isArray(tags) ? tags : [],
      orderIndex: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic,
      sharedWith: []
    }
  },

  /**
   * Add domain to collection
   * @param {Collection} collection - Collection to add to
   * @param {number} domainId - Domain ID
   * @param {Object} options - Additional options
   * @returns {Collection} Updated collection
   */
  addDomainToCollection(collection, domainId, options = {}) {
    const {
      domainName = `Domain #${domainId}`,
      notes = '',
      customTags = [],
      priority = 3
    } = options

    // Check if domain already in collection
    if (collection.domains.some(d => d.domainId === domainId)) {
      throw new Error('Domain already in this collection')
    }

    collection.domains.push({
      domainId,
      domainName,
      notes,
      customTags: Array.isArray(customTags) ? customTags : [],
      priority: Math.max(1, Math.min(5, priority)),
      addedAt: new Date(),
      isCompleted: false
    })

    collection.updatedAt = new Date()
    return collection
  },

  /**
   * Remove domain from collection
   * @param {Collection} collection - Collection
   * @param {number} domainId - Domain ID to remove
   * @returns {Collection} Updated collection
   */
  removeDomainFromCollection(collection, domainId) {
    const initialLength = collection.domains.length
    collection.domains = collection.domains.filter(d => d.domainId !== domainId)

    if (collection.domains.length === initialLength) {
      throw new Error('Domain not found in collection')
    }

    collection.updatedAt = new Date()
    return collection
  },

  /**
   * Update domain notes in collection
   * @param {Collection} collection - Collection
   * @param {number} domainId - Domain ID
   * @param {string} notes - New notes
   * @returns {Collection} Updated collection
   */
  updateDomainNotes(collection, domainId, notes) {
    const domain = collection.domains.find(d => d.domainId === domainId)

    if (!domain) {
      throw new Error('Domain not found in collection')
    }

    domain.notes = notes.trim()
    domain.updatedAt = new Date()
    collection.updatedAt = new Date()

    return collection
  },

  /**
   * Update domain priority
   * @param {Collection} collection - Collection
   * @param {number} domainId - Domain ID
   * @param {number} priority - Priority 1-5
   * @returns {Collection} Updated collection
   */
  updateDomainPriority(collection, domainId, priority) {
    const domain = collection.domains.find(d => d.domainId === domainId)

    if (!domain) {
      throw new Error('Domain not found in collection')
    }

    domain.priority = Math.max(1, Math.min(5, priority))
    collection.updatedAt = new Date()

    return collection
  },

  /**
   * Mark domain as completed in collection
   * @param {Collection} collection - Collection
   * @param {number} domainId - Domain ID
   * @param {boolean} completed - Completion status
   * @returns {Collection} Updated collection
   */
  markDomainCompleted(collection, domainId, completed = true) {
    const domain = collection.domains.find(d => d.domainId === domainId)

    if (!domain) {
      throw new Error('Domain not found in collection')
    }

    domain.isCompleted = completed
    collection.updatedAt = new Date()

    return collection
  },

  /**
   * Add tag to domain in collection
   * @param {Collection} collection - Collection
   * @param {number} domainId - Domain ID
   * @param {string} tag - Tag to add
   * @returns {Collection} Updated collection
   */
  addTagToDomain(collection, domainId, tag) {
    const domain = collection.domains.find(d => d.domainId === domainId)

    if (!domain) {
      throw new Error('Domain not found in collection')
    }

    const cleanTag = tag.trim()
    if (cleanTag && !domain.customTags.includes(cleanTag)) {
      domain.customTags.push(cleanTag)
      collection.updatedAt = new Date()
    }

    return collection
  },

  /**
   * Remove tag from domain
   * @param {Collection} collection - Collection
   * @param {number} domainId - Domain ID
   * @param {string} tag - Tag to remove
   * @returns {Collection} Updated collection
   */
  removeTagFromDomain(collection, domainId, tag) {
    const domain = collection.domains.find(d => d.domainId === domainId)

    if (!domain) {
      throw new Error('Domain not found in collection')
    }

    domain.customTags = domain.customTags.filter(t => t !== tag)
    collection.updatedAt = new Date()

    return collection
  },

  /**
   * Update collection metadata
   * @param {Collection} collection - Collection
   * @param {Object} updates - Update data
   * @returns {Collection} Updated collection
   */
  updateCollection(collection, updates) {
    const allowedFields = ['name', 'description', 'color', 'icon', 'tags', 'isPublic']

    allowedFields.forEach(field => {
      if (field in updates) {
        if (field === 'name' && (!updates[field] || updates[field].trim().length === 0)) {
          throw new Error('Collection name cannot be empty')
        }
        collection[field] = field === 'name' || field === 'description'
          ? updates[field].trim()
          : updates[field]
      }
    })

    collection.updatedAt = new Date()
    return collection
  },

  /**
   * Get collection statistics
   * @param {Collection} collection - Collection
   * @returns {Object} Statistics
   */
  getCollectionStats(collection) {
    const domains = collection.domains
    const completed = domains.filter(d => d.isCompleted).length
    const totalPriority = domains.reduce((sum, d) => sum + d.priority, 0)
    const avgPriority = domains.length > 0 ? totalPriority / domains.length : 0

    return {
      totalDomains: domains.length,
      completedDomains: completed,
      completionPercentage: domains.length > 0 ? Math.round((completed / domains.length) * 100) : 0,
      averagePriority: Math.round(avgPriority * 10) / 10,
      createdDaysAgo: Math.floor((Date.now() - collection.createdAt) / (1000 * 60 * 60 * 24)),
      lastUpdatedDaysAgo: Math.floor((Date.now() - collection.updatedAt) / (1000 * 60 * 60 * 24)),
      highPriorityCount: domains.filter(d => d.priority >= 4).length,
      tagsUsed: [...new Set(domains.flatMap(d => d.customTags))].length
    }
  },

  /**
   * Sort domains in collection
   * @param {Collection} collection - Collection
   * @param {string} sortBy - Sort key: 'priority', 'name', 'added', 'completed'
   * @param {boolean} descending - Sort descending
   * @returns {Collection} Updated collection
   */
  sortDomains(collection, sortBy = 'priority', descending = true) {
    const sorted = [...collection.domains]

    switch (sortBy) {
      case 'priority':
        sorted.sort((a, b) => {
          const diff = b.priority - a.priority
          return descending ? diff : -diff
        })
        break

      case 'name':
        sorted.sort((a, b) => {
          const diff = a.domainName.localeCompare(b.domainName)
          return descending ? -diff : diff
        })
        break

      case 'added':
        sorted.sort((a, b) => {
          const diff = b.addedAt - a.addedAt
          return descending ? diff : -diff
        })
        break

      case 'completed':
        sorted.sort((a, b) => {
          const aCompleted = a.isCompleted ? 1 : 0
          const bCompleted = b.isCompleted ? 1 : 0
          const diff = bCompleted - aCompleted
          return descending ? diff : -diff
        })
        break
    }

    collection.domains = sorted
    return collection
  },

  /**
   * Filter domains in collection
   * @param {Collection} collection - Collection
   * @param {Object} filters - Filter criteria
   * @returns {CollectionDomain[]} Filtered domains
   */
  filterDomains(collection, filters = {}) {
    const {
      searchQuery = '',
      priority = null,
      completed = null,
      tags = []
    } = filters

    let filtered = [...collection.domains]

    // Search by name or notes
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(d =>
        d.domainName.toLowerCase().includes(query) ||
        d.notes.toLowerCase().includes(query)
      )
    }

    // Filter by priority
    if (priority !== null) {
      filtered = filtered.filter(d => d.priority === priority)
    }

    // Filter by completion status
    if (completed !== null) {
      filtered = filtered.filter(d => d.isCompleted === completed)
    }

    // Filter by tags (domain must have ALL selected tags)
    if (tags.length > 0) {
      filtered = filtered.filter(d =>
        tags.every(tag => d.customTags.includes(tag))
      )
    }

    return filtered
  },

  /**
   * Search collections
   * @param {Collection[]} collections - Array of collections
   * @param {string} query - Search query
   * @returns {Collection[]} Matching collections
   */
  searchCollections(collections, query) {
    if (!query || query.trim().length === 0) {
      return collections
    }

    const lowerQuery = query.toLowerCase()

    return collections.filter(c =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.description.toLowerCase().includes(lowerQuery) ||
      c.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  },

  /**
   * Export collection as JSON
   * @param {Collection} collection - Collection to export
   * @returns {string} JSON string
   */
  exportCollection(collection) {
    const exportData = {
      name: collection.name,
      description: collection.description,
      domains: collection.domains.map(d => ({
        domainId: d.domainId,
        domainName: d.domainName,
        notes: d.notes,
        customTags: d.customTags,
        priority: d.priority,
        isCompleted: d.isCompleted
      })),
      tags: collection.tags,
      exportedAt: new Date().toISOString()
    }

    return JSON.stringify(exportData, null, 2)
  },

  /**
   * Import collection from JSON
   * @param {string} jsonData - JSON data
   * @param {string} userId - User ID
   * @returns {Collection} Imported collection
   */
  importCollection(jsonData, userId = 'current_user') {
    try {
      const data = JSON.parse(jsonData)

      const collection = this.createCollection({
        userId,
        name: data.name || 'Imported Collection',
        description: data.description || '',
        tags: data.tags || []
      })

      // Add domains from import
      if (Array.isArray(data.domains)) {
        data.domains.forEach(d => {
          try {
            this.addDomainToCollection(collection, d.domainId, {
              domainName: d.domainName,
              notes: d.notes || '',
              customTags: d.customTags || [],
              priority: d.priority || 3
            })

            // Set completion status if it was saved
            const domain = collection.domains[collection.domains.length - 1]
            domain.isCompleted = d.isCompleted || false
          } catch (err) {
            console.warn(`Failed to import domain ${d.domainId}:`, err)
          }
        })
      }

      return collection
    } catch (err) {
      throw new Error(`Failed to import collection: ${err.message}`)
    }
  },

  /**
   * Generate shareable link for collection (mock)
   * @param {Collection} collection - Collection
   * @returns {string} Share link
   */
  generateShareLink(collection) {
    const shareId = this._generateId()
    return `/share/collection/${shareId}`
  },

  /**
   * Get suggested tags for a collection
   * @param {Collection} collection - Collection
   * @returns {string[]} Suggested tags
   */
  getSuggestedTags(collection) {
    const allTags = new Map()

    collection.domains.forEach(d => {
      d.customTags.forEach(tag => {
        allTags.set(tag, (allTags.get(tag) || 0) + 1)
      })
    })

    // Return top 10 tags by frequency
    return Array.from(allTags.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(entry => entry[0])
  },

  /**
   * Get color options
   * @returns {string[]} Array of color hex codes
   */
  getColorOptions() {
    return [...DEFAULT_COLORS]
  },

  /**
   * Get icon options
   * @returns {string[]} Array of icon emojis
   */
  getIconOptions() {
    return [...DEFAULT_ICONS]
  },

  /**
   * Generate unique ID
   * @private
   * @returns {string} Unique ID
   */
  _generateId() {
    return `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export default collectionService
