import { NextResponse } from "next/server";
import { apiMonitor } from "@/lib/api-monitor";

export async function GET() {
  try {
    const monitoringData = apiMonitor.getMonitoringData();

    // 添加实时计算的额外指标
    const enhancedData = {
      ...monitoringData,
      timestamp: new Date().toISOString(),
      summary: {
        totalServices: Object.keys(monitoringData.services).length,
        healthyServices: Object.values(monitoringData.services).filter(
          (service) => service.errorRate < 0.05,
        ).length,
        totalRequests: Object.values(monitoringData.services).reduce(
          (sum, service) => sum + service.totalRequests,
          0,
        ),
        averageResponseTime:
          Object.values(monitoringData.services).reduce(
            (sum, service) => sum + service.averageResponseTime,
            0,
          ) / Object.keys(monitoringData.services).length,
        overallErrorRate:
          Object.values(monitoringData.services).reduce(
            (sum, service) => sum + service.errorRate,
            0,
          ) / Object.keys(monitoringData.services).length,
        activeAlerts: monitoringData.alerts.filter((alert) => !alert.resolved)
          .length,
      },
    };

    return NextResponse.json(enhancedData);
  } catch (error) {
    console.error("监控数据获取错误:", error);
    return NextResponse.json(
      { error: "获取监控数据失败", code: "MONITOR_ERROR" },
      { status: 500 },
    );
  }
}

// 解决警报
export async function POST(request: Request) {
  try {
    const { alertId } = await request.json();

    if (!alertId) {
      return NextResponse.json(
        { error: "缺少警报ID", code: "INVALID_INPUT" },
        { status: 400 },
      );
    }

    apiMonitor.resolveAlert(alertId);

    return NextResponse.json({
      success: true,
      message: "警报已解决",
    });
  } catch (error) {
    console.error("解决警报错误:", error);
    return NextResponse.json(
      { error: "解决警报失败", code: "RESOLVE_ERROR" },
      { status: 500 },
    );
  }
}
