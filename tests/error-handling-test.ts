/**
 * 错误处理测试套件 - 测试各种错误场景的处理效果
 */

interface ErrorTestCase {
  name: string
  description: string
  endpoint: string
  payload: any
  expectedStatus: number
  expectedErrorType?: string
  shouldRetry?: boolean
}

class ErrorHandlingTester {
  private baseUrl: string

  constructor(baseUrl = "http://localhost:3000") {
    this.baseUrl = baseUrl
  }

  // 执行错误处理测试
  async runErrorHandlingTests(): Promise<any> {
    console.log("🧪 开始错误处理测试...")

    const testCases: ErrorTestCase[] = [
      // 验证错误测试
      {
        name: "缺少必需参数",
        description: "测试API参数验证",
        endpoint: "/api/weather",
        payload: {},
        expectedStatus: 400,
        expectedErrorType: "VALIDATION_ERROR",
      },
      {
        name: "无效城市名称",
        description: "测试业务逻辑验证",
        endpoint: "/api/weather",
        payload: { city: "" },
        expectedStatus: 400,
        expectedErrorType: "VALIDATION_ERROR",
      },
      {
        name: "无效IP地址",
        description: "测试IP格式验证",
        endpoint: "/api/ipinfo",
        payload: { ip: "invalid-ip" },
        expectedStatus: 400,
        expectedErrorType: "VALIDATION_ERROR",
      },
      {
        name: "无效货币代码",
        description: "测试货币代码验证",
        endpoint: "/api/currency",
        payload: { from: "INVALID", to: "CNY" },
        expectedStatus: 400,
        expectedErrorType: "VALIDATION_ERROR",
      },
      // 限流测试
      {
        name: "请求频率限制",
        description: "测试API限流机制",
        endpoint: "/api/weather",
        payload: { city: "北京" },
        expectedStatus: 429,
        expectedErrorType: "RATE_LIMIT_ERROR",
        shouldRetry: true,
      },
      // 服务降级测试
      {
        name: "服务降级响应",
        description: "测试服务降级机制",
        endpoint: "/api/weather",
        payload: { city: "测试降级" },
        expectedStatus: 200, // 降级时仍返回200，但数据标记为降级
      },
    ]

    const results = []

    for (const testCase of testCases) {
      console.log(`🔍 测试: ${testCase.name}`)

      try {
        const result = await this.executeErrorTest(testCase)
        results.push(result)
        console.log(`✅ ${testCase.name}: ${result.status}`)
      } catch (error) {
        console.error(`❌ ${testCase.name}: 测试执行失败`, error)
        results.push({
          testCase: testCase.name,
          status: "failed",
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    // 测试限流恢复
    await this.testRateLimitRecovery()

    // 测试错误日志记录
    await this.testErrorLogging()

    const summary = {
      total: results.length,
      passed: results.filter((r) => r.status === "passed").length,
      failed: results.filter((r) => r.status === "failed").length,
      warnings: results.filter((r) => r.status === "warning").length,
    }

    console.log("✅ 错误处理测试完成!")
    console.log(`📊 测试结果: ${summary.passed}/${summary.total} 通过`)

    return {
      timestamp: new Date().toISOString(),
      results,
      summary,
    }
  }

  // 执行单个错误测试
  private async executeErrorTest(testCase: ErrorTestCase): Promise<any> {
    const startTime = Date.now()

    const response = await fetch(`${this.baseUrl}${testCase.endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testCase.payload),
    })

    const responseTime = Date.now() - startTime
    const data = await response.json()

    let status = "passed"
    const issues = []

    // 检查状态码
    if (response.status !== testCase.expectedStatus) {
      status = "failed"
      issues.push(`状态码不匹配: 期望 ${testCase.expectedStatus}, 实际 ${response.status}`)
    }

    // 检查错误类型
    if (testCase.expectedErrorType && data.error?.type !== testCase.expectedErrorType) {
      status = "failed"
      issues.push(`错误类型不匹配: 期望 ${testCase.expectedErrorType}, 实际 ${data.error?.type}`)
    }

    // 检查错误消息是否用户友好
    if (data.error && (!data.error.message || data.error.message.length < 10)) {
      status = status === "failed" ? "failed" : "warning"
      issues.push("错误消息不够详细或用户友好")
    }

    // 检查是否提供解决建议
    if (data.error && !data.error.suggestion) {
      status = status === "failed" ? "failed" : "warning"
      issues.push("缺少解决建议")
    }

    // 检查重试信息
    if (testCase.shouldRetry && !data.error?.retryable) {
      status = status === "failed" ? "failed" : "warning"
      issues.push("应该标记为可重试但未标记")
    }

    return {
      testCase: testCase.name,
      status,
      responseTime,
      statusCode: response.status,
      issues,
      response: data,
    }
  }

  // 测试限流恢复
  private async testRateLimitRecovery(): Promise<void> {
    console.log("🔄 测试限流恢复机制...")

    // 快速发送多个请求触发限流
    const promises = []
    for (let i = 0; i < 10; i++) {
      promises.push(
        fetch(`${this.baseUrl}/api/weather`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ city: "北京" }),
        }),
      )
    }

    const responses = await Promise.all(promises)
    const rateLimited = responses.some((r) => r.status === 429)

    if (rateLimited) {
      console.log("✅ 限流机制正常工作")

      // 等待限流恢复
      console.log("⏳ 等待限流恢复...")
      await new Promise((resolve) => setTimeout(resolve, 5000))

      // 测试恢复后的请求
      const recoveryResponse = await fetch(`${this.baseUrl}/api/weather`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: "北京" }),
      })

      if (recoveryResponse.status === 200) {
        console.log("✅ 限流恢复机制正常工作")
      } else {
        console.log("⚠️ 限流恢复可能存在问题")
      }
    } else {
      console.log("⚠️ 限流机制可能未正确配置")
    }
  }

  // 测试错误日志记录
  private async testErrorLogging(): Promise<void> {
    console.log("📝 测试错误日志记录...")

    try {
      // 触发一个错误
      await fetch(`${this.baseUrl}/api/weather`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: "" }),
      })

      // 等待日志记录
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // 检查错误日志
      const logsResponse = await fetch(`${this.baseUrl}/api/errors/logs?limit=10`)
      if (logsResponse.ok) {
        const logsData = await logsResponse.json()
        if (logsData.logs && logsData.logs.length > 0) {
          console.log("✅ 错误日志记录正常工作")
        } else {
          console.log("⚠️ 错误日志可能未正确记录")
        }
      } else {
        console.log("⚠️ 无法访问错误日志API")
      }
    } catch (error) {
      console.error("❌ 错误日志测试失败:", error)
    }
  }
}

// 执行错误处理测试
async function runErrorTests() {
  const tester = new ErrorHandlingTester()

  try {
    const results = await tester.runErrorHandlingTests()
    console.log("\n📋 错误处理测试报告:")
    console.log(JSON.stringify(results, null, 2))
    return results
  } catch (error) {
    console.error("❌ 错误处理测试失败:", error)
    throw error
  }
}

// 执行测试
runErrorTests().catch(console.error)
