#!/usr/bin/env node

/**
 * Dify工作流自动更新助手
 *
 * 此脚本帮助您快速更新三个Dify工作流中的存储API配置
 *
 * 注意: Dify API不支持直接修改工作流代码，因此此脚本提供：
 * 1. 需要复制的代码块
 * 2. 详细的步骤说明
 * 3. 验证更新的测试脚本
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ============================================================================
// 配置
// ============================================================================

const NGROK_URL = 'https://phrenologic-preprandial-jesica.ngrok-free.dev';
const API_KEY = 'ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0';

const DIFY_WORKFLOWS = {
  workflow1: {
    name: '工作流1 - 生成问题',
    id: '560EB9DDSwOFc8As',
    apiKey: 'app-hHvF3glxCRhtfkyX7Pg9i9kb',
    nodeId: 'python-save-questions',
    nodeName: '保存问题列表'
  },
  workflow2: {
    name: '工作流2 - 生成答案',
    id: '5X6RBtTFMCZr0r4R',
    apiKey: 'app-TEw1j6rBUw0ZHHlTdJvJFfPB',
    nodeId: 'python-save-answer',
    nodeName: '保存标准答案'
  },
  workflow3: {
    name: '工作流3 - 评分',
    id: '7C4guOpDk2GfmIFy',
    apiKey: 'app-Omq7PcI6P5g1CfyDnT8CNiua',
    nodeId: 'python-score-answer',
    nodeName: '评分'
  }
};

// ============================================================================
// 颜色输出
// ============================================================================

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// ============================================================================
// 代码模板
// ============================================================================

const WORKFLOW1_CODE = `import requests
import json
import uuid
from datetime import datetime

# ============ 配置 ============
STORAGE_API_URL = "${NGROK_URL}/api/sessions"
API_KEY = "${API_KEY}"

# ============ 生成会话ID ============
session_id = f"{uuid.uuid4().hex[:12]}-{int(datetime.now().timestamp())}"

# ============ 构建问题列表 ============
questions = []
# 假设 question_items 来自Dify的前面节点
if isinstance(generated_questions, list):
    for i, q in enumerate(generated_questions):
        questions.append({
            "id": f"{session_id}-q{i+1}",
            "question": q if isinstance(q, str) else q.get("content", q.get("question", str(q))),
            "hasAnswer": False,
            "answer": None
        })
elif isinstance(generated_questions, str):
    try:
        questions_data = json.loads(generated_questions)
        for i, q in enumerate(questions_data):
            questions.append({
                "id": f"{session_id}-q{i+1}",
                "question": q if isinstance(q, str) else q.get("content", q.get("question", str(q))),
                "hasAnswer": False,
                "answer": None
            })
    except:
        pass

# ============ 构建会话数据 ============
session_data = {
    "sessionId": session_id,
    "jobTitle": job_title,
    "questions": questions,
    "status": "questions_generated"
}

# ============ 发送请求 ============
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

try:
    response = requests.post(
        STORAGE_API_URL,
        json=session_data,
        headers=headers,
        timeout=10,
        verify=False  # ngrok自签名证书
    )
    response.raise_for_status()

    result = response.json()

    # ============ 返回结果 ============
    return {
        "session_id": session_id,
        "questions": json.dumps(questions),
        "job_title": job_title,
        "question_count": len(questions),
        "api_response": result,
        "success": True
    }
except Exception as e:
    return {
        "session_id": "",
        "questions": "[]",
        "job_title": job_title,
        "question_count": 0,
        "error": str(e),
        "success": False
    }`;

const WORKFLOW2_CODE = `import requests
import json

# ============ 配置 ============
STORAGE_API_URL = "${NGROK_URL}/api/sessions"
API_KEY = "${API_KEY}"

# ============ 获取会话和问题 ============
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

try:
    # 获取会话
    response = requests.get(
        f"{STORAGE_API_URL}/{session_id}",
        headers=headers,
        timeout=10,
        verify=False  # ngrok自签名证书
    )
    response.raise_for_status()
    session = response.json()

    # 找到对应的问题
    question = next(
        (q for q in session.get("questions", []) if q["id"] == question_id),
        None
    )

    if not question:
        return {
            "save_status": "失败",
            "error": "问题未找到",
            "success": False
        }

    # ============ 更新问题的答案 ============
    question["answer"] = generated_answer
    question["hasAnswer"] = True

    # ============ 保存到存储API ============
    update_response = requests.post(
        STORAGE_API_URL,
        json=session,
        headers=headers,
        timeout=10,
        verify=False
    )
    update_response.raise_for_status()

    return {
        "save_status": "成功",
        "generated_answer": generated_answer,
        "success": True
    }

except Exception as e:
    return {
        "save_status": "失败",
        "error": str(e),
        "success": False
    }`;

const WORKFLOW3_CODE = `import requests
import json

# ============ 配置 ============
STORAGE_API_URL = "${NGROK_URL}/api/sessions"
API_KEY = "${API_KEY}"

# ============ 获取会话和问题 ============
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

try:
    # 获取会话
    response = requests.get(
        f"{STORAGE_API_URL}/{session_id}",
        headers=headers,
        timeout=10,
        verify=False  # ngrok自签名证书
    )
    response.raise_for_status()
    session = response.json()

    # 找到对应的问题
    question = next(
        (q for q in session.get("questions", []) if q["id"] == question_id),
        None
    )

    if not question:
        return {
            "overall_score": 0,
            "comprehensive_evaluation": "问题未找到",
            "success": False
        }

    standard_answer = question.get("answer", "")

    # ============ 评分逻辑 (由Dify AI模型处理) ============
    # 这部分应该由Dify的AI评分节点处理
    # 这里只是格式化返回结果

    return {
        "overall_score": overall_score,
        "comprehensive_evaluation": comprehensive_evaluation,
        "success": True
    }

except Exception as e:
    return {
        "overall_score": 0,
        "comprehensive_evaluation": f"错误: {str(e)}",
        "success": False
    }`;

// ============================================================================
// 主函数
// ============================================================================

async function main() {
  log('\n╔════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║        Dify工作流自动更新助手                                  ║', 'cyan');
  log('║                                                                ║', 'cyan');
  log('║  此工具帮助您快速更新三个Dify工作流中的存储API配置              ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════════╝\n', 'cyan');

  log('📋 ngrok隧道配置信息\n', 'bright');
  log(`   ngrok URL: ${NGROK_URL}`, 'green');
  log(`   API密钥: ${API_KEY.substring(0, 16)}...`, 'green');
  log(`   存储API端点: ${NGROK_URL}/api/sessions\n`, 'green');

  // ========================================
  // 步骤1: 生成更新指南
  // ========================================
  log('=' .repeat(64), 'blue');
  log('  📝 步骤1: 生成更新指南', 'blue');
  log('=' .repeat(64) + '\n', 'blue');

  generateUpdateGuide();

  // ========================================
  // 步骤2: 生成代码文件
  // ========================================
  log('\n' + '=' .repeat(64), 'blue');
  log('  💾 步骤2: 保存代码到文件', 'blue');
  log('=' .repeat(64) + '\n', 'blue');

  saveCodeFiles();

  // ========================================
  // 步骤3: 显示总结
  // ========================================
  log('\n' + '=' .repeat(64), 'green');
  log('  ✅ 完成！', 'green');
  log('=' .repeat(64) + '\n', 'green');

  log('📋 下一步：\n', 'bright');
  log('1️⃣  访问 https://cloud.dify.ai', 'yellow');
  log('2️⃣  对于每个工作流：\n', 'yellow');
  log('   a) 打开工作流编辑器', 'cyan');
  log('   b) 找到对应的Python节点', 'cyan');
  log('   c) 复制代码文件中的代码', 'cyan');
  log('   d) 粘贴到Dify中', 'cyan');
  log('   e) 点击保存并发布工作流\n', 'cyan');
  log('3️⃣  运行测试验证：', 'yellow');
  log('   node test-workflows-complete.js\n', 'cyan');

  log('📁 代码文件位置：\n', 'bright');
  log('   - dify-workflow1-code.py (工作流1 - 生成问题)', 'yellow');
  log('   - dify-workflow2-code.py (工作流2 - 生成答案)', 'yellow');
  log('   - dify-workflow3-code.py (工作流3 - 评分)', 'yellow');
  log('   - DIFY_UPDATE_GUIDE.md (详细图文指南)\n', 'yellow');
}

function generateUpdateGuide() {
  const guide = `# Dify工作流更新指南

## 🎯 目标
将三个Dify工作流中的存储API URL更新为新的ngrok隧道地址

## ⚙️ 配置信息

\`\`\`
ngrok隧道URL: ${NGROK_URL}
存储API密钥: ${API_KEY}
\`\`\`

## 📋 工作流1 - 生成问题 (Python节点: 保存问题列表)

### 位置
https://cloud.dify.ai → 选择"工作流1" → 编辑模式 → 找到"保存问题列表" Python节点

### 操作步骤
1. 打开Python节点编辑框
2. 清空现有代码
3. 复制 \`dify-workflow1-code.py\` 中的全部代码
4. 粘贴到Python节点
5. 保存并发布工作流

### 关键配置
\`\`\`python
STORAGE_API_URL = "${NGROK_URL}/api/sessions"
API_KEY = "${API_KEY}"
\`\`\`

---

## 📋 工作流2 - 生成答案 (Python节点: 保存标准答案)

### 位置
https://cloud.dify.ai → 选择"工作流2" → 编辑模式 → 找到"保存标准答案" Python节点

### 操作步骤
1. 打开Python节点编辑框
2. 清空现有代码
3. 复制 \`dify-workflow2-code.py\` 中的全部代码
4. 粘贴到Python节点
5. 保存并发布工作流

### 关键配置
同工作流1（使用相同的ngrok URL和API密钥）

---

## 📋 工作流3 - 评分 (Python节点: 评分)

### 位置
https://cloud.dify.ai → 选择"工作流3" → 编辑模式 → 找到"评分" Python节点

### 操作步骤
1. 打开Python节点编辑框
2. 清空现有代码
3. 复制 \`dify-workflow3-code.py\` 中的全部代码
4. 粘贴到Python节点
5. 保存并发布工作流

### 关键配置
同工作流1（使用相同的ngrok URL和API密钥）

---

## ✅ 验证更新

更新完成后，运行以下命令验证所有工作流都能正常工作：

\`\`\`bash
node test-workflows-complete.js
\`\`\`

### 预期输出
\`\`\`
✅ 工作流1: 成功生成 N 个问题
✅ 工作流2: 成功生成标准答案
✅ 工作流3: 成功评分 XX/100
✅ 存储服务: 数据正确保存和读取
\`\`\`

---

## 🔧 故障排除

### 问题1: SSL证书错误
**原因**: ngrok使用自签名证书

**解决**: Python代码中已包含 \`verify=False\` 参数

### 问题2: 存储API返回404
**原因**: ngrok隧道地址错误或隧道已断开

**检查**:
\`\`\`bash
curl http://localhost:4040/api/tunnels
\`\`\`

### 问题3: API密钥认证失败
**原因**: API密钥不匹配

**检查**: 确保使用的密钥是 \`${API_KEY}\`

---

## 📞 技术细节

### 工作流1的输出格式
\`\`\`json
{
  "session_id": "abc123def456-1729000000",
  "questions": "[{\\"id\\":\\"..\\",\\"question\\":\\"...\\"}]",
  "job_title": "Python后端开发工程师",
  "question_count": 5,
  "success": true
}
\`\`\`

### 工作流2的输出格式
\`\`\`json
{
  "save_status": "成功",
  "generated_answer": "长答案文本...",
  "success": true
}
\`\`\`

### 工作流3的输出格式
\`\`\`json
{
  "overall_score": 75,
  "comprehensive_evaluation": "评价文本...",
  "success": true
}
\`\`\`

---

**更新时间**: ${new Date().toISOString()}
`;

  fs.writeFileSync(
    path.join(process.cwd(), 'DIFY_UPDATE_GUIDE.md'),
    guide
  );

  log('✅ 已生成 DIFY_UPDATE_GUIDE.md', 'green');
}

function saveCodeFiles() {
  const files = {
    'dify-workflow1-code.py': WORKFLOW1_CODE,
    'dify-workflow2-code.py': WORKFLOW2_CODE,
    'dify-workflow3-code.py': WORKFLOW3_CODE
  };

  for (const [filename, code] of Object.entries(files)) {
    fs.writeFileSync(
      path.join(process.cwd(), filename),
      code
    );
    log(`✅ 已保存 ${filename}`, 'green');
  }
}

// 运行主函数
main().catch(error => {
  log(`\n❌ 错误: ${error.message}`, 'red');
  process.exit(1);
});
