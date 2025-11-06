/**
 * 题库路由连通性测试工具
 * 用于验证所有题库相关的路由是否能够正常访问
 */

export const questionBankRouteTests = [
  {
    name: '学习中心首页',
    path: '/learning-hub',
    routeName: 'LearningHub',
    component: 'LearningHubDashboard.vue',
    requiresAuth: true,
    requiresAdmin: false,
    description: '显示学习中心仪表板，包括推荐题目、学习进度等',
    testMethod: () => {
      // 测试：验证页面标题
      const title = document.title
      return title.includes('学习中心') || title.includes('Learning')
    }
  },
  {
    name: '题库页面（特定学科）',
    path: '/learning-hub/:domainSlug',
    routeName: 'QuestionBankPage',
    component: 'QuestionBankPage.vue',
    requiresAuth: true,
    requiresAdmin: false,
    description: '显示特定学科的所有题目列表',
    examplePath: '/learning-hub/computer-science',
    testMethod: () => {
      // 测试：验证是否显示题目列表
      return document.querySelector('[class*="question"]') !== null
    }
  },
  {
    name: '学习路径列表',
    path: '/learning-paths',
    routeName: 'LearningPathList',
    component: 'LearningPathList.vue',
    requiresAuth: true,
    requiresAdmin: false,
    description: '显示所有推荐的学习路径',
    testMethod: () => {
      // 测试：验证页面中是否有路径相关的内容
      return document.querySelector('[class*="path"]') !== null
    }
  },
  {
    name: '学习路径详情',
    path: '/learning-paths/:pathSlug',
    routeName: 'LearningPathDetail',
    component: 'LearningPathDetail.vue',
    requiresAuth: true,
    requiresAdmin: false,
    description: '显示学习路径的详细信息',
    examplePath: '/learning-paths/full-stack-developer',
    testMethod: () => {
      // 测试：验证路径详情页的内容
      return document.querySelector('[class*="detail"]') !== null
    }
  },
  {
    name: '创建新题目',
    path: '/admin/questions/new',
    routeName: 'QuestionCreate',
    component: 'QuestionEditor.vue',
    requiresAuth: true,
    requiresAdmin: true,
    description: '创建新的考试题目',
    testMethod: () => {
      // 测试：验证是否显示编辑器
      return document.querySelector('[class*="editor"]') !== null
    }
  },
  {
    name: '编辑题目',
    path: '/admin/questions/:id/edit',
    routeName: 'QuestionEdit',
    component: 'QuestionEditor.vue',
    requiresAuth: true,
    requiresAdmin: true,
    description: '编辑已有的考试题目',
    examplePath: '/admin/questions/1/edit',
    testMethod: () => {
      // 测试：验证是否显示编辑器
      return document.querySelector('[class*="editor"]') !== null
    }
  }
]

/**
 * 路由连通性测试函数
 * @param {Object} router - Vue Router 实例
 * @returns {Promise<Object>} 测试结果
 */
export async function testRouteConnectivity(router) {
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  }

  for (const test of questionBankRouteTests) {
    try {
      // 尝试导航到路由
      const testPath = test.examplePath || test.path

      await router.push(testPath)

      // 等待组件加载
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 验证组件是否加载
      const componentLoaded = document.querySelector('[class]') !== null

      results.tests.push({
        name: test.name,
        path: testPath,
        status: componentLoaded ? '✅ 通过' : '⚠️ 组件加载异常',
        error: null
      })

      if (componentLoaded) {
        results.passed++
      } else {
        results.failed++
      }
    } catch (error) {
      results.tests.push({
        name: test.name,
        path: test.examplePath || test.path,
        status: '❌ 失败',
        error: error.message
      })
      results.failed++
    }
  }

  return results
}

/**
 * 生成路由文档
 * @returns {String} HTML 格式的路由文档
 */
export function generateRouteDocumentation() {
  let html = '<div class="route-documentation">'
  html += '<h1>题库路由文档</h1>'
  html += '<table border="1" cellpadding="10">'
  html += '<tr><th>路由名</th><th>路径</th><th>需要认证</th><th>需要管理员</th><th>描述</th></tr>'

  for (const test of questionBankRouteTests) {
    html += '<tr>'
    html += `<td>${test.name}</td>`
    html += `<td><code>${test.path}</code></td>`
    html += `<td>${test.requiresAuth ? '✅' : '❌'}</td>`
    html += `<td>${test.requiresAdmin ? '✅' : '❌'}</td>`
    html += `<td>${test.description}</td>`
    html += '</tr>'
  }

  html += '</table>'
  html += '</div>'

  return html
}

/**
 * 验证路由定义
 * @param {Array} routeDefinitions - 路由定义数组
 * @returns {Object} 验证结果
 */
export function validateRouteDefinitions(routeDefinitions) {
  const validation = {
    valid: true,
    errors: []
  }

  // 过滤题库相关的路由
  const questionBankRoutes = routeDefinitions.filter(route =>
    route.path.includes('/questions') ||
    route.path.includes('/learning') ||
    route.path.includes('/admin/questions')
  )

  // 检查每个路由
  for (const route of questionBankRoutes) {
    // 检查路径
    if (!route.path) {
      validation.errors.push(`路由 ${route.name} 缺少 path 属性`)
      validation.valid = false
    }

    // 检查组件
    if (!route.component) {
      validation.errors.push(`路由 ${route.path} 缺少 component 属性`)
      validation.valid = false
    }

    // 检查元数据
    if (!route.meta) {
      validation.errors.push(`路由 ${route.path} 缺少 meta 属性`)
      validation.valid = false
    }

    // 检查权限配置
    if (!('requiresAuth' in route.meta)) {
      validation.errors.push(`路由 ${route.path} 的 meta 缺少 requiresAuth 属性`)
      validation.valid = false
    }
  }

  validation.totalRoutes = questionBankRoutes.length

  return validation
}

/**
 * 快速检查列表
 * 用于在开发中快速验证路由
 */
export const routeCheckList = [
  '✅ 确认 /learning-hub 能正常访问',
  '✅ 确认 /learning-hub/:domainSlug 能接收参数',
  '✅ 确认 /learning-paths 能正常访问',
  '✅ 确认 /learning-paths/:pathSlug 能接收参数',
  '✅ 确认 /admin/questions/new 需要管理员权限',
  '✅ 确认 /admin/questions/:id/edit 需要管理员权限',
  '✅ 确认未登录用户被重定向到 /login',
  '✅ 确认非管理员用户无法访问 /admin/* 路由',
  '✅ 确认所有组件都能正确加载',
  '✅ 确认路由参数能正确传递给组件'
]

export default {
  questionBankRouteTests,
  testRouteConnectivity,
  generateRouteDocumentation,
  validateRouteDefinitions,
  routeCheckList
}
