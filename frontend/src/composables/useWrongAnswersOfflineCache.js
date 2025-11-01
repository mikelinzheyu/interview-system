/**
 * Composable for offline caching using IndexedDB
 * Provides persistence layer for wrong answers data
 */

import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

const DB_NAME = 'interview-system'
const DB_VERSION = 2
const STORE_NAMES = {
  WRONG_ANSWERS: 'wrongAnswers',
  SYNC_QUEUE: 'syncQueue',
  METADATA: 'metadata'
}

let db = null

/**
 * Initialize IndexedDB
 */
async function initializeDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error('IndexedDB initialization failed:', request.error)
      reject(request.error)
    }

    request.onupgradeneeded = (event) => {
      const database = event.target.result

      // Create wrong answers store
      if (!database.objectStoreNames.contains(STORE_NAMES.WRONG_ANSWERS)) {
        const wrongAnswersStore = database.createObjectStore(
          STORE_NAMES.WRONG_ANSWERS,
          { keyPath: 'id' }
        )
        wrongAnswersStore.createIndex('userId', 'userId', { unique: false })
        wrongAnswersStore.createIndex('questionId', 'questionId', { unique: false })
        wrongAnswersStore.createIndex('reviewStatus', 'reviewStatus', { unique: false })
        wrongAnswersStore.createIndex('source', 'source', { unique: false })
        wrongAnswersStore.createIndex('errorType', 'errorType', { unique: false })
        wrongAnswersStore.createIndex('nextReviewTime', 'nextReviewTime', { unique: false })
        wrongAnswersStore.createIndex('updatedAt', 'updatedAt', { unique: false })
      }
      // v2 migration: add errorType index when store already exists
      else {
        try {
          const store = event.target.result.transaction.objectStore(STORE_NAMES.WRONG_ANSWERS)
          if (!store.indexNames.contains('errorType')) {
            store.createIndex('errorType', 'errorType', { unique: false })
          }
        } catch (e) {
          // ignore
        }
      }

      // Create sync queue store
      if (!database.objectStoreNames.contains(STORE_NAMES.SYNC_QUEUE)) {
        const syncQueueStore = database.createObjectStore(
          STORE_NAMES.SYNC_QUEUE,
          { keyPath: 'id', autoIncrement: true }
        )
        syncQueueStore.createIndex('recordId', 'recordId', { unique: false })
        syncQueueStore.createIndex('timestamp', 'timestamp', { unique: false })
        syncQueueStore.createIndex('status', 'status', { unique: false })
      }

      // Create metadata store
      if (!database.objectStoreNames.contains(STORE_NAMES.METADATA)) {
        database.createObjectStore(STORE_NAMES.METADATA)
      }
    }

    request.onsuccess = () => {
      db = request.result
      console.log('[IndexedDB] Initialized successfully')
      resolve(db)
    }
  })
}

/**
 * Get database connection
 */
async function getDB() {
  if (!db) {
    await initializeDB()
  }
  return db
}

/**
 * Save wrong answer record to cache
 */
async function saveWrongAnswerToCache(record) {
  try {
    const database = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAMES.WRONG_ANSWERS], 'readwrite')
      const store = transaction.objectStore(STORE_NAMES.WRONG_ANSWERS)

      const enrichedRecord = {
        ...record,
        cachedAt: Date.now(),
        synced: false
      }

      const request = store.put(enrichedRecord)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(enrichedRecord)
    })
  } catch (error) {
    console.error('[IndexedDB] Error saving record:', error)
    throw error
  }
}

/**
 * Save multiple records
 */
async function saveWrongAnswersToCache(records) {
  try {
    const database = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAMES.WRONG_ANSWERS], 'readwrite')
      const store = transaction.objectStore(STORE_NAMES.WRONG_ANSWERS)

      const results = []
      let completed = 0

      records.forEach(record => {
        const enrichedRecord = {
          ...record,
          cachedAt: Date.now(),
          synced: true
        }

        const request = store.put(enrichedRecord)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          results.push(enrichedRecord)
          completed++
          if (completed === records.length) {
            resolve(results)
          }
        }
      })

      if (records.length === 0) {
        resolve([])
      }
    })
  } catch (error) {
    console.error('[IndexedDB] Error saving records:', error)
    throw error
  }
}

/**
 * Get wrong answer from cache by ID
 */
async function getWrongAnswerFromCache(id) {
  try {
    const database = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAMES.WRONG_ANSWERS], 'readonly')
      const store = transaction.objectStore(STORE_NAMES.WRONG_ANSWERS)
      const request = store.get(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  } catch (error) {
    console.error('[IndexedDB] Error getting record:', error)
    throw error
  }
}

/**
 * Get all cached wrong answers for a user
 */
async function getWrongAnswersFromCache(userId) {
  try {
    const database = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAMES.WRONG_ANSWERS], 'readonly')
      const store = transaction.objectStore(STORE_NAMES.WRONG_ANSWERS)
      const index = store.index('userId')
      const request = index.getAll(userId)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  } catch (error) {
    console.error('[IndexedDB] Error getting records:', error)
    throw error
  }
}

/**
 * Get wrong answers by status
 */
async function getWrongAnswersByStatusFromCache(userId, status) {
  try {
    const allRecords = await getWrongAnswersFromCache(userId)
    return allRecords.filter(record => record.reviewStatus === status)
  } catch (error) {
    console.error('[IndexedDB] Error filtering by status:', error)
    throw error
  }
}

/**
 * Delete wrong answer from cache
 */
async function deleteWrongAnswerFromCache(id) {
  try {
    const database = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAMES.WRONG_ANSWERS], 'readwrite')
      const store = transaction.objectStore(STORE_NAMES.WRONG_ANSWERS)
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(true)
    })
  } catch (error) {
    console.error('[IndexedDB] Error deleting record:', error)
    throw error
  }
}

/**
 * Add operation to sync queue
 */
async function addToSyncQueue(operation) {
  try {
    const database = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAMES.SYNC_QUEUE], 'readwrite')
      const store = transaction.objectStore(STORE_NAMES.SYNC_QUEUE)

      const queueItem = {
        type: operation.type, // 'CREATE', 'UPDATE', 'DELETE'
        recordId: operation.recordId,
        data: operation.data,
        timestamp: Date.now(),
        status: 'pending', // 'pending', 'synced', 'failed'
        attempts: 0
      }

      const request = store.add(queueItem)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve({ ...queueItem, id: request.result })
    })
  } catch (error) {
    console.error('[IndexedDB] Error adding to sync queue:', error)
    throw error
  }
}

/**
 * Get pending sync operations
 */
async function getPendingSyncOperations() {
  try {
    const database = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAMES.SYNC_QUEUE], 'readonly')
      const store = transaction.objectStore(STORE_NAMES.SYNC_QUEUE)
      const index = store.index('status')
      const request = index.getAll('pending')

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  } catch (error) {
    console.error('[IndexedDB] Error getting pending operations:', error)
    throw error
  }
}

/**
 * Mark sync operation as synced
 */
async function markSyncOperationAsSynced(operationId) {
  try {
    const database = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAMES.SYNC_QUEUE], 'readwrite')
      const store = transaction.objectStore(STORE_NAMES.SYNC_QUEUE)
      const getRequest = store.get(operationId)

      getRequest.onsuccess = () => {
        const operation = getRequest.result
        if (operation) {
          operation.status = 'synced'
          operation.syncedAt = Date.now()
          const updateRequest = store.put(operation)
          updateRequest.onerror = () => reject(updateRequest.error)
          updateRequest.onsuccess = () => resolve(operation)
        } else {
          reject(new Error('Operation not found'))
        }
      }

      getRequest.onerror = () => reject(getRequest.error)
    })
  } catch (error) {
    console.error('[IndexedDB] Error marking as synced:', error)
    throw error
  }
}

/**
 * Clear sync queue
 */
async function clearSyncQueue() {
  try {
    const database = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAMES.SYNC_QUEUE], 'readwrite')
      const store = transaction.objectStore(STORE_NAMES.SYNC_QUEUE)
      const request = store.clear()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(true)
    })
  } catch (error) {
    console.error('[IndexedDB] Error clearing sync queue:', error)
    throw error
  }
}

/**
 * Save metadata
 */
async function saveMetadata(key, value) {
  try {
    const database = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAMES.METADATA], 'readwrite')
      const store = transaction.objectStore(STORE_NAMES.METADATA)
      const request = store.put({ value, timestamp: Date.now() }, key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(value)
    })
  } catch (error) {
    console.error('[IndexedDB] Error saving metadata:', error)
    throw error
  }
}

/**
 * Get metadata
 */
async function getMetadata(key) {
  try {
    const database = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAMES.METADATA], 'readonly')
      const store = transaction.objectStore(STORE_NAMES.METADATA)
      const request = store.get(key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result?.value || null)
    })
  } catch (error) {
    console.error('[IndexedDB] Error getting metadata:', error)
    throw error
  }
}

/**
 * Clear all data (useful for logout)
 */
async function clearAllData() {
  try {
    const database = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(
        [STORE_NAMES.WRONG_ANSWERS, STORE_NAMES.SYNC_QUEUE, STORE_NAMES.METADATA],
        'readwrite'
      )

      Object.values(STORE_NAMES).forEach(storeName => {
        const store = transaction.objectStore(storeName)
        store.clear()
      })

      transaction.onerror = () => reject(transaction.error)
      transaction.oncomplete = () => resolve(true)
    })
  } catch (error) {
    console.error('[IndexedDB] Error clearing data:', error)
    throw error
  }
}

/**
 * Get database statistics
 */
async function getDBStatistics() {
  try {
    const database = await getDB()
    const wrongAnswersCount = await new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAMES.WRONG_ANSWERS], 'readonly')
      const store = transaction.objectStore(STORE_NAMES.WRONG_ANSWERS)
      const request = store.count()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })

    const pendingOpsCount = await new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAMES.SYNC_QUEUE], 'readonly')
      const store = transaction.objectStore(STORE_NAMES.SYNC_QUEUE)
      const request = store.count()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })

    return {
      wrongAnswersCount,
      pendingOpsCount,
      timestamp: Date.now()
    }
  } catch (error) {
    console.error('[IndexedDB] Error getting statistics:', error)
    throw error
  }
}

/**
 * Vue composable hook
 */
export function useWrongAnswersOfflineCache() {
  const cacheStatus = reactive({
    isInitialized: false,
    hasData: false,
    statistics: null
  })

  const initializeCache = async () => {
    try {
      await initializeDB()
      cacheStatus.isInitialized = true
      console.log('[Offline Cache] Initialized')
      const stats = await getDBStatistics()
      cacheStatus.statistics = stats
      cacheStatus.hasData = stats.wrongAnswersCount > 0
    } catch (error) {
      console.error('[Offline Cache] Initialization failed:', error)
      ElMessage.error('离线缓存初始化失败')
    }
  }

  return {
    // Status
    cacheStatus,

    // Cache operations
    initializeCache,
    saveWrongAnswerToCache,
    saveWrongAnswersToCache,
    getWrongAnswerFromCache,
    getWrongAnswersFromCache,
    getWrongAnswersByStatusFromCache,
    deleteWrongAnswerFromCache,

    // Sync queue operations
    addToSyncQueue,
    getPendingSyncOperations,
    markSyncOperationAsSynced,
    clearSyncQueue,

    // Metadata operations
    saveMetadata,
    getMetadata,

    // Utilities
    clearAllData,
    getDBStatistics
  }
}

export default useWrongAnswersOfflineCache
