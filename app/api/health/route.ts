import { NextResponse } from "next/server";
import { generateHealthReport } from "@/lib/enhanced-api-monitor";
import { serviceDegradation } from "@/lib/service-degradation";
import { getCacheStats } from "@/lib/cache-manager";

/**
 * 系统健康仪表盘API
 * 提供系统整体健康状态、服务状态、缓存状态等信息
 */
export async function GET() {
  try {
    // 获取系统健康报告
    const healthReport = generateHealthReport();

    // 获取服务降级状态
    const serviceStatus = serviceDegradation.getAllServiceStatus();

    // 获取缓存统计
    const cacheStats = getCacheStats();

    // 构建完整的健康仪表盘数据
    const dashboardData = {
      timestamp: new Date().toISOString(),
      health: healthReport,
      services: serviceStatus.reduce(
        (acc, status) => {
          acc[status.name] = {
            health: status.health,
            errorCount: status.errorCount,
            lastError: status.lastError,
            lastErrorTime: status.lastErrorTime,
            degradedSince: status.degradedSince,
          };
          return acc;
        },
        {} as Record<string, any>,
      ),
      cache: {
        stats: cacheStats,
        serviceMetrics: cacheStats.metrics,
      },
      uptime: process.uptime(),
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("获取健康仪表盘数据失败:", error);
    return NextResponse.json(
      {
        error: "获取健康仪表盘数据失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
