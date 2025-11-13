7000:           recommendations.reasoning = '对于困难题目，建议降低 temperature 以提高准确性。'
7001:         }
7002: 
7003:         sendResponse(res, 200, recommendations, '推荐参数成功')
7004:       } catch (error) {
7005:         sendResponse(res, 400, null, '请求数据格式错误')
7006:       }
7007:     })
7008:   },
7009: 
7010:   // ==================== 社区论坛 API ====================
7011: 
7012:   // 获取论坛板块列表
7013:   'GET:/api/community/forums': (req, res) => {
7014:     const forums = mockData.forums
7015:       .filter(f => f.active)
7016:       .sort((a, b) => a.sortOrder - b.sortOrder)
7017:     sendResponse(res, 200, forums, '获取板块列表成功')
7018:   },
7019: 
7020:   // 获取指定板块的帖子列表
7021:   'GET:/api/community/forums/:slug/posts': (req, res) => {
7022:     const parsedUrl = url.parse(req.url, true)
7023:     const pathParts = parsedUrl.pathname.split('/')
7024:     const slug = pathParts[4]
7025:     const query = parsedUrl.query
7026: 
7027:     const forum = mockData.forums.find(f => f.slug === slug)
7028:     if (!forum) {
7029:       sendResponse(res, 404, null, '板块不存在')
7030:       return
7031:     }
7032: 
7033:     let posts = mockData.posts.filter(p => p.forumId === forum.id)
7034: 
7035:     // 关键词搜索（兼容 search/keyword/q）
7036:     try {
7037:       const kw = ((query.keyword || query.search || query.q || '') + '').trim().toLowerCase()
7038:       if (kw) {
7039:         posts = posts.filter(p =>
7040:           ((p.title || '') + '').toLowerCase().includes(kw) ||
7041:           ((p.content || '') + '').toLowerCase().includes(kw)
7042:         )
7043:       }
7044:     } catch (_) { /* no-op */ }
7045: 
7046:     // 标签过滤
7047:     if (query.tag) {
7048:       posts = posts.filter(p => Array.isArray(p.tags) && p.tags.includes(query.tag))
7049:     }
7050: 
7051:     // 排序：置顶优先，然后按更新时间
7052:     posts.sort((a, b) => {
7053:       if (a.isPinned !== b.isPinned) {
7054:         return b.isPinned ? 1 : -1
7055:       }
7056:       return new Date(b.updatedAt) - new Date(a.updatedAt)
7057:     })
7058: 
7059:     const sizeParam = query.pageSize || query.size || 20
7060:     const paginatedResult = paginate(posts, query.page, sizeParam)
7061:     sendResponse(res, 200, paginatedResult, '获取帖子列表成功')
7062:   },
7063: 
7064:   // 获取所有帖子列表（支持搜索和筛选）
7065:   'GET:/api/community/posts': (req, res) => {
7066:     const parsedUrl = url.parse(req.url, true)
7067:     const query = parsedUrl.query
7068: 
7069:     let posts = [...mockData.posts]
7070: 
7071:     // 按板块筛选
7072:     if (query.forumId) {
7073:       posts = posts.filter(p => p.forumId === parseInt(query.forumId))
7074:     }
7075: 
7076:     // 按标签筛选
7077:     if (query.tag) {
7078:       posts = posts.filter(p => p.tags && p.tags.includes(query.tag))
7079:     }
7080: 
7081:     // 关键词搜索
7082:     try {
7083:       const kwAll = ((query.keyword || query.search || query.q || '') + '').trim().toLowerCase()
7084:       if (kwAll) {
7085:         posts = posts.filter(p =>
7086:           ((p.title || '') + '').toLowerCase().includes(kwAll) ||
7087:           ((p.content || '') + '').toLowerCase().includes(kwAll)
7088:         )
7089:       }
7090:     } catch (_) { /* no-op */ }
7091: 
7092:     // 排序
7093:     const sortBy = query.sortBy || 'latest'
7094:     if (sortBy === 'latest') {
7095:       posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
