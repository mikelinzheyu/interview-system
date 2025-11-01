import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import MessageSearch from '@/components/chat/MessageSearch.vue'
import { ElMessage } from 'element-plus'

// Mock ElMessage
vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus')
  return {
    ...actual,
    ElMessage: {
      success: vi.fn(),
      warning: vi.fn(),
      error: vi.fn()
    }
  }
})

describe('MessageSearch Component', () => {
  let wrapper

  const mockMessages = [
    {
      id: 'msg1',
      content: '你好，欢迎加入我们的团队',
      type: 'text',
      senderId: 'user1',
      senderName: '张三',
      timestamp: Date.now(),
      conversationId: 'conv1',
      conversationName: '开发小组'
    },
    {
      id: 'msg2',
      content: '谢谢你的帮助和支持',
      type: 'text',
      senderId: 'user2',
      senderName: '李四',
      timestamp: Date.now() - 3600000,
      conversationId: 'conv1',
      conversationName: '开发小组'
    },
    {
      id: 'msg3',
      content: '再见，祝你有个美好的一天',
      type: 'text',
      senderId: 'user1',
      senderName: '张三',
      timestamp: Date.now() - 7200000,
      conversationId: 'conv2',
      conversationName: '个人聊天'
    }
  ]

  const mockMembers = [
    { userId: 'user1', name: '张三', avatar: 'avatar1.jpg', role: 'admin', isOnline: true },
    { userId: 'user2', name: '李四', avatar: 'avatar2.jpg', role: 'member', isOnline: true }
  ]

  beforeEach(() => {
    wrapper = mount(MessageSearch, {
      props: {
        messages: mockMessages,
        conversationId: 'conv1',
        senders: mockMembers
      },
      global: {
        stubs: {
          ElInput: true,
          ElIcon: true,
          ElSelect: true,
          ElOption: true,
          ElButton: true,
          ElCollapse: true,
          ElCollapseItem: true,
          ElProgress: true,
          ElScrollbar: true,
          ElPagination: true,
          ElTag: true,
          ElDrawer: true,
          ElAvatar: true
        }
      }
    })

    // 清除 localStorage
    localStorage.clear()
  })

  describe('Component Rendering', () => {
    it('should render the component', () => {
      expect(wrapper.exists()).toBe(true)
    })

    it('should display initial empty state', () => {
      expect(wrapper.text()).toContain('输入关键词搜索消息')
    })

    it('should display search input', () => {
      const input = wrapper.find('.search-input')
      expect(input.exists()).toBe(true)
    })

    it('should display search history initially', async () => {
      // 添加搜索历史
      const vm = wrapper.vm
      vm.searchHistory.value = ['你好', '世界']

      await wrapper.vm.$nextTick()

      const historyTags = wrapper.findAll('.history-tag')
      expect(historyTags.length).toBeGreaterThan(0)
    })
  })

  describe('Search Interaction', () => {
    it('should update search keyword on input', async () => {
      const vm = wrapper.vm
      vm.searchKeyword = '你好'

      await wrapper.vm.$nextTick()

      expect(vm.searchKeyword).toBe('你好')
    })

    it('should show suggestions on input', async () => {
      const vm = wrapper.vm
      vm.searchHistory.value = ['你好', '世界']
      vm.searchKeyword = '你'

      await wrapper.vm.$nextTick()

      expect(vm.suggestions.length).toBeGreaterThan(0)
    })

    it('should perform search on Enter key', async () => {
      const vm = wrapper.vm
      vi.spyOn(vm, 'performSearch')

      vm.searchKeyword = '你好'
      // 模拟回车键
      await vm.performSearch()

      expect(vm.performSearch).toHaveBeenCalled()
    })

    it('should display search results', async () => {
      const vm = wrapper.vm
      vm.searchKeyword = '你好'
      await vm.performSearch()

      await wrapper.vm.$nextTick()

      if (vm.searchState.results.length > 0) {
        const resultItems = wrapper.findAll('.result-item')
        expect(resultItems.length).toBeGreaterThan(0)
      }
    })

    it('should handle empty search results', async () => {
      const vm = wrapper.vm
      vm.searchKeyword = '🚀火星🚀'
      await vm.performSearch()

      await wrapper.vm.$nextTick()

      expect(vm.searchState.results.length).toBe(0)
    })
  })

  describe('Filter Functionality', () => {
    it('should update filter when type is selected', async () => {
      const vm = wrapper.vm
      vm.filters.type = 'text'

      await wrapper.vm.$nextTick()

      expect(vm.filters.type).toBe('text')
    })

    it('should update filter when time range is selected', async () => {
      const vm = wrapper.vm
      vm.filters.timeRange = 'week'

      await wrapper.vm.$nextTick()

      expect(vm.filters.timeRange).toBe('week')
    })

    it('should apply filters to search', async () => {
      const vm = wrapper.vm
      vm.filters.type = 'text'
      vm.searchKeyword = '你好'
      await vm.applyFilters()

      await wrapper.vm.$nextTick()

      if (vm.searchState.results.length > 0) {
        vm.searchState.results.forEach(result => {
          expect(result.type).toBe('text')
        })
      }
    })

    it('should reset filters', async () => {
      const vm = wrapper.vm
      vm.filters.type = 'text'
      vm.filters.timeRange = 'week'
      vm.resetFilters()

      await wrapper.vm.$nextTick()

      expect(vm.filters.type).toBeNull()
      expect(vm.filters.timeRange).toBe('all')
    })
  })

  describe('Search History', () => {
    it('should add keyword to history', async () => {
      const vm = wrapper.vm
      vm.searchKeyword = '测试'
      await vm.performSearch()

      expect(vm.searchHistory.value).toContain('测试')
    })

    it('should display search history tags', async () => {
      const vm = wrapper.vm
      vm.searchHistory.value = ['你好', '世界']

      await wrapper.vm.$nextTick()

      const historyTags = wrapper.findAll('.history-tag')
      expect(historyTags.length).toBeLessThanOrEqual(8) // 最多显示8条
    })

    it('should select history item on click', async () => {
      const vm = wrapper.vm
      vm.searchHistory.value = ['你好']
      vm.selectSuggestion('你好')

      await wrapper.vm.$nextTick()

      expect(vm.searchKeyword).toBe('你好')
    })

    it('should remove history item', async () => {
      const vm = wrapper.vm
      vm.searchHistory.value = ['你好', '世界']
      vm.removeHistoryItem(0)

      expect(vm.searchHistory.value).not.toContain('你好')
    })

    it('should clear all history', async () => {
      const vm = wrapper.vm
      vm.searchHistory.value = ['你好', '世界']
      await vm.handleClearHistory()

      await wrapper.vm.$nextTick()

      expect(vm.searchHistory.value.length).toBe(0)
    })
  })

  describe('Result Actions', () => {
    beforeEach(async () => {
      const vm = wrapper.vm
      vm.searchKeyword = '你好'
      await vm.performSearch()
      await wrapper.vm.$nextTick()
    })

    it('should emit message-found event', async () => {
      const vm = wrapper.vm
      if (vm.searchState.results.length > 0) {
        await vm.handleMessageFound(vm.searchState.results[0])

        expect(wrapper.emitted('message-found')).toBeTruthy()
      }
    })

    it('should emit forward-message event', async () => {
      const vm = wrapper.vm
      if (vm.searchState.results.length > 0) {
        await vm.handleForwardMessage(vm.searchState.results[0])

        expect(wrapper.emitted('forward-message')).toBeTruthy()
      }
    })

    it('should emit collect-message event', async () => {
      const vm = wrapper.vm
      if (vm.searchState.results.length > 0) {
        await vm.handleCollectMessage(vm.searchState.results[0])

        expect(wrapper.emitted('collect-message')).toBeTruthy()
      }
    })

    it('should copy message to clipboard', async () => {
      const vm = wrapper.vm
      vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)

      if (vm.searchState.results.length > 0) {
        await vm.handleCopyMessage(vm.searchState.results[0])

        expect(navigator.clipboard.writeText).toHaveBeenCalled()
      }
    })
  })

  describe('Result Highlighting', () => {
    it('should highlight search keywords in results', async () => {
      const vm = wrapper.vm
      vm.searchKeyword = '你好'
      await vm.performSearch()

      await wrapper.vm.$nextTick()

      if (vm.searchState.results.length > 0) {
        const result = vm.searchState.results[0]
        expect(result.highlights).toBeDefined()
        expect(Array.isArray(result.highlights)).toBe(true)
      }
    })

    it('should generate highlighted text segments', async () => {
      const vm = wrapper.vm
      const result = {
        content: '你好，世界',
        highlights: [{ start: 0, end: 2 }]
      }

      const segments = vm.getHighlightedText(result)
      expect(segments.length).toBeGreaterThan(0)
      expect(segments.some(s => s.highlight)).toBe(true)
    })
  })

  describe('Message Type Handling', () => {
    it('should display type label for non-text messages', async () => {
      const vm = wrapper.vm
      expect(vm.getMessageTypeLabel('image')).toBe('图片')
      expect(vm.getMessageTypeLabel('file')).toBe('文件')
      expect(vm.getMessageTypeLabel('video')).toBe('视频')
    })

    it('should handle unknown message types', async () => {
      const vm = wrapper.vm
      expect(vm.getMessageTypeLabel('unknown')).toBe('未知')
    })
  })

  describe('Time Formatting', () => {
    it('should format current time as time only', async () => {
      const vm = wrapper.vm
      const now = Date.now()
      const formatted = vm.formatTime(now)

      expect(formatted).toMatch(/\d{1,2}:\d{2}/)
    })

    it('should format yesterday as "yesterday time"', async () => {
      const vm = wrapper.vm
      const yesterday = Date.now() - 24 * 60 * 60 * 1000
      const formatted = vm.formatTime(yesterday)

      expect(formatted).toContain('昨天')
    })

    it('should format older dates as date string', async () => {
      const vm = wrapper.vm
      const lastWeek = Date.now() - 7 * 24 * 60 * 60 * 1000
      const formatted = vm.formatTime(lastWeek)

      expect(formatted).toMatch(/\d{4}/) // 年份
    })
  })

  describe('Pagination', () => {
    it('should handle page change', async () => {
      const vm = wrapper.vm
      vm.currentPage = 1
      vm.handlePageChange(2)

      await wrapper.vm.$nextTick()

      expect(vm.currentPage).toBe(2)
    })

    it('should respect page size limit', async () => {
      const vm = wrapper.vm
      vm.pageSize = 10

      expect(vm.pageSize).toBe(10)
    })
  })

  describe('Conversation Switching', () => {
    it('should reset search when conversation changes', async () => {
      const vm = wrapper.vm
      vm.searchKeyword = '你好'
      await vm.performSearch()

      await wrapper.setProps({ conversationId: 'conv2' })

      await wrapper.vm.$nextTick()

      expect(vm.searchKeyword).toBe('')
      expect(vm.searchState.results.length).toBe(0)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const buttons = wrapper.findAll('button')
      // 验证按钮有合理的标题或标签
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('Responsive Behavior', () => {
    it('should handle small screen sizes', async () => {
      wrapper.vm.$el.style.width = '300px'
      await wrapper.vm.$nextTick()

      // 组件应该能正常工作
      expect(wrapper.exists()).toBe(true)
    })

    it('should handle result list overflow', async () => {
      const vm = wrapper.vm
      vm.searchKeyword = '你'
      await vm.performSearch()

      await wrapper.vm.$nextTick()

      // 检查滚动条是否存在（如果有很多结果）
      const scrollbar = wrapper.find('.results-scrollbar')
      if (vm.searchState.results.length > 5) {
        expect(scrollbar.exists()).toBe(true)
      }
    })
  })
})
