/**
 * Cloudflare Tunnel 性能测试脚本
 * ================================
 *
 * 用途: 测试 Cloudflare Tunnel 的性能指标，包括延迟、吞吐量、成功率
 *
 * 使用方法:
 *   node test-cloudflare-tunnel-performance.js
 *
 * 配置:
 *   修改下面的 CLOUDFLARE_URL 为你的实际 Cloudflare Tunnel URL
 */

const https = require('https');
const http = require('http');

// ============ 配置 ============
const CLOUDFLARE_URL = 'https://storage-api.yourdomain.com/api/sessions';  // ⭐ 替换为你的 URL
const API_KEY = 'ak_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0';

// 测试参数
const TEST_COUNT = 100;      // 总测试次数
const CONCURRENT = 10;       // 并发请求数
const TIMEOUT = 10000;       // 请求超时 (ms)

// ============ 工具函数 ============

/**
 * 测量单个请求的延迟
 */
async function measureLatency(url, method = 'GET') {
    const start = Date.now();
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;

    return new Promise((resolve, reject) => {
        const req = protocol.request(url, {
            method,
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: TIMEOUT
        }, (res) => {
            const latency = Date.now() - start;
            let data = '';

            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    latency,
                    statusCode: res.statusCode,
                    success: res.statusCode >= 200 && res.statusCode < 300,
                    dataSize: Buffer.byteLength(data)
                });
            });
        });

        req.on('error', (err) => {
            reject({
                latency: Date.now() - start,
                error: err.message,
                success: false
            });
        });

        req.on('timeout', () => {
            req.abort();
            reject({
                latency: Date.now() - start,
                error: 'Request timeout',
                success: false
            });
        });

        req.end();
    });
}

/**
 * 格式化字节大小
 */
function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

/**
 * 计算统计数据
 */
function calculateStats(values) {
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: sum / sorted.length,
        median: sorted[Math.floor(sorted.length / 2)],
        p50: sorted[Math.floor(sorted.length * 0.50)],
        p75: sorted[Math.floor(sorted.length * 0.75)],
        p90: sorted[Math.floor(sorted.length * 0.90)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)]
    };
}

/**
 * 显示进度条
 */
function showProgress(current, total, width = 40) {
    const percentage = (current / total * 100).toFixed(1);
    const filled = Math.floor(current / total * width);
    const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
    process.stdout.write(`\r[${bar}] ${percentage}% (${current}/${total})`);
}

// ============ 主测试逻辑 ============

async function runPerformanceTest() {
    console.log('🚀 Cloudflare Tunnel 性能测试\n');
    console.log('═'.repeat(60));
    console.log(`📍 测试 URL: ${CLOUDFLARE_URL}`);
    console.log(`🔢 测试次数: ${TEST_COUNT}`);
    console.log(`⚡ 并发数: ${CONCURRENT}`);
    console.log(`⏱️  超时时间: ${TIMEOUT}ms`);
    console.log('═'.repeat(60));
    console.log();

    const results = [];
    const startTime = Date.now();

    // 分批并发测试
    for (let i = 0; i < TEST_COUNT; i += CONCURRENT) {
        const batch = [];
        const batchSize = Math.min(CONCURRENT, TEST_COUNT - i);

        for (let j = 0; j < batchSize; j++) {
            batch.push(measureLatency(CLOUDFLARE_URL));
        }

        const batchResults = await Promise.allSettled(batch);
        results.push(...batchResults);

        // 更新进度
        showProgress(Math.min(i + CONCURRENT, TEST_COUNT), TEST_COUNT);
    }

    const totalTime = Date.now() - startTime;
    console.log('\n');

    // ============ 结果分析 ============

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success));

    // 提取延迟数据
    const latencies = successful.map(r => r.value.latency);
    const stats = calculateStats(latencies);

    // 提取数据大小
    const dataSizes = successful.map(r => r.value.dataSize);
    const avgDataSize = dataSizes.reduce((a, b) => a + b, 0) / dataSizes.length;

    // ============ 输出报告 ============

    console.log('═'.repeat(60));
    console.log('📊 性能测试报告');
    console.log('═'.repeat(60));
    console.log();

    // 成功率
    console.log('✅ 成功率统计:');
    console.log(`   总请求数: ${TEST_COUNT}`);
    console.log(`   成功: ${successful.length} (${(successful.length / TEST_COUNT * 100).toFixed(2)}%)`);
    console.log(`   失败: ${failed.length} (${(failed.length / TEST_COUNT * 100).toFixed(2)}%)`);
    console.log();

    // 延迟统计
    if (stats) {
        console.log('⏱️  延迟统计:');
        console.log(`   最小延迟: ${stats.min.toFixed(2)} ms`);
        console.log(`   最大延迟: ${stats.max.toFixed(2)} ms`);
        console.log(`   平均延迟: ${stats.avg.toFixed(2)} ms`);
        console.log(`   中位数: ${stats.median.toFixed(2)} ms`);
        console.log();

        console.log('📈 百分位延迟:');
        console.log(`   P50: ${stats.p50.toFixed(2)} ms`);
        console.log(`   P75: ${stats.p75.toFixed(2)} ms`);
        console.log(`   P90: ${stats.p90.toFixed(2)} ms`);
        console.log(`   P95: ${stats.p95.toFixed(2)} ms`);
        console.log(`   P99: ${stats.p99.toFixed(2)} ms`);
        console.log();
    }

    // 吞吐量
    const throughput = TEST_COUNT / (totalTime / 1000);
    console.log('📊 吞吐量统计:');
    console.log(`   总耗时: ${(totalTime / 1000).toFixed(2)} 秒`);
    console.log(`   吞吐量: ${throughput.toFixed(2)} 请求/秒`);
    console.log(`   平均响应大小: ${formatBytes(avgDataSize)}`);
    console.log();

    // 与 ngrok 对比
    console.log('🔍 与 ngrok 对比:');
    console.log('   ngrok 平均延迟: ~200-300ms (参考值)');
    console.log(`   Cloudflare 平均延迟: ${stats ? stats.avg.toFixed(2) : 'N/A'}ms`);

    if (stats) {
        if (stats.avg < 200) {
            console.log('   ✅ Cloudflare Tunnel 更快! (快 ' + ((200 - stats.avg) / 200 * 100).toFixed(1) + '%)');
        } else if (stats.avg < 300) {
            console.log('   ⚖️  性能相当');
        } else {
            console.log('   ⚠️  Cloudflare Tunnel 较慢 (可能需要优化网络配置)');
        }
    }
    console.log();

    // 失败详情
    if (failed.length > 0) {
        console.log('❌ 失败请求详情 (前5个):');
        failed.slice(0, 5).forEach((f, i) => {
            const error = f.reason?.error || f.value?.error || '未知错误';
            const latency = f.reason?.latency || f.value?.latency || 0;
            console.log(`   ${i + 1}. ${error} (耗时: ${latency}ms)`);
        });
        console.log();
    }

    // 性能评级
    console.log('═'.repeat(60));
    console.log('🏆 性能评级:');
    console.log('═'.repeat(60));

    let rating = 'N/A';
    let ratingEmoji = '❓';

    if (stats && successful.length / TEST_COUNT >= 0.99) {
        if (stats.avg < 150) {
            rating = '优秀 (Excellent)';
            ratingEmoji = '🏆';
        } else if (stats.avg < 250) {
            rating = '良好 (Good)';
            ratingEmoji = '✅';
        } else if (stats.avg < 400) {
            rating = '一般 (Fair)';
            ratingEmoji = '⚖️';
        } else {
            rating = '需优化 (Needs Improvement)';
            ratingEmoji = '⚠️';
        }
    } else {
        rating = '不稳定 (Unstable)';
        ratingEmoji = '❌';
    }

    console.log(`${ratingEmoji} ${rating}`);
    console.log('═'.repeat(60));
    console.log();

    // 建议
    if (stats && stats.avg > 300) {
        console.log('💡 优化建议:');
        console.log('   1. 检查 Cloudflare Tunnel 配置中的 connectTimeout 设置');
        console.log('   2. 确保本地服务 (Docker) 运行正常');
        console.log('   3. 检查网络连接质量');
        console.log('   4. 考虑使用 Cloudflare Argo Smart Routing (付费功能)');
        console.log();
    }

    if (failed.length / TEST_COUNT > 0.01) {
        console.log('💡 稳定性建议:');
        console.log('   1. 检查 Cloudflare Tunnel 服务是否正常运行');
        console.log('   2. 增加重试机制 (在 Dify 工作流中配置)');
        console.log('   3. 查看 Cloudflare Tunnel 日志排查问题');
        console.log();
    }

    // 保存结果
    const report = {
        timestamp: new Date().toISOString(),
        url: CLOUDFLARE_URL,
        testConfig: { count: TEST_COUNT, concurrent: CONCURRENT, timeout: TIMEOUT },
        results: {
            successRate: successful.length / TEST_COUNT,
            totalRequests: TEST_COUNT,
            successful: successful.length,
            failed: failed.length
        },
        latency: stats,
        throughput: {
            requestsPerSecond: throughput,
            totalTime: totalTime
        },
        rating
    };

    const fs = require('fs');
    const reportPath = 'cloudflare-tunnel-performance-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 详细报告已保存至: ${reportPath}`);
}

// ============ 执行测试 ============

console.log('⚙️  初始化测试...\n');

// 验证 URL 配置
if (CLOUDFLARE_URL.includes('yourdomain.com')) {
    console.error('❌ 错误: 请先配置 CLOUDFLARE_URL 为你的实际 Cloudflare Tunnel URL');
    console.error('   编辑文件顶部的 CLOUDFLARE_URL 变量\n');
    process.exit(1);
}

runPerformanceTest().catch((err) => {
    console.error('\n❌ 测试失败:', err.message);
    process.exit(1);
});
