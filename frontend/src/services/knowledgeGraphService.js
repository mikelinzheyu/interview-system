/**
 * Knowledge Graph Service - Domain relationships and learning path generation
 *
 * Features:
 * - Build knowledge graph from domains and their relationships
 * - Find learning paths between domains
 * - Calculate prerequisite chains
 * - Identify complementary domains
 * - Compute difficulty progression
 * - Generate mastery time estimates
 *
 * @module knowledgeGraphService
 */

/**
 * Graph Node representing a domain
 * @typedef {Object} GraphNode
 * @property {number} id - Domain ID
 * @property {string} name - Domain name
 * @property {string} difficulty - Difficulty level
 * @property {number} timeRequired - Hours to master
 * @property {number} popularity - 0-100 popularity score
 * @property {number} rating - 0-5 rating
 * @property {string[]} tags - Domain tags
 * @property {string} discipline - Parent discipline
 */

/**
 * Graph Edge representing relationship between domains
 * @typedef {Object} GraphEdge
 * @property {number} from - Source domain ID
 * @property {number} to - Target domain ID
 * @property {string} type - 'prerequisite' | 'complementary' | 'advanced' | 'related'
 * @property {number} strength - Edge strength 0-100
 */

/**
 * Learning Path - sequence of domains
 * @typedef {Object} LearningPath
 * @property {GraphNode[]} domains - Ordered list of domains
 * @property {number} totalTime - Total hours needed
 * @property {string} difficulty - Overall difficulty progression
 * @property {GraphEdge[]} transitions - Relationships between consecutive domains
 * @property {string} description - Human-readable description
 */

const knowledgeGraphService = {
  /**
   * Build a knowledge graph from domains
   * @param {Array} domains - Array of domain objects
   * @returns {Object} Graph structure with nodes and edges
   */
  buildKnowledgeGraph(domains) {
    if (!Array.isArray(domains) || domains.length === 0) {
      return { nodes: [], edges: [], adjacencyList: {} }
    }

    // Create nodes from domains
    const nodes = domains.map(domain => ({
      id: domain.id,
      name: domain.name,
      difficulty: domain.difficulty || 'intermediate',
      timeRequired: domain.timeRequired || 0,
      popularity: domain.popularity || 0,
      rating: domain.rating || 0,
      tags: domain.tags || [],
      discipline: domain.discipline || 'General',
      questionCount: domain.questionCount || 0
    }))

    // Create edges from relationships
    const edges = []
    const edgeSet = new Set() // Prevent duplicates

    domains.forEach(domain => {
      // Prerequisites
      if (domain.prerequisites && Array.isArray(domain.prerequisites)) {
        domain.prerequisites.forEach(preqId => {
          const edgeKey = `${preqId}->${domain.id}`
          if (!edgeSet.has(edgeKey)) {
            edges.push({
              from: preqId,
              to: domain.id,
              type: 'prerequisite',
              strength: 100 // Strong relationship
            })
            edgeSet.add(edgeKey)
          }
        })
      }

      // Related/complementary domains
      if (domain.relatedDomains && Array.isArray(domain.relatedDomains)) {
        domain.relatedDomains.forEach(relatedId => {
          const edgeKey1 = `${domain.id}->${relatedId}`
          const edgeKey2 = `${relatedId}->${domain.id}`

          if (!edgeSet.has(edgeKey1) && !edgeSet.has(edgeKey2)) {
            edges.push({
              from: domain.id,
              to: relatedId,
              type: 'complementary',
              strength: 60
            })
            edgeSet.add(edgeKey1)
          }
        })
      }
    })

    // Build adjacency list for efficient traversal
    const adjacencyList = {}
    nodes.forEach(node => {
      adjacencyList[node.id] = []
    })

    edges.forEach(edge => {
      if (!adjacencyList[edge.from]) {
        adjacencyList[edge.from] = []
      }
      adjacencyList[edge.from].push({
        to: edge.to,
        type: edge.type,
        strength: edge.strength
      })
    })

    return {
      nodes,
      edges,
      adjacencyList,
      buildTime: new Date(),
      domainCount: nodes.length,
      edgeCount: edges.length
    }
  },

  /**
   * Find learning path from start domain to target domain
   * Uses breadth-first search for shortest path
   * @param {number} startId - Starting domain ID
   * @param {number} targetId - Target domain ID
   * @param {Object} graph - Knowledge graph
   * @returns {LearningPath|null} Path or null if no path exists
   */
  findLearningPath(startId, targetId, graph) {
    if (startId === targetId) {
      const domain = graph.nodes.find(n => n.id === startId)
      return domain ? {
        domains: [domain],
        totalTime: domain.timeRequired || 0,
        difficulty: domain.difficulty,
        transitions: [],
        description: `单个学科: ${domain.name}`
      } : null
    }

    // BFS to find path
    const queue = [[startId]]
    const visited = new Set([startId])
    const parent = new Map()

    while (queue.length > 0) {
      const path = queue.shift()
      const current = path[path.length - 1]

      if (current === targetId) {
        return this._buildPathResult(path, graph)
      }

      const neighbors = graph.adjacencyList[current] || []
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.to)) {
          visited.add(neighbor.to)
          parent.set(neighbor.to, current)
          queue.push([...path, neighbor.to])
        }
      }
    }

    // No path found, try reverse path
    return this._findReversePath(startId, targetId, graph)
  },

  /**
   * Build result object for learning path
   * @private
   */
  _buildPathResult(domainIds, graph) {
    const domains = domainIds
      .map(id => graph.nodes.find(n => n.id === id))
      .filter(d => d !== undefined)

    const totalTime = domains.reduce((sum, d) => sum + (d.timeRequired || 0), 0)

    // Get transitions/edges
    const transitions = []
    for (let i = 0; i < domains.length - 1; i++) {
      const edge = graph.edges.find(
        e => e.from === domains[i].id && e.to === domains[i + 1].id
      )
      if (edge) {
        transitions.push(edge)
      }
    }

    // Determine difficulty progression
    const difficulties = { beginner: 0, intermediate: 1, advanced: 2 }
    const avgDifficulty = domains.reduce((sum, d) => {
      return sum + (difficulties[d.difficulty] || 1)
    }, 0) / domains.length

    let difficultyLabel = 'Intermediate'
    if (avgDifficulty < 1) difficultyLabel = 'Beginner'
    if (avgDifficulty > 1.5) difficultyLabel = 'Advanced'

    const description = `${domains.length}步学习路径 • ${totalTime}小时 • ${difficultyLabel}难度`

    return {
      domains,
      totalTime,
      difficulty: difficultyLabel,
      transitions,
      description,
      stepCount: domains.length
    }
  },

  /**
   * Find reverse path when direct path doesn't exist
   * @private
   */
  _findReversePath(startId, targetId, graph) {
    const startNode = graph.nodes.find(n => n.id === startId)
    const targetNode = graph.nodes.find(n => n.id === targetId)

    if (!startNode || !targetNode) return null

    // Try to find path through a common parent or discipline
    if (startNode.discipline === targetNode.discipline) {
      return {
        domains: [startNode, targetNode],
        totalTime: (startNode.timeRequired || 0) + (targetNode.timeRequired || 0),
        difficulty: 'Mixed',
        transitions: [],
        description: `${startNode.name} → ${targetNode.name} (同学科转移)`
      }
    }

    return null
  },

  /**
   * Get all prerequisites for a domain (recursive)
   * @param {number} domainId - Domain ID
   * @param {Object} graph - Knowledge graph
   * @param {Set} visited - Visited domains (for cycle prevention)
   * @returns {GraphNode[]} Array of prerequisite domains
   */
  getPrerequisiteChain(domainId, graph, visited = new Set()) {
    if (visited.has(domainId)) {
      return [] // Prevent infinite loops
    }

    visited.add(domainId)

    const prerequisites = []
    const neighbors = graph.adjacencyList[domainId] || []

    // Find all prerequisite edges pointing TO this domain
    graph.edges.forEach(edge => {
      if (edge.to === domainId && edge.type === 'prerequisite') {
        const node = graph.nodes.find(n => n.id === edge.from)
        if (node && !visited.has(node.id)) {
          prerequisites.push(node)

          // Recursively get prerequisites of prerequisites
          const subPreqs = this.getPrerequisiteChain(node.id, graph, visited)
          prerequisites.push(...subPreqs)
        }
      }
    })

    return prerequisites
  },

  /**
   * Get complementary domains (should be learned together)
   * @param {number} domainId - Domain ID
   * @param {Object} graph - Knowledge graph
   * @returns {GraphNode[]} Complementary domains
   */
  getComplementaryDomains(domainId, graph) {
    const complementary = []

    const edges = graph.edges.filter(
      e => e.from === domainId && e.type === 'complementary'
    )

    edges.forEach(edge => {
      const node = graph.nodes.find(n => n.id === edge.to)
      if (node) {
        complementary.push({
          domain: node,
          strength: edge.strength,
          type: 'complementary'
        })
      }
    })

    return complementary.sort((a, b) => b.strength - a.strength)
  },

  /**
   * Get advanced topics (next level domains)
   * @param {number} domainId - Domain ID
   * @param {Object} graph - Knowledge graph
   * @returns {GraphNode[]} Advanced domains that require this one
   */
  getAdvancedTopics(domainId, graph) {
    const advanced = []

    graph.edges.forEach(edge => {
      if (edge.from === domainId && edge.type === 'prerequisite') {
        const node = graph.nodes.find(n => n.id === edge.to)
        if (node && node.difficulty === 'advanced') {
          advanced.push(node)
        }
      }
    })

    return advanced
  },

  /**
   * Calculate mastery time for a path
   * @param {LearningPath} path - Learning path
   * @returns {Object} Time estimates
   */
  calculateMasteryTime(path) {
    if (!path || !path.domains) {
      return {
        optimistic: 0,
        realistic: 0,
        pessimistic: 0,
        recommendedWeeklyHours: 5
      }
    }

    // Total hours from all domains
    const totalHours = path.domains.reduce(
      (sum, d) => sum + (d.timeRequired || 0),
      0
    )

    // Weekly recommendations
    const recommendedWeeklyHours = this._calculateOptimalPaceHours(path)

    // Time estimates
    const weeksOptimistic = Math.ceil(totalHours / 15)
    const weeksRealistic = Math.ceil(totalHours / recommendedWeeklyHours)
    const weeksPessimistic = Math.ceil(totalHours / 5)

    return {
      totalHours,
      optimistic: weeksOptimistic, // Weeks
      realistic: weeksRealistic,
      pessimistic: weeksPessimistic,
      recommendedWeeklyHours,
      startDate: new Date(),
      completionDate: new Date(
        Date.now() + weeksRealistic * 7 * 24 * 60 * 60 * 1000
      )
    }
  },

  /**
   * Calculate optimal learning pace
   * @private
   */
  _calculateOptimalPaceHours(path) {
    if (!path.domains || path.domains.length === 0) {
      return 5
    }

    // Higher difficulty = more hours per week
    const difficulties = { beginner: 3, intermediate: 5, advanced: 8 }
    const avgDifficulty = path.domains.reduce((sum, d) => {
      return sum + (difficulties[d.difficulty] || 5)
    }, 0) / path.domains.length

    return Math.round(avgDifficulty)
  },

  /**
   * Generate learning roadmap visualization data
   * Formats graph for visualization tools (ECharts, D3, etc.)
   * @param {Object} graph - Knowledge graph
   * @param {Object} options - Visualization options
   * @returns {Object} Formatted data for visualization
   */
  generateVisualizationData(graph, options = {}) {
    const {
      layout = 'tree', // 'tree' or 'force'
      highlightDomainId = null,
      maxLevels = 5,
      colorScheme = 'default'
    } = options

    if (layout === 'tree') {
      return this._generateTreeLayout(graph, highlightDomainId, colorScheme)
    } else {
      return this._generateForceLayout(graph, highlightDomainId, colorScheme)
    }
  },

  /**
   * Generate tree layout for visualization
   * @private
   */
  _generateTreeLayout(graph, highlightId, colorScheme) {
    // Find root nodes (nodes with no prerequisites)
    const rootIds = new Set()

    graph.nodes.forEach(node => {
      const hasIncoming = graph.edges.some(
        e => e.to === node.id && e.type === 'prerequisite'
      )
      if (!hasIncoming) {
        rootIds.add(node.id)
      }
    })

    const nodes = []
    const links = []
    const visited = new Set()

    // Build tree recursively
    const buildTree = (nodeId, parentId = null, level = 0) => {
      if (visited.has(nodeId) || level > 5) {
        return
      }

      visited.add(nodeId)
      const node = graph.nodes.find(n => n.id === nodeId)

      if (node) {
        const color = this._getNodeColor(node, highlightId, colorScheme)
        const size = this._getNodeSize(node)

        nodes.push({
          id: nodeId,
          name: node.name,
          value: size,
          itemStyle: { color },
          label: {
            show: true,
            position: 'top'
          },
          symbolSize: size,
          category: node.difficulty
        })

        if (parentId !== null) {
          links.push({
            source: parentId,
            target: nodeId,
            lineStyle: {
              width: 2,
              color: 'rgba(200, 200, 200, 0.5)'
            }
          })
        }

        // Get children (domains that have this as prerequisite)
        graph.edges.forEach(edge => {
          if (edge.from === nodeId && edge.type === 'prerequisite' && !visited.has(edge.to)) {
            buildTree(edge.to, nodeId, level + 1)
          }
        })
      }
    }

    // Build from all roots
    rootIds.forEach(rootId => {
      buildTree(rootId)
    })

    // If only one root, make it the focus
    const categories = [
      { name: 'beginner', itemStyle: { color: '#67c23a' } },
      { name: 'intermediate', itemStyle: { color: '#e6a23c' } },
      { name: 'advanced', itemStyle: { color: '#f56c6c' } }
    ]

    return {
      nodes,
      links,
      categories,
      layout: 'tree'
    }
  },

  /**
   * Generate force-directed layout for visualization
   * @private
   */
  _generateForceLayout(graph, highlightId, colorScheme) {
    const nodes = graph.nodes.map(node => {
      const color = this._getNodeColor(node, highlightId, colorScheme)
      const size = this._getNodeSize(node)

      return {
        id: node.id,
        name: node.name,
        value: size,
        itemStyle: { color },
        symbolSize: size,
        category: node.difficulty
      }
    })

    const links = graph.edges.map(edge => {
      const lineWidth = edge.type === 'prerequisite' ? 3 : 2
      const opacity = edge.type === 'prerequisite' ? 0.8 : 0.4

      return {
        source: edge.from,
        target: edge.to,
        label: { show: false },
        lineStyle: {
          width: lineWidth,
          opacity,
          color: edge.type === 'prerequisite' ? '#f56c6c' : '#909399'
        }
      }
    })

    const categories = [
      { name: 'beginner', itemStyle: { color: '#67c23a' } },
      { name: 'intermediate', itemStyle: { color: '#e6a23c' } },
      { name: 'advanced', itemStyle: { color: '#f56c6c' } }
    ]

    return {
      nodes,
      links,
      categories,
      layout: 'force'
    }
  },

  /**
   * Get node color based on difficulty
   * @private
   */
  _getNodeColor(node, highlightId, colorScheme) {
    if (highlightId === node.id) {
      return '#5e7ce0' // Highlight color
    }

    const colorMap = {
      beginner: '#67c23a',
      intermediate: '#e6a23c',
      advanced: '#f56c6c'
    }

    return colorMap[node.difficulty] || '#909399'
  },

  /**
   * Get node size based on popularity/importance
   * @private
   */
  _getNodeSize(node) {
    const baseSize = 30
    const popularityBonus = (node.popularity || 0) / 100 * 20
    return baseSize + popularityBonus
  },

  /**
   * Search domains by tags and name
   * @param {string} query - Search query
   * @param {Object} graph - Knowledge graph
   * @returns {GraphNode[]} Matching domains
   */
  searchDomains(query, graph) {
    if (!query || query.length === 0) {
      return []
    }

    const lowerQuery = query.toLowerCase()

    return graph.nodes.filter(node => {
      const nameMatch = node.name.toLowerCase().includes(lowerQuery)
      const tagMatch = node.tags.some(tag =>
        tag.toLowerCase().includes(lowerQuery)
      )
      const disciplineMatch = node.discipline.toLowerCase().includes(lowerQuery)

      return nameMatch || tagMatch || disciplineMatch
    })
  },

  /**
   * Get statistics about the knowledge graph
   * @param {Object} graph - Knowledge graph
   * @returns {Object} Graph statistics
   */
  getGraphStatistics(graph) {
    const difficulties = { beginner: 0, intermediate: 0, advanced: 0 }
    const disciplines = {}
    let totalTime = 0
    let totalQuestions = 0
    let avgRating = 0

    graph.nodes.forEach(node => {
      difficulties[node.difficulty] = (difficulties[node.difficulty] || 0) + 1
      disciplines[node.discipline] = (disciplines[node.discipline] || 0) + 1
      totalTime += node.timeRequired || 0
      totalQuestions += node.questionCount || 0
      avgRating += node.rating || 0
    })

    avgRating = avgRating / graph.nodes.length

    // Find densely connected nodes (hubs)
    const hubs = []
    graph.nodes.forEach(node => {
      const connections = graph.edges.filter(
        e => e.from === node.id || e.to === node.id
      ).length

      if (connections >= 3) {
        hubs.push({ id: node.id, name: node.name, connections })
      }
    })

    return {
      totalNodes: graph.nodes.length,
      totalEdges: graph.edges.length,
      difficulties,
      disciplines,
      totalTime,
      totalQuestions,
      avgRating: Math.round(avgRating * 10) / 10,
      hubs: hubs.sort((a, b) => b.connections - a.connections).slice(0, 5),
      density: (graph.edges.length / (graph.nodes.length * (graph.nodes.length - 1))) * 100
    }
  }
}

export default knowledgeGraphService
