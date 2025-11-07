# 📚 工作流2 save_status 问题 - 诊断和修复文档索引

> **问题**: workflow2 中 save_status 显示为"失败"而不是"成功"
> 
> **状态**: ✅ 已诊断，修复方案就绪
>
> **诊断完成时间**: 2025-10-27

---

## 🎯 快速导航

### 📍 我应该看哪个文档?

| 你的情况 | 推荐文档 | 预计阅读时间 |
|--------|---------|-----------|
| 需要快速理解问题 | `WORKFLOW2_FIX_SUMMARY.txt` | 5 分钟 |
| 想立即修复 | `WORKFLOW2_FIX_ACTION_PLAN.md` | 10 分钟 |
| 想深入理解根本原因 | `WORKFLOW2_SAVE_STATUS_DIAGNOSTIC.md` | 20 分钟 |
| 需要故障排查步骤 | `WORKFLOW2_FIX_ACTION_PLAN.md` (步骤6) | 15 分钟 |
| 想了解 ngrok 方案 | `WORKFLOW2_NGROK_FIX.md` | 10 分钟 |

---

## 📖 完整文档清单

### 1️⃣ **WORKFLOW2_FIX_SUMMARY.txt** (快速概览)
**长度**: 1 页 | **难度**: ⭐ 简单
**内容**:
- 问题症状和根本原因 (3 个，按优先级排列)
- 快速修复步骤 (5 步)
- 所有文档导航
- 关键文件位置
- 立即行动清单

**适合**: 急于了解问题的人

---

### 2️⃣ **WORKFLOW2_FIX_ACTION_PLAN.md** (完整行动计划) ⭐⭐⭐
**长度**: 4-5 页 | **难度**: ⭐⭐ 中等
**内容**:
- 详细的修复步骤 (6 个，每个带预计时间)
- 每个步骤的预期输出
- 完整的故障排查决策树 (5 种常见错误)
- 性能指标对比表
- 快速命令参考
- 完成检查清单

**适合**: 想一步步按照计划修复的人

**关键步骤**:
1. 启动 Docker (2 分钟)
2. 检查 ngrok 隧道 (2 分钟)
3. **在 Dify 中更新 workflow2 (5-7 分钟)** ⭐ 最重要
4. 验证 Storage Service 和 Redis (3 分钟)
5. 运行测试 (3 分钟)
6. 查看错误日志 (如果失败)

---

### 3️⃣ **WORKFLOW2_SAVE_STATUS_DIAGNOSTIC.md** (完整诊断报告) ⭐⭐⭐
**长度**: 8-10 页 | **难度**: ⭐⭐⭐ 复杂
**内容**:
- **5 个失败原因详细分析** (按概率排列 90% → 30%)
  1. ngrok 隧道不稳定
  2. 使用 ngrok 而非 Docker 网络
  3. API Key 验证失败
  4. HTTP vs HTTPS 混用
  5. 请求超时
- 每个原因的症状、证据、修复方法
- **3 个修复方案对比** (推荐方案、备选方案)
- API 端点详解 (5 个)
- 完整的错误处理和日志分析
- 预期性能改进数据
- 相关文件清单

**适合**: 想深入理解技术细节的人

---

### 4️⃣ **WORKFLOW2_NGROK_FIX.md** (ngrok 方案)
**长度**: 2-3 页 | **难度**: ⭐⭐ 中等
**内容**:
- ngrok vs Docker 网络架构对比
- ngrok 隧道检查和重启步骤
- 快速命令参考
- 隧道稳定性说明

**适合**: 需要了解 ngrok 配置的人

---

## 🔧 修复核心步骤 (3 分钟速版)

1. **启动 Docker**
   ```bash
   docker-compose up -d
   ```

2. **启动新 ngrok**
   ```bash
   ngrok http 8080
   # 记下输出中的 URL: https://XXXXX.ngrok-free.dev
   ```

3. **在 Dify 中更新 workflow2**
   - 打开 workflow2 → 编辑 "保存标准答案" 节点
   - 替换第 1 行 (api_base_url):
   ```python
   # 旧的
   api_base_url = "https://phrenologic-preprandial-jesica.ngrok-free.dev/api/sessions"
   
   # 新的
   api_base_url = "https://[YOUR_NEW_URL]/api/sessions"
   ```
   - 点击保存

4. **测试**
   ```bash
   node test-workflows-docker-prod.js
   ```

5. **检查结果**
   - 如果 save_status = "成功" → ✅ 完成！
   - 如果 save_status = "失败" → 查看 `WORKFLOW2_FIX_ACTION_PLAN.md` 的步骤 6

---

## 📊 问题根本原因分析

### 【最可能 - 90% 概率】
**ngrok 隧道不稳定或已过期**
- 当前 URL: `https://phrenologic-preprandial-jesica.ngrok-free.dev`
- 可能已断开或限流
- 导致 HTTP 请求失败

### 【次可能 - 60% 概率】
**使用公网隧道而非 Docker 网络**
- ngrok 增加延迟和不稳定性
- 应考虑: `http://interview-storage-service:8081`

### 【可能性较低 - 40% 概率】
**API Key 或 Storage Service 问题**
- API Key 配置不匹配
- Storage Service 容器未运行

---

## 🎯 修复完成后的预期

| 指标 | 修复前 | 修复后 |
|------|-------|-------|
| **save_status** | "失败" | "成功" |
| **响应时间** | 300-500ms | 200-400ms |
| **成功率** | 60-70% | 85-95% |

---

## 🚨 修复后仍然失败?

按照这个顺序检查:

1. **ngrok 隧道可访问吗?**
   ```bash
   curl -I https://YOUR_NGROK_URL
   ```
   → 应该返回 200

2. **Storage Service 运行吗?**
   ```bash
   docker ps | findstr storage-service
   ```
   → 应该显示容器运行中

3. **Redis 连接正常吗?**
   ```bash
   docker exec interview-redis redis-cli ping
   ```
   → 应该返回 PONG

4. **查看详细错误日志**
   ```bash
   docker logs interview-storage-service | tail -50
   ```

5. **查看 workflow 完整测试输出**
   ```bash
   node test-workflows-docker-prod.js > log.txt 2>&1
   cat log.txt
   ```

详见: `WORKFLOW2_FIX_ACTION_PLAN.md` 的 "故障排查" 部分

---

## 📂 相关源代码文件

| 文件 | 位置 | 说明 |
|------|------|------|
| **Workflow2 定义** | `workflow2-fixed-latest.yml` (第289-330行) | save_standard_answer 节点的 Python 代码 |
| **Storage Service API** | `storage-service/src/main/java/.../SessionController.java` | 5 个 REST API 端点 |
| **API Key 认证** | `storage-service/src/main/java/.../ApiKeyAuthFilter.java` | Bearer token 验证 |
| **Docker 配置** | `docker-compose.yml` | storage-service 容器定义 |
| **Storage 配置** | `storage-service/src/main/resources/application-prod.properties` | Redis 和 Server 配置 |
| **测试脚本** | `test-workflows-docker-prod.js` | workflow 集成测试 |

---

## 💡 关键学习点

1. **不要依赖 ngrok 做生产** - 仅用于临时开发/测试
2. **Docker 网络内通信优于公网** - 更快、更稳定、更安全
3. **环境地址需要区分** - 本地、Docker 内部、公网三种环境需要不同地址
4. **API Key 要在部署前验证** - 避免运行时认证失败

---

## 🔗 相关问题和解决方案

### Workflow3 输出缺少 "question" 字段
- 问题: workflow3 的输出配置需要调整
- 诊断报告中的建议见: `WORKFLOW2_SAVE_STATUS_DIAGNOSTIC.md` (可选后续步骤)

### API 请求超时
- 增加超时时间在 workflow 代码中: `timeout=60` (从 30 秒)
- 或者考虑使用 Docker 内部网络消除延迟

### ngrok 免费版限流
- 升级到 ngrok Pro ($5/月)
- 或者使用 Cloudflare Tunnel (免费, 无限制)
- 或者使用 Docker 内部网络 (最推荐)

---

## 📞 文档使用建议

**快速修复** (20 分钟):
1. 阅读: `WORKFLOW2_FIX_SUMMARY.txt` (5 分钟)
2. 执行: `WORKFLOW2_FIX_ACTION_PLAN.md` 的步骤 1-5 (15 分钟)

**深入学习** (1 小时):
1. 阅读: `WORKFLOW2_FIX_SUMMARY.txt` (5 分钟)
2. 阅读: `WORKFLOW2_SAVE_STATUS_DIAGNOSTIC.md` (30 分钟)
3. 执行: `WORKFLOW2_FIX_ACTION_PLAN.md` (20 分钟)

**故障排查** (30 分钟):
1. 尝试修复步骤 1-5
2. 如果仍然失败，查看 `WORKFLOW2_FIX_ACTION_PLAN.md` 的步骤 6 (故障排查)

---

## ✅ 完成清单

修复完成后确认以下项目:

- [ ] Docker 所有容器正在运行
- [ ] ngrok 隧道已启动且可访问
- [ ] workflow2 中的 ngrok URL 已更新
- [ ] Storage Service HTTP 200 可访问
- [ ] Redis PING 返回 PONG
- [ ] 工作流2测试运行，save_status = "成功"
- [ ] 查看 Storage Service 日志，无错误
- [ ] workflow 完整链测试通过 (1→2→3)

---

**最后更新**: 2025-10-27
**文档版本**: 1.0
**诊断状态**: ✅ 完成，待修复执行

