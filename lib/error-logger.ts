/**
 * 错误日志和分析系统 - 提供错误记录、分析和报告功能
 */

import { type APIError, ErrorSeverity, ErrorType } from "./error-handler";

// 错误日志接口
interface ErrorLog extends APIError {
  id: string; // 唯一日志ID
  userAgent?: string; // 用户代理
  ip?: string; // 用户IP
  userId?: string; // 用户ID（如果已认证）
  metadata?: Record<string, any>; // 额外元数据
}

// 错误趋势分析
interface ErrorTrend {
  errorType: ErrorType;
  count: number;
  firstSeen: number;
  lastSeen: number;
  frequency: number; // 每小时频率
  isIncreasing: boolean; // 是否呈上升趋势
}

// 错误报告
interface ErrorReport {
  timestamp: number;
  totalErrors: number;
  criticalErrors: number;
  highErrors: number;
  mediumErrors: number;
  lowErrors: number;
  topErrors: ErrorTrend[];
  recommendations: string[];
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private readonly MAX_LOGS = 1000; // 最大日志数量
  private readonly RETENTION_PERIOD = 24 * 60 * 60 * 1000; // 保留24小时

  // 记录错误
  logError(
    error: APIError,
    options: {
      userAgent?: string;
      ip?: string;
      userId?: string;
      metadata?: Record<string, any>;
    } = {},
  ): string {
    const id = `err_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    const errorLog: ErrorLog = {
      ...error,
      id,
      ...options,
    };

    this.logs.push(errorLog);

    // 如果日志数量超过最大值，删除最旧的日志
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift();
    }

    // 对于严重错误，可以实现实时通知机制
    if (
      error.severity === ErrorSeverity.CRITICAL ||
      error.severity === ErrorSeverity.HIGH
    ) {
      this.notifyCriticalError(errorLog);
    }

    return id;
  }

  // 获取错误日志
  getErrorLog(id: string): ErrorLog | undefined {
    return this.logs.find((log) => log.id === id);
  }

  // 获取所有错误日志
  getAllErrorLogs(
    options: {
      startTime?: number;
      endTime?: number;
      type?: ErrorType;
      severity?: ErrorSeverity;
      limit?: number;
      offset?: number;
    } = {},
  ): ErrorLog[] {
    let filteredLogs = this.logs;

    // 应用过滤条件
    if (options.startTime) {
      filteredLogs = filteredLogs.filter(
        (log) => log.timestamp >= options.startTime!,
      );
    }

    if (options.endTime) {
      filteredLogs = filteredLogs.filter(
        (log) => log.timestamp <= options.endTime!,
      );
    }

    if (options.type) {
      filteredLogs = filteredLogs.filter((log) => log.type === options.type);
    }

    if (options.severity) {
      filteredLogs = filteredLogs.filter(
        (log) => log.severity === options.severity,
      );
    }

    // 应用分页
    const offset = options.offset || 0;
    const limit = options.limit || filteredLogs.length;

    return filteredLogs.slice(offset, offset + limit);
  }

  // 清理旧日志
  cleanup(): void {
    const cutoffTime = Date.now() - this.RETENTION_PERIOD;
    this.logs = this.logs.filter((log) => log.timestamp >= cutoffTime);
  }

  // 分析错误趋势
  analyzeErrorTrends(timeWindow = 3600000): ErrorTrend[] {
    const cutoffTime = Date.now() - timeWindow;
    const recentLogs = this.logs.filter((log) => log.timestamp >= cutoffTime);

    // 按错误类型分组
    const errorGroups: Record<string, ErrorLog[]> = {};
    recentLogs.forEach((log) => {
      if (!errorGroups[log.type]) {
        errorGroups[log.type] = [];
      }
      errorGroups[log.type].push(log);
    });

    // 计算每种错误类型的趋势
    const trends: ErrorTrend[] = [];
    for (const [type, logs] of Object.entries(errorGroups)) {
      if (logs.length < 2) continue; // 至少需要2个日志来分析趋势

      // 按时间排序
      logs.sort((a, b) => a.timestamp - b.timestamp);

      // 计算频率
      const firstSeen = logs[0].timestamp;
      const lastSeen = logs[logs.length - 1].timestamp;
      const timeSpan = (lastSeen - firstSeen) / 3600000; // 转换为小时
      const frequency = timeSpan > 0 ? logs.length / timeSpan : logs.length;

      // 判断是否呈上升趋势
      // 将时间窗口分为两半，比较后半段的错误数量是否多于前半段
      const midPoint = firstSeen + (lastSeen - firstSeen) / 2;
      const firstHalf = logs.filter((log) => log.timestamp < midPoint).length;
      const secondHalf = logs.filter((log) => log.timestamp >= midPoint).length;
      const isIncreasing = secondHalf > firstHalf;

      trends.push({
        errorType: type as ErrorType,
        count: logs.length,
        firstSeen,
        lastSeen,
        frequency,
        isIncreasing,
      });
    }

    // 按错误数量降序排序
    return trends.sort((a, b) => b.count - a.count);
  }

  // 生成错误报告
  generateErrorReport(): ErrorReport {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const recentLogs = this.logs.filter((log) => log.timestamp >= oneDayAgo);

    // 按严重程度统计
    const criticalErrors = recentLogs.filter(
      (log) => log.severity === ErrorSeverity.CRITICAL,
    ).length;
    const highErrors = recentLogs.filter(
      (log) => log.severity === ErrorSeverity.HIGH,
    ).length;
    const mediumErrors = recentLogs.filter(
      (log) => log.severity === ErrorSeverity.MEDIUM,
    ).length;
    const lowErrors = recentLogs.filter(
      (log) => log.severity === ErrorSeverity.LOW,
    ).length;

    // 获取错误趋势
    const trends = this.analyzeErrorTrends(24 * 60 * 60 * 1000);
    const topErrors = trends.slice(0, 5); // 取前5个最常见的错误

    // 生成建议
    const recommendations: string[] = [];

    // 基于严重错误的建议
    if (criticalErrors > 0) {
      recommendations.push(`有${criticalErrors}个严重错误需要立即处理。`);
    }

    // 基于趋势的建议
    const increasingTrends = trends.filter((trend) => trend.isIncreasing);
    if (increasingTrends.length > 0) {
      const topIncreasing = increasingTrends[0];
      recommendations.push(
        `${topIncreasing.errorType}类型的错误呈上升趋势，建议优先调查。`,
      );
    }

    // 基于错误类型的具体建议
    topErrors.forEach((error) => {
      switch (error.errorType) {
        case ErrorType.EXTERNAL_API_ERROR:
          recommendations.push(
            `外部API错误频繁发生，建议检查API服务状态或实现更强的降级策略。`,
          );
          break;
        case ErrorType.DATABASE_ERROR:
          recommendations.push(
            `数据库错误频繁发生，建议检查数据库连接和查询性能。`,
          );
          break;
        case ErrorType.VALIDATION_ERROR:
          recommendations.push(
            `输入验证错误频繁发生，建议改进客户端验证或提供更清晰的输入指南。`,
          );
          break;
        case ErrorType.TIMEOUT_ERROR:
          recommendations.push(
            `请求超时错误频繁发生，建议优化性能或增加超时阈值。`,
          );
          break;
      }
    });

    // 如果没有特定建议，添加一个通用建议
    if (recommendations.length === 0 && recentLogs.length > 0) {
      recommendations.push(
        `过去24小时内有${recentLogs.length}个错误，建议定期检查错误日志。`,
      );
    }

    return {
      timestamp: now,
      totalErrors: recentLogs.length,
      criticalErrors,
      highErrors,
      mediumErrors,
      lowErrors,
      topErrors,
      recommendations,
    };
  }

  // 通知严重错误（可以集成邮件、短信或其他通知系统）
  private notifyCriticalError(error: ErrorLog): void {
    // 这里可以实现实际的通知逻辑
    console.error(`严重错误: ${error.type} - ${error.message}`);
    // 例如: sendEmail('admin@example.com', `严重错误: ${error.code}`, JSON.stringify(error));
  }
}

// 创建全局错误日志实例
export const errorLogger = new ErrorLogger();

// 定期清理旧日志
setInterval(
  () => {
    errorLogger.cleanup();
  },
  60 * 60 * 1000,
); // 每小时清理一次
