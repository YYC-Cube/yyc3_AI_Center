/**
 * API集成测试套件 - 全面测试所有API服务的功能和性能
 */

interface TestResult {
  service: string
  endpoint: string
  status: "success" | "failure" | "warning"
  responseTime: number
  statusCode: number
  message: string
  details?: any
}

interface TestSuite {
  name: string
  description: string
  tests: TestResult[]
  summary: {
    total: number
    passed: number
    failed: number
    warnings: number
    averageResponseTime: number
  }
}

class APIIntegrationTester {
  private baseUrl: string
  private results: TestResult[] = []

  constructor(baseUrl = "http://localhost:3000") {
    this.baseUrl = baseUrl
  }

  // 执行单个API测试
  async testAPI(
    service: string,
    endpoint: string,
    method = "POST",
    payload?: any,
    expectedStatus = 200,
  ): Promise<TestResult> {
    const startTime = Date.now()

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: payload ? JSON.stringify(payload) : undefined,
      })

      const responseTime = Date.now() - startTime
      const data = await response.json()

      let status: "success" | "failure" | "warning" = "success"
      let message = "测试通过"

      // 检查状态码
      if (response.status !== expectedStatus) {
        status = "failure"
        message = `状态码不匹配: 期望 ${expectedStatus}, 实际 ${response.status}`
      }

      // 检查响应时间
      if (responseTime > 5000) {
        status = status === "failure" ? "failure" : "warning"
        message += ` (响应时间过长: ${responseTime}ms)`
      }

      // 检查响应数据
      if (!data || (data.error && response.status === 200)) {
        status = "failure"
        message = `响应数据异常: ${data?.error || "无数据"}`
      }

      const result: TestResult = {
        service,
        endpoint,
        status,
        responseTime,
        statusCode: response.status,
        message,
        details: data,
      }

      this.results.push(result)
      return result
    } catch (error) {
      const responseTime = Date.now() - startTime
      const result: TestResult = {
        service,
        endpoint,
        status: "failure",
        responseTime,
        statusCode: 0,
        message: `网络错误: ${error instanceof Error ? error.message : String(error)}`,
      }

      this.results.push(result)
      return result
    }
  }

  // 测试所有核心API服务
  async runFullTestSuite(): Promise<TestSuite> {
    console.log("🚀 开始执行API集成测试...")

    const tests: TestResult[] = []

    // 测试天气API
    console.log("🌤️ 测试天气API...")
    tests.push(await this.testAPI("weather", "/api/weather", "POST", { city: "北京" }))
    tests.push(await this.testAPI("weather", "/api/weather", "POST", { city: "Shanghai" }))
    tests.push(await this.testAPI("weather", "/api/weather", "POST", { city: "" }, 400)) // 测试验证错误

    // 测试新闻API
    console.log("📰 测试新闻API...")
    tests.push(await this.testAPI("news", "/api/news", "POST", { category: "technology" }))
    tests.push(await this.testAPI("news", "/api/news", "POST", { category: "business" }))

    // 测试IP信息API
    console.log("🌐 测试IP信息API...")
    tests.push(await this.testAPI("ipinfo", "/api/ipinfo", "POST", { ip: "8.8.8.8" }))
    tests.push(await this.testAPI("ipinfo", "/api/ipinfo", "POST", { ip: "1.1.1.1" }))

    // 测试汇率API
    console.log("💱 测试汇率API...")
    tests.push(await this.testAPI("currency", "/api/currency", "POST", { from: "USD", to: "CNY" }))
    tests.push(await this.testAPI("currency", "/api/currency", "POST", { from: "EUR", to: "USD" }))

    // 测试股票API
    console.log("📈 测试股票API...")
    tests.push(await this.testAPI("stock", "/api/stock", "POST", { symbol: "AAPL" }))
    tests.push(await this.testAPI("stock", "/api/stock", "POST", { symbol: "GOOGL" }))

    // 测试地理编码API
    console.log("🗺️ 测试地理编码API...")
    tests.push(await this.testAPI("geocode", "/api/geocode", "POST", { address: "北京市天安门广场" }))
    tests.push(await this.testAPI("geocode", "/api/geocode", "POST", { address: "上海市外滩" }))

    // 测试翻译API
    console.log("🌍 测试翻译API...")
    tests.push(await this.testAPI("translate", "/api/translate", "POST", { text: "Hello World", to: "zh" }))
    tests.push(await this.testAPI("translate", "/api/translate", "POST", { text: "你好世界", to: "en" }))

    // 测试二维码API
    console.log("📱 测试二维码API...")
    tests.push(await this.testAPI("qrcode", "/api/qrcode", "POST", { text: "https://example.com" }))
    tests.push(await this.testAPI("qrcode", "/api/qrcode", "POST", { text: "测试二维码", format: "svg" }))

    // 测试监控API
    console.log("📊 测试监控API...")
    tests.push(await this.testAPI("monitor", "/api/monitor", "GET"))

    // 测试缓存API
    console.log("🗄️ 测试缓存API...")
    tests.push(await this.testAPI("cache", "/api/cache/stats", "GET"))

    // 计算测试摘要
    const total = tests.length
    const passed = tests.filter((t) => t.status === "success").length
    const failed = tests.filter((t) => t.status === "failure").length
    const warnings = tests.filter((t) => t.status === "warning").length
    const averageResponseTime = tests.reduce((sum, t) => sum + t.responseTime, 0) / total

    const summary = {
      total,
      passed,
      failed,
      warnings,
      averageResponseTime,
    }

    console.log("✅ API集成测试完成!")
    console.log(`📊 测试结果: ${passed}/${total} 通过, ${failed} 失败, ${warnings} 警告`)
    console.log(`⏱️ 平均响应时间: ${averageResponseTime.toFixed(2)}ms`)

    return {
      name: "API集成测试",
      description: "全面测试所有API服务的功能和性能",
      tests,
      summary,
    }
  }

  // 性能压力测试
  async runPerformanceTest(concurrency = 10, duration = 30000): Promise<any> {
    console.log(`🔥 开始性能压力测试 (并发: ${concurrency}, 持续: ${duration}ms)...`)

    const startTime = Date.now()
    const results: any[] = []
    const promises: Promise<any>[] = []

    // 创建并发请求
    for (let i = 0; i < concurrency; i++) {
      const promise = this.runConcurrentRequests(startTime + duration)
      promises.push(promise)
    }

    // 等待所有并发测试完成
    const concurrentResults = await Promise.all(promises)

    // 合并结果
    concurrentResults.forEach((result) => {
      results.push(...result)
    })

    // 分析性能数据
    const totalRequests = results.length
    const successfulRequests = results.filter((r) => r.success).length
    const failedRequests = totalRequests - successfulRequests
    const averageResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / totalRequests
    const maxResponseTime = Math.max(...results.map((r) => r.responseTime))
    const minResponseTime = Math.min(...results.map((r) => r.responseTime))

    // 计算百分位数
    const sortedTimes = results.map((r) => r.responseTime).sort((a, b) => a - b)
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)]
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)]

    const performanceReport = {
      duration: duration,
      concurrency: concurrency,
      totalRequests,
      successfulRequests,
      failedRequests,
      successRate: (successfulRequests / totalRequests) * 100,
      averageResponseTime,
      minResponseTime,
      maxResponseTime,
      p95ResponseTime: p95,
      p99ResponseTime: p99,
      requestsPerSecond: (totalRequests / duration) * 1000,
    }

    console.log("🏁 性能压力测试完成!")
    console.log(`📊 总请求数: ${totalRequests}`)
    console.log(`✅ 成功率: ${performanceReport.successRate.toFixed(2)}%`)
    console.log(`⏱️ 平均响应时间: ${averageResponseTime.toFixed(2)}ms`)
    console.log(`🚀 QPS: ${performanceReport.requestsPerSecond.toFixed(2)}`)

    return performanceReport
  }

  // 并发请求执行器
  private async runConcurrentRequests(endTime: number): Promise<any[]> {
    const results: any[] = []
    const apis = [
      { endpoint: "/api/weather", payload: { city: "北京" } },
      { endpoint: "/api/news", payload: { category: "technology" } },
      { endpoint: "/api/ipinfo", payload: { ip: "8.8.8.8" } },
      { endpoint: "/api/currency", payload: { from: "USD", to: "CNY" } },
    ]

    while (Date.now() < endTime) {
      const api = apis[Math.floor(Math.random() * apis.length)]
      const startTime = Date.now()

      try {
        const response = await fetch(`${this.baseUrl}${api.endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(api.payload),
        })

        const responseTime = Date.now() - startTime
        results.push({
          endpoint: api.endpoint,
          success: response.ok,
          responseTime,
          statusCode: response.status,
        })
      } catch (error) {
        const responseTime = Date.now() - startTime
        results.push({
          endpoint: api.endpoint,
          success: false,
          responseTime,
          statusCode: 0,
          error: error instanceof Error ? error.message : String(error),
        })
      }

      // 短暂延迟避免过度压力
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    return results
  }

  // 获取测试结果
  getResults(): TestResult[] {
    return this.results
  }

  // 清除测试结果
  clearResults(): void {
    this.results = []
  }
}

// 执行测试
async function runTests() {
  const tester = new APIIntegrationTester()

  try {
    // 执行功能测试
    const functionalResults = await tester.runFullTestSuite()

    // 执行性能测试
    const performanceResults = await tester.runPerformanceTest(5, 15000)

    // 生成测试报告
    const report = {
      timestamp: new Date().toISOString(),
      functional: functionalResults,
      performance: performanceResults,
      recommendations: generateRecommendations(functionalResults, performanceResults),
    }

    console.log("\n📋 测试报告生成完成!")
    console.log(JSON.stringify(report, null, 2))

    return report
  } catch (error) {
    console.error("❌ 测试执行失败:", error)
    throw error
  }
}

// 生成优化建议
function generateRecommendations(functional: TestSuite, performance: any): string[] {
  const recommendations: string[] = []

  // 基于功能测试的建议
  if (functional.summary.failed > 0) {
    recommendations.push(`有${functional.summary.failed}个API测试失败，需要检查服务配置和错误处理`)
  }

  if (functional.summary.averageResponseTime > 2000) {
    recommendations.push(`平均响应时间${functional.summary.averageResponseTime.toFixed(2)}ms过长，建议优化性能`)
  }

  // 基于性能测试的建议
  if (performance.successRate < 95) {
    recommendations.push(`成功率${performance.successRate.toFixed(2)}%偏低，建议增强错误处理和重试机制`)
  }

  if (performance.p95ResponseTime > 3000) {
    recommendations.push(`P95响应时间${performance.p95ResponseTime}ms过长，建议优化慢查询和缓存策略`)
  }

  if (performance.requestsPerSecond < 10) {
    recommendations.push(`QPS ${performance.requestsPerSecond.toFixed(2)}偏低，建议优化并发处理能力`)
  }

  // 如果没有问题，给出积极反馈
  if (recommendations.length === 0) {
    recommendations.push("所有测试均通过，系统运行状态良好")
    recommendations.push("建议继续监控系统性能，定期执行测试")
  }

  return recommendations
}

// 执行测试
runTests().catch(console.error)
