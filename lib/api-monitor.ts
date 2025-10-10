// API监控数据收集和分析服务

interface APIMetrics {
  serviceName: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: number;
  userAgent?: string;
  ip?: string;
  error?: string;
  cacheHit?: boolean;
}

interface ServiceStats {
  totalRequests: number;
  successRequests: number;
  errorRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
  lastHour: APIMetrics[];
  lastDay: APIMetrics[];
}

interface MonitoringData {
  services: Record<string, ServiceStats>;
  systemHealth: {
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
    activeConnections: number;
    totalRequests: number;
    errorRate: number;
  };
  alerts: Array<{
    id: string;
    type: "error" | "warning" | "info";
    service: string;
    message: string;
    timestamp: number;
    resolved: boolean;
  }>;
}

class APIMonitor {
  private metrics: APIMetrics[] = [];
  private alerts: MonitoringData["alerts"] = [];
  private startTime = Date.now();

  // 记录API调用指标
  recordMetric(metric: APIMetrics) {
    this.metrics.push(metric);

    // 保持最近24小时的数据
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.metrics = this.metrics.filter((m) => m.timestamp > oneDayAgo);

    // 检查是否需要生成警报
    this.checkAlerts(metric);
  }

  // 检查警报条件
  private checkAlerts(metric: APIMetrics) {
    const serviceName = metric.serviceName;
    const recentMetrics = this.metrics.filter(
      (m) =>
        m.serviceName === serviceName &&
        m.timestamp > Date.now() - 5 * 60 * 1000,
    );

    // 错误率警报
    const errorRate =
      recentMetrics.filter((m) => m.statusCode >= 400).length /
      recentMetrics.length;
    if (errorRate > 0.1 && recentMetrics.length > 10) {
      this.addAlert(
        "error",
        serviceName,
        `${serviceName}服务错误率过高: ${(errorRate * 100).toFixed(1)}%`,
      );
    }

    // 响应时间警报
    const avgResponseTime =
      recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) /
      recentMetrics.length;
    if (avgResponseTime > 5000) {
      this.addAlert(
        "warning",
        serviceName,
        `${serviceName}服务响应时间过长: ${avgResponseTime.toFixed(0)}ms`,
      );
    }
  }

  // 添加警报
  private addAlert(
    type: "error" | "warning" | "info",
    service: string,
    message: string,
  ) {
    const alertId = `${service}-${type}-${Date.now()}`;

    // 检查是否已存在相似警报
    const existingAlert = this.alerts.find(
      (a) =>
        a.service === service &&
        a.type === type &&
        !a.resolved &&
        Date.now() - a.timestamp < 10 * 60 * 1000, // 10分钟内
    );

    if (!existingAlert) {
      this.alerts.push({
        id: alertId,
        type,
        service,
        message,
        timestamp: Date.now(),
        resolved: false,
      });
    }
  }

  // 获取服务统计
  getServiceStats(serviceName: string): ServiceStats {
    const serviceMetrics = this.metrics.filter(
      (m) => m.serviceName === serviceName,
    );
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    const lastHour = serviceMetrics.filter((m) => m.timestamp > oneHourAgo);
    const lastDay = serviceMetrics.filter((m) => m.timestamp > oneDayAgo);

    const successRequests = serviceMetrics.filter(
      (m) => m.statusCode < 400,
    ).length;
    const errorRequests = serviceMetrics.filter(
      (m) => m.statusCode >= 400,
    ).length;
    const cacheHits = serviceMetrics.filter((m) => m.cacheHit).length;

    const responseTimes = serviceMetrics
      .map((m) => m.responseTime)
      .sort((a, b) => a - b);
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);

    return {
      totalRequests: serviceMetrics.length,
      successRequests,
      errorRequests,
      averageResponseTime:
        responseTimes.length > 0
          ? responseTimes.reduce((sum, time) => sum + time, 0) /
            responseTimes.length
          : 0,
      p95ResponseTime: responseTimes[p95Index] || 0,
      p99ResponseTime: responseTimes[p99Index] || 0,
      errorRate:
        serviceMetrics.length > 0 ? errorRequests / serviceMetrics.length : 0,
      cacheHitRate:
        serviceMetrics.length > 0 ? cacheHits / serviceMetrics.length : 0,
      lastHour,
      lastDay,
    };
  }

  // 获取系统健康状态
  getSystemHealth() {
    const totalRequests = this.metrics.length;
    const errorRequests = this.metrics.filter(
      (m) => m.statusCode >= 400,
    ).length;
    const uptime = Date.now() - this.startTime;

    return {
      uptime,
      memoryUsage: process.memoryUsage
        ? process.memoryUsage().heapUsed / 1024 / 1024
        : 0,
      cpuUsage: Math.random() * 30 + 10, // 模拟CPU使用率
      activeConnections: Math.floor(Math.random() * 100 + 50),
      totalRequests,
      errorRate: totalRequests > 0 ? errorRequests / totalRequests : 0,
    };
  }

  // 获取完整监控数据
  getMonitoringData(): MonitoringData {
    const services = [
      "weather",
      "news",
      "ipinfo",
      "currency",
      "stock",
      "geocode",
      "translate",
      "qrcode",
    ];
    const serviceStats: Record<string, ServiceStats> = {};

    services.forEach((service) => {
      serviceStats[service] = this.getServiceStats(service);
    });

    return {
      services: serviceStats,
      systemHealth: this.getSystemHealth(),
      alerts: this.alerts.filter((a) => !a.resolved).slice(-20), // 最近20个未解决的警报
    };
  }

  // 解决警报
  resolveAlert(alertId: string) {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  // 清理旧数据
  cleanup() {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.metrics = this.metrics.filter((m) => m.timestamp > oneDayAgo);

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    this.alerts = this.alerts.filter((a) => a.timestamp > oneWeekAgo);
  }
}

// 全局监控实例
export const apiMonitor = new APIMonitor();

// 中间件函数，用于记录API调用
export function recordAPICall(
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
  } = {},
) {
  apiMonitor.recordMetric({
    serviceName,
    endpoint,
    method,
    statusCode,
    responseTime,
    timestamp: Date.now(),
    ...options,
  });
}

// 定期清理数据
setInterval(
  () => {
    apiMonitor.cleanup();
  },
  60 * 60 * 1000,
); // 每小时清理一次
