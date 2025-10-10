import { NextResponse } from "next/server";
import { getCacheMetrics, getCacheStats } from "@/lib/cache-manager";

export async function GET() {
  try {
    const metrics = getCacheMetrics();
    const stats = getCacheStats();

    const cacheInfo = {
      timestamp: new Date().toISOString(),
      metrics,
      stats,
      summary: {
        totalHits: Object.values(metrics).reduce((sum, m) => sum + m.hits, 0),
        totalMisses: Object.values(metrics).reduce(
          (sum, m) => sum + m.misses,
          0,
        ),
        totalSets: Object.values(metrics).reduce((sum, m) => sum + m.sets, 0),
        totalErrors: Object.values(metrics).reduce(
          (sum, m) => sum + m.errors,
          0,
        ),
        hitRate: 0,
      },
    };

    // 计算总体命中率
    const totalRequests =
      cacheInfo.summary.totalHits + cacheInfo.summary.totalMisses;
    if (totalRequests > 0) {
      cacheInfo.summary.hitRate =
        (cacheInfo.summary.totalHits / totalRequests) * 100;
    }

    return NextResponse.json(cacheInfo);
  } catch (error) {
    console.error("Cache stats error:", error);
    return NextResponse.json({ error: "获取缓存统计失败" }, { status: 500 });
  }
}
