/**
 * 缓存性能分析工具 - 分析缓存命中率、性能和优化建议
 */

interface CacheAnalysisResult {
  service: string
  hitRate: number
  missRate: number
  averageHitTime: number
  averageMissTime: number
  totalRequests: number
  cacheSize: number
  recommendations: string[]
}

class CachePerformanceAnalyzer {
  private baseUrl: string

  constructor(baseUrl = "http://localhost:3000") {
    this.baseUrl = baseUrl
  }

  // 分析缓存性能
  async analyzeCachePerformance(): Promise<CacheAnalysisResult[]> {
    console.log("🔍 开始分析缓存性能...")

    try {
      // 获取缓存统计数据
      const response = await fetch(`${this.baseUrl}/api/cache/stats`)
      const cacheStats = await response.json()

      const results: CacheAnalysisResult[] = []

      // 分析每个服务的缓存性能
      for (const [serviceName, stats] of Object.entries(cacheStats.services || {})) {
        const serviceStats = stats as any

        const hitRate = serviceStats.totalRequests > 0 ? serviceStats.cacheHitRate * 100 : 0
        const missRate = 100 - hitRate

        // 模拟响应时间分析（实际项目中应该从监控数据获取）
        const averageHitTime = 50 // 缓存命中平均时间
        const averageMissTime = serviceStats.averageResponseTime || 1000 // 缓存未命中平均时间

        const recommendations = this.generateCacheRecommendations(serviceName, {
          hitRate,
          averageResponseTime: serviceStats.averageResponseTime,
          totalRequests: serviceStats.totalRequests,
          errorRate: serviceStats.errorRate,
        })

        results.push({
          service: serviceName,
          hitRate,
          missRate,
          averageHitTime,
          averageMissTime,
          totalRequests: serviceStats.totalRequests,
          cacheSize: 0, // 需要从实际缓存系统获取
          recommendations,
        })
      }

      console.log("✅ 缓存性能分析完成!")
      return results
    } catch (error) {
      console.error("❌ 缓存性能分析失败:", error)
      throw error
    }
  }

  // 生成缓存优化建议
  private generateCacheRecommendations(serviceName: string, stats: any): string[] {
    const recommendations: string[] = []

    // 基于命中率的建议
    if (stats.hitRate < 50) {
      recommendations.push(
        `${serviceName}服务缓存命中率${stats.hitRate.toFixed(1)}%过低，建议增加缓存时间或优化缓存策略`,
      )
    } else if (stats.hitRate > 90) {
      recommendations.push(`${serviceName}服务缓存命中率${stats.hitRate.toFixed(1)}%很好，继续保持`)
    }

    // 基于响应时间的建议
    if (stats.averageResponseTime > 2000) {
      recommendations.push(`${serviceName}服务平均响应时间${stats.averageResponseTime}ms过长，建议优化缓存预热策略`)
    }

    // 基于请求量的建议
    if (stats.totalRequests > 1000) {
      recommendations.push(`${serviceName}服务请求量较大，建议考虑分布式缓存或缓存分片`)
    }

    // 基于错误率的建议
    if (stats.errorRate > 0.05) {
      recommendations.push(`${serviceName}服务错误率${(stats.errorRate * 100).toFixed(2)}%偏高，可能影响缓存效果`)
    }

    return recommendations
  }

  // 测试缓存预热效果
  async testCacheWarmup(): Promise<any> {
    console.log("🔥 测试缓存预热效果...")

    const warmupData = [
      { service: "weather", params: { city: "北京" } },
      { service: "weather", params: { city: "上海" } },
      { service: "weather", params: { city: "广州" } },
      { service: "news", params: { category: "technology" } },
      { service: "news", params: { category: "business" } },
      { service: "currency", params: { from: "USD", to: "CNY" } },
      { service: "currency", params: { from: "EUR", to: "USD" } },
    ]

    const results = []

    for (const item of warmupData) {
      const startTime = Date.now()

      try {
        // 第一次请求（预热）
        const response1 = await fetch(`${this.baseUrl}/api/${item.service}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.params),
        })
        const time1 = Date.now() - startTime

        // 短暂延迟
        await new Promise((resolve) => setTimeout(resolve, 100))

        // 第二次请求（应该命中缓存）
        const startTime2 = Date.now()
        const response2 = await fetch(`${this.baseUrl}/api/${item.service}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.params),
        })
        const time2 = Date.now() - startTime2

        const improvement = ((time1 - time2) / time1) * 100

        results.push({
          service: item.service,
          params: item.params,
          firstRequestTime: time1,
          secondRequestTime: time2,
          improvement: improvement,
          cacheWorking: time2 < time1 * 0.5, // 如果第二次请求时间少于第一次的50%，认为缓存生效
        })

        console.log(`${item.service}: 第一次 ${time1}ms, 第二次 ${time2}ms, 改善 ${improvement.toFixed(1)}%`)
      } catch (error) {
        console.error(`缓存预热测试失败 (${item.service}):`, error)
      }
    }

    const workingCache = results.filter((r) => r.cacheWorking).length
    const totalTests = results.length
    const cacheEffectiveness = (workingCache / totalTests) * 100

    console.log(`✅ 缓存预热测试完成! 缓存有效性: ${cacheEffectiveness.toFixed(1)}%`)

    return {
      results,
      summary: {
        totalTests,
        workingCache,
        cacheEffectiveness,
        averageImprovement: results.reduce((sum, r) => sum + r.improvement, 0) / totalTests,
      },
    }
  }
}

// 执行缓存分析
async function runCacheAnalysis() {
  const analyzer = new CachePerformanceAnalyzer()

  try {
    // 分析缓存性能
    const performanceResults = await analyzer.analyzeCachePerformance()

    // 测试缓存预热
    const warmupResults = await analyzer.testCacheWarmup()

    const report = {
      timestamp: new Date().toISOString(),
      performance: performanceResults,
      warmup: warmupResults,
    }

    console.log("\n📋 缓存分析报告:")
    console.log(JSON.stringify(report, null, 2))

    return report
  } catch (error) {
    console.error("❌ 缓存分析失败:", error)
    throw error
  }
}

// 执行分析
runCacheAnalysis().catch(console.error)
