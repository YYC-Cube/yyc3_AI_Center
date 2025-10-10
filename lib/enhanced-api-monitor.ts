/**
 * 增强API监控系统 - 提供更详细的监控指标和智能告警
 */

import { apiMonitor } from "./api-monitor";

// 性能阈值配置
interface PerformanceThresholds {
  responseTime: {
    warning: number; // 毫秒
    critical: number; // 毫秒
  };
  errorRate: {
    warning: number; // 百分比
    critical: number; // 百分比
  };
  successRate: {
    warning: number; // 百分比
    critical: number; // 百分比
  };
  cacheHitRate: {
    warning: number; // 百分比
  };
}

// 默认性能阈值
const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  responseTime: {
    warning: 2000, // 2秒
    critical: 5000, // 5秒
  },
  errorRate: {
    warning: 5, // 5%
    critical: 10, // 10%
  },
  successRate: {
    warning: 95, // 95%
    critical: 90, // 90%
  },
  cacheHitRate: {
    warning: 60, // 60%
  },
};

// 服务特定阈值
const SERVICE_THRESHOLDS: Record<string, Partial<PerformanceThresholds>> = {
  weather: {
    responseTime: {
      warning: 1500,
      critical: 3000,
    },
  },
  translate: {
    responseTime: {
      warning: 3000,
      critical: 6000,
    },
  },
};

/**
 * 获取服务性能阈值
 */
function getServiceThresholds(service: string): PerformanceThresholds {
  return {
    ...DEFAULT_THRESHOLDS,
    ...(SERVICE_THRESHOLDS[service] || {}),
  };
}

/**
 * 增强的API监控记录
 */
export function enhancedRecordAPICall(
  serviceName: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number,
  options: {
    userAgent?: string;
    ip?: string;
    error?: string;
    cacheHit?: boolean;
    requestSize?: number;
    responseSize?: number;
    params?: Record<string, any>;
  } = {},
): void {
  // 调用原始记录函数
  apiMonitor.recordMetric({
    serviceName,
    endpoint,
    method,
    statusCode,
    responseTime,
    timestamp: Date.now(),
    ...options,
  });

  // 增强监控：性能阈值检查
  checkPerformanceThresholds(
    serviceName,
    statusCode,
    responseTime,
    options.cacheHit,
  );
}

/**
 * 检查性能阈值并生成告警
 */
function checkPerformanceThresholds(
  service: string,
  statusCode: number,
  responseTime: number,
  cacheHit?: boolean,
): void {
  const thresholds = getServiceThresholds(service);

  // 响应时间检查
  if (responseTime > thresholds.responseTime.critical) {
    generateAlert("critical", service, `响应时间严重超时: ${responseTime}ms`, {
      metric: "responseTime",
      value: responseTime,
      threshold: thresholds.responseTime.critical,
    });
  } else if (responseTime > thresholds.responseTime.warning) {
    generateAlert("warning", service, `响应时间超出预期: ${responseTime}ms`, {
      metric: "responseTime",
      value: responseTime,
      threshold: thresholds.responseTime.warning,
    });
  }

  // 错误状态码检查
  if (statusCode >= 500) {
    generateAlert("critical", service, `服务返回严重错误: ${statusCode}`, {
      metric: "statusCode",
      value: statusCode,
    });
  } else if (statusCode >= 400) {
    generateAlert("warning", service, `服务返回错误: ${statusCode}`, {
      metric: "statusCode",
      value: statusCode,
    });
  }
}

/**
 * 生成告警
 */
function generateAlert(
  level: "info" | "warning" | "critical",
  service: string,
  message: string,
  details?: Record<string, any>,
): void {
  const alert = {
    id: `${service}-${level}-${Date.now()}`,
    level,
    service,
    message,
    timestamp: Date.now(),
    details,
  };

  // 在实际项目中，这里可以发送告警通知
  console.log(`[${level.toUpperCase()}] ${service}: ${message}`);

  // 记录告警
  recordAlert(alert);
}

// 告警记录
const alerts: any[] = [];

/**
 * 记录告警
 */
function recordAlert(alert: any): void {
  alerts.push(alert);

  // 保持最近100条告警
  if (alerts.length > 100) {
    alerts.shift();
  }
}

/**
 * 获取最近告警
 */
export function getRecentAlerts(
  options: {
    service?: string;
    level?: "info" | "warning" | "critical";
    limit?: number;
  } = {},
): any[] {
  let filteredAlerts = [...alerts];

  if (options.service) {
    filteredAlerts = filteredAlerts.filter(
      (a) => a.service === options.service,
    );
  }

  if (options.level) {
    filteredAlerts = filteredAlerts.filter((a) => a.level === options.level);
  }

  // 按时间倒序排序
  filteredAlerts.sort((a, b) => b.timestamp - a.timestamp);

  return filteredAlerts.slice(0, options.limit || 10);
}

/**
 * 获取服务健康评分
 * 返回0-100的评分，100为最健康
 */
export function getServiceHealthScore(service: string): number {
  const monitoringData = apiMonitor.getMonitoringData();
  const serviceStats = monitoringData.services[service];

  if (!serviceStats) {
    return 100; // 默认满分
  }

  let score = 100;
  const thresholds = getServiceThresholds(service);

  // 1. 错误率评分
  const errorRate = serviceStats.errorRate * 100;
  if (errorRate > thresholds.errorRate.critical) {
    score -= 30;
  } else if (errorRate > thresholds.errorRate.warning) {
    score -= 15;
  }

  // 2. 响应时间评分
  if (serviceStats.averageResponseTime > thresholds.responseTime.critical) {
    score -= 25;
  } else if (
    serviceStats.averageResponseTime > thresholds.responseTime.warning
  ) {
    score -= 10;
  }

  // 3. 缓存命中率评分
  if (serviceStats.cacheHitRate * 100 < thresholds.cacheHitRate.warning) {
    score -= 10;
  }

  // 4. 最近告警评分
  const recentAlerts = getRecentAlerts({ service, limit: 10 });
  const criticalAlerts = recentAlerts.filter(
    (a) => a.level === "critical",
  ).length;
  const warningAlerts = recentAlerts.filter(
    (a) => a.level === "warning",
  ).length;

  score -= criticalAlerts * 5;
  score -= warningAlerts * 2;

  // 确保分数在0-100之间
  return Math.max(0, Math.min(100, score));
}

/**
 * 获取系统整体健康评分
 */
export function getSystemHealthScore(): {
  score: number;
  services: Record<string, number>;
} {
  const monitoringData = apiMonitor.getMonitoringData();
  const services = Object.keys(monitoringData.services);

  const serviceScores: Record<string, number> = {};
  let totalScore = 0;

  services.forEach((service) => {
    const score = getServiceHealthScore(service);
    serviceScores[service] = score;
    totalScore += score;
  });

  const averageScore = services.length > 0 ? totalScore / services.length : 100;

  return {
    score: Math.round(averageScore),
    services: serviceScores,
  };
}

/**
 * 生成系统健康报告
 */
export function generateHealthReport(): any {
  const monitoringData = apiMonitor.getMonitoringData();
  const healthScore = getSystemHealthScore();

  return {
    timestamp: new Date().toISOString(),
    overallHealth: {
      score: healthScore.score,
      status:
        healthScore.score > 80
          ? "健康"
          : healthScore.score > 60
            ? "需注意"
            : "不健康",
    },
    serviceHealth: healthScore.services,
    recentAlerts: getRecentAlerts({ limit: 5 }),
    performance: {
      averageResponseTime:
        Object.values(monitoringData.services).reduce(
          (sum, s: any) => sum + s.averageResponseTime,
          0,
        ) / Object.keys(monitoringData.services).length,
      totalRequests: Object.values(monitoringData.services).reduce(
        (sum, s: any) => sum + s.totalRequests,
        0,
      ),
      errorRate:
        Object.values(monitoringData.services).reduce(
          (sum, s: any) => sum + s.errorRequests,
          0,
        ) /
        Object.values(monitoringData.services).reduce(
          (sum, s: any) => sum + s.totalRequests,
          0,
        ),
    },
    systemResources: monitoringData.systemHealth,
  };
}
