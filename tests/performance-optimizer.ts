/**
 * 性能优化分析工具 - 分析系统性能瓶颈并提供优化建议
 */

interface PerformanceMetrics {
  endpoint: string
  averageResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  throughput: number
  errorRate: number
  cacheHitRate: number
  memoryUsage: number
  cpuUsage: number
}

interface OptimizationRecommendation {
  category: "performance" | "reliability" | "scalability" | "cost"
  priority: "high" | "medium" | "low"
  title: string
  description: string
  expectedImpact: string
  implementation: string
}

class PerformanceOptimizer {
  private baseUrl: string

  constructor(baseUrl = "http://localhost:3000") {
    this.baseUrl = baseUrl
  }

  // 收集性能指标
  async collectPerformanceMetrics(): Promise<PerformanceMetrics[]> {
    console.log("📊 收集性能指标...")

    try {
      // 获取监控数据
      const monitorResponse = await fetch(`${this.baseUrl}/api/monitor`)
      const monitorData = await monitorResponse.json()

      // 获取缓存统计
      const cacheResponse = await fetch(`${this.baseUrl}/api/cache/stats`)
      const cacheData = await cacheResponse.json()

      const metrics: PerformanceMetrics[] = []

      // 分析每个服务的性能指标
      for (const [serviceName, serviceData] of Object.entries(monitorData.services || {})) {
        const service = serviceData as any

        metrics.push({
          endpoint: `/api/${serviceName}`,
          averageResponseTime: service.averageResponseTime || 0,
          p95ResponseTime: service.p95ResponseTime || 0,
          p99ResponseTime: service.p99ResponseTime || 0,
          throughput: service.totalRequests || 0,
          errorRate: service.errorRate || 0,
          cacheHitRate: service.cacheHitRate || 0,
          memoryUsage: monitorData.systemHealth?.memoryUsage || 0,
          cpuUsage: monitorData.systemHealth?.cpuUsage || 0,
        })
      }

      console.log("✅ 性能指标收集完成")
      return metrics
    } catch (error) {
      console.error("❌ 性能指标收集失败:", error)
      throw error
    }
  }

  // 分析性能瓶颈
  analyzeBottlenecks(metrics: PerformanceMetrics[]): OptimizationRecommendation[] {
    console.log("🔍 分析性能瓶颈...")

    const recommendations: OptimizationRecommendation[] = []

    metrics.forEach((metric) => {
      // 响应时间分析
      if (metric.averageResponseTime > 2000) {
        recommendations.push({
          category: "performance",
          priority: "high",
          title: `${metric.endpoint} 响应时间过长`,
          description: `平均响应时间 ${metric.averageResponseTime}ms 超过了推荐的 2000ms 阈值`,
          expectedImpact: "提升用户体验，减少等待时间",
          implementation: "优化数据库查询、增加缓存、使用CDN加速",
        })
      }

      // P99响应时间分析
      if (metric.p99ResponseTime > 5000) {
        recommendations.push({
          category: "performance",
          priority: "medium",
          title: `${metric.endpoint} P99响应时间过长`,
          description: `P99响应时间 ${metric.p99ResponseTime}ms 表明存在性能尖刺`,
          expectedImpact: "改善最差情况下的用户体验",
          implementation: "识别并优化慢查询、增加连接池、实施熔断机制",
        })
      }

      // 错误率分析
      if (metric.errorRate > 0.05) {
        recommendations.push({
          category: "reliability",
          priority: "high",
          title: `${metric.endpoint} 错误率过高`,
          description: `错误率 ${(metric.errorRate * 100).toFixed(2)}% 超过了推荐的 5% 阈值`,
          expectedImpact: "提高服务可靠性和用户满意度",
          implementation: "增强错误处理、实施重试机制、改进监控告警",
        })
      }

      // 缓存命中率分析
      if (metric.cacheHitRate < 0.7) {
        recommendations.push({
          category: "performance",
          priority: "medium",
          title: `${metric.endpoint} 缓存命中率偏低`,
          description: `缓存命中率 ${(metric.cacheHitRate * 100).toFixed(1)}% 低于推荐的 70%`,
          expectedImpact: "减少外部API调用，提升响应速度",
          implementation: "优化缓存策略、增加缓存时间、实施预热机制",
        })
      }

      // 吞吐量分析
      if (metric.throughput < 100) {
        recommendations.push({
          category: "scalability",
          priority: "low",
          title: `${metric.endpoint} 吞吐量较低`,
          description: `当前吞吐量 ${metric.throughput} 请求/天，可能需要优化以支持更高负载`,
          expectedImpact: "提高系统处理能力，支持业务增长",
          implementation: "优化并发处理、增加服务器资源、实施负载均衡",
        })
      }
    })

    // 系统级别分析
    const avgMemoryUsage = metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length
    const avgCpuUsage = metrics.reduce((sum, m) => sum + m.cpuUsage, 0) / metrics.length

    if (avgMemoryUsage > 80) {
      recommendations.push({
        category: "performance",
        priority: "high",
        title: "系统内存使用率过高",
        description: `平均内存使用率 ${avgMemoryUsage.toFixed(1)}% 超过了推荐的 80% 阈值`,
        expectedImpact: "防止内存溢出，提高系统稳定性",
        implementation: "优化内存使用、增加服务器内存、实施内存监控",
      })
    }

    if (avgCpuUsage > 70) {
      recommendations.push({
        category: "performance",
        priority: "high",
        title: "系统CPU使用率过高",
        description: `平均CPU使用率 ${avgCpuUsage.toFixed(1)}% 超过了推荐的 70% 阈值`,
        expectedImpact: "提高系统响应速度，防止性能瓶颈",
        implementation: "优化算法复杂度、增加CPU资源、实施负载分散",
      })
    }

    // 按优先级排序
    recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })

    console.log(`✅ 发现 ${recommendations.length} 个优化建议`)
    return recommendations
  }

  // 生成优化计划
  generateOptimizationPlan(recommendations: OptimizationRecommendation[]): any {
    console.log("📋 生成优化计划...")

    const plan = {
      immediate: recommendations.filter((r) => r.priority === "high"),
      shortTerm: recommendations.filter((r) => r.priority === "medium"),
      longTerm: recommendations.filter((r) => r.priority === "low"),
      summary: {
        totalRecommendations: recommendations.length,
        highPriority: recommendations.filter((r) => r.priority === "high").length,
        mediumPriority: recommendations.filter((r) => r.priority === "medium").length,
        lowPriority: recommendations.filter((r) => r.priority === "low").length,
      },
    }

    console.log("✅ 优化计划生成完成")
    return plan
  }

  // 执行完整的性能分析
  async runCompleteAnalysis(): Promise<any> {
    console.log("🚀 开始完整性能分析...")

    try {
      // 收集性能指标
      const metrics = await this.collectPerformanceMetrics()

      // 分析瓶颈
      const recommendations = this.analyzeBottlenecks(metrics)

      // 生成优化计划
      const optimizationPlan = this.generateOptimizationPlan(recommendations)

      // 生成性能报告
      const report = {
        timestamp: new Date().toISOString(),
        metrics,
        recommendations,
        optimizationPlan,
        healthScore: this.calculateHealthScore(metrics),
      }

      console.log("✅ 性能分析完成!")
      return report
    } catch (error) {
      console.error("❌ 性能分析失败:", error)
      throw error
    }
  }

  // 计算系统健康评分
  private calculateHealthScore(metrics: PerformanceMetrics[]): number {
    let score = 100
    let factors = 0

    metrics.forEach((metric) => {
      factors++

      // 响应时间评分
      if (metric.averageResponseTime > 3000) score -= 20
      else if (metric.averageResponseTime > 2000) score -= 10
      else if (metric.averageResponseTime > 1000) score -= 5

      // 错误率评分
      if (metric.errorRate > 0.1) score -= 25
      else if (metric.errorRate > 0.05) score -= 15
      else if (metric.errorRate > 0.01) score -= 5

      // 缓存命中率评分
      if (metric.cacheHitRate < 0.5) score -= 15
      else if (metric.cacheHitRate < 0.7) score -= 10
      else if (metric.cacheHitRate < 0.8) score -= 5
    })

    // 确保评分在0-100之间
    return Math.max(0, Math.min(100, score))
  }
}

// 执行性能分析
async function runPerformanceAnalysis() {
  const optimizer = new PerformanceOptimizer()

  try {
    const report = await optimizer.runCompleteAnalysis()
    console.log("\n📋 性能分析报告:")
    console.log(JSON.stringify(report, null, 2))
    return report
  } catch (error) {
    console.error("❌ 性能分析失败:", error)
    throw error
  }
}

// 执行分析
runPerformanceAnalysis().catch(console.error)
