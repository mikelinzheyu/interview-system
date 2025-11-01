
/**
 * Phase 7C: Message Collection & Marking Handlers
 */

/**
 * 收藏消息
 */
async function handleCollectMessage(messageId) {
  const message = store.getMessageById(messageId)
  if (!message) {
    ElMessage.error('消息不存在')
    return
  }

  const success = await collectMessage(messageId, store.activeConversationId, {
    content: message.content,
    type: message.type || 'text',
    senderName: message.senderName,
    senderId: message.senderId,
    conversationId: store.activeConversationId,
    attachments: message.attachments || [],
    quotedMessage: message.quotedMessage || null,
    editCount: message.editCount || 0,
    isRecalled: message.isRecalled || false
  })

  if (success) {
    ElMessage.success('已收藏消息')
  }
}

/**
 * 取消收藏
 */
async function handleUncollectMessage(messageId) {
  const success = await uncollectMessage(messageId)
  if (success) {
    ElMessage.success('已取消收藏')
  }
}

/**
 * 查看收藏详情
 */
function handleViewCollection(collection) {
  selectedCollection.value = collection
  showCollectionDetailModal.value = true
}

/**
 * 更新收藏备注
 */
function handleUpdateCollectionNote(messageId, note) {
  updateCollectionNote(messageId, note)
  ElMessage.success('备注已保存')
}

/**
 * 删除收藏
 */
async function handleDeleteCollection(messageId) {
  const success = await uncollectMessage(messageId)
  if (success) {
    ElMessage.success('已删除收藏')
  }
}

/**
 * 标记消息
 */
function handleMarkMessage(messageId, markType) {
  const success = markMessage(messageId, markType)
  if (success) {
    ElMessage.success(`已标记为 ${markType}`)
  }
}

/**
 * 取消标记
 */
function handleUnmarkMessage(messageId, markType) {
  const success = unmarkMessage(messageId, markType)
  if (success) {
    ElMessage.success('已取消标记')
  }
}

/**
 * 添加标签到消息
 */
function handleAddTagToMessage(messageId, tag) {
  const success = addTag(messageId, tag)
  if (success) {
    ElMessage.success(`已添加标签: ${tag.name}`)
  }
}

/**
 * 移除消息标签
 */
function handleRemoveMessageTag(messageId, tagId) {
  const success = removeTag(messageId, tagId)
  if (success) {
    ElMessage.success('标签已移除')
  }
}

/**
 * 创建新标签
 */
function handleCreateTag(name, color) {
  const newTag = createTag(name, color)
  if (newTag) {
    ElMessage.success(`已创建标签: ${name}`)
  }
}

/**
 * 更新标签
 */
function handleUpdateTag(tagId, name, color) {
  const success = updateTag(tagId, name, color)
  if (success) {
    ElMessage.success('标签已更新')
  }
}

/**
 * 删除标签
 */
function handleDeleteTag(tagId) {
  const success = deleteTag(tagId)
  if (success) {
    ElMessage.success('标签已删除')
  }
}

/**
 * 切换收藏面板
 */
function handleToggleCollectionPanel() {
  showCollectionPanel.value = !showCollectionPanel.value
}

/**
 * 切换标记面板
 */
function handleToggleMarkingPanel() {
  showMarkingPanel.value = !showMarkingPanel.value
}

/**
 * 处理查看原消息（从收藏详情）
 */
function handleViewOriginalFromCollection(messageId) {
  const message = store.getMessageById(messageId)
  if (message) {
    // Scroll to message
    const element = document.querySelector(`[data-message-id="${messageId}"]`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      ElMessage.success('已定位到原消息')
    } else {
      ElMessage.warning('原消息已删除或不在当前视图')
    }
  }
  showCollectionDetailModal.value = false
}

/**
 * 关闭标签管理器
 */
function handleCloseTagManager() {
  showTagManager.value = false
}
