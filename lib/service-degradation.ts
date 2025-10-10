/**
 * 服务降级和恢复策略 - 提供在高负载或故障情况下的优雅降级机制
 */

import { ErrorType } from "./error-handler";

// 服务健康状态
export enum ServiceHealth {
  HEALTHY = "HEALTHY", // 健康状态，所有功能正常
  DEGRADED = "DEGRADED", // 降级状态，部分功能可用
  CRITICAL = "CRITICAL", // 严重状态，仅核心功能可用
  UNAVAILABLE = "UNAVAILABLE", // 不可用状态，服务完全不可用
}

// 服务配置
interface ServiceConfig {
  name: string; // 服务名称
  priority: number; // 优先级（1-10，1最高）
  dependencies: string[]; // 依赖的其他服务
  fallbackAvailable: boolean; // 是否有降级方案
  isCritical: boolean; // 是否是核心服务
}

// 服务状态
interface ServiceStatus {
  name: string;
  health: ServiceHealth;
  errorCount: number; // 最近错误数
  errorThreshold: number; // 错误阈值
  lastError?: ErrorType; // 最后一次错误类型
  lastErrorTime?: number; // 最后一次错误时间
  degradedSince?: number; // 开始降级时间
  recoveryAttempts: number; // 恢复尝试次数
  nextRecoveryTime?: number; // 下次恢复尝试时间
}

class ServiceDegradation {
  private services: Map<string, ServiceConfig> = new Map();
  private status: Map<string, ServiceStatus> = new Map();
  private readonly ERROR_WINDOW = 5 * 60 * 1000; // 5分钟错误窗口
  private readonly RECOVERY_INTERVAL = 60 * 1000; // 1分钟恢复间隔
  private readonly MAX_RECOVERY_ATTEMPTS = 3; // 最大恢复尝试次数

  // 注册服务
  registerService(config: ServiceConfig): void {
    this.services.set(config.name, config);
    this.status.set(config.name, {
      name: config.name,
      health: ServiceHealth.HEALTHY,
      errorCount: 0,
      errorThreshold: config.isCritical ? 3 : 5, // 核心服务有更低的错误阈值
      recoveryAttempts: 0,
    });
  }

  // 记录服务错误
  recordError(serviceName: string, errorType: ErrorType): void {
    const status = this.status.get(serviceName);
    if (!status) return;

    // 更新错误计数和最后错误信息
    status.errorCount++;
    status.lastError = errorType;
    status.lastErrorTime = Date.now();

    // 检查是否需要降级
    this.checkForDegradation(serviceName);

    // 检查依赖服务是否需要降级
    this.checkDependencies(serviceName);
  }

  // 检查是否需要降级
  private checkForDegradation(serviceName: string): void {
    const status = this.status.get(serviceName);
    const config = this.services.get(serviceName);
    if (!status || !config) return;

    // 如果错误数超过阈值，降级服务
    if (
      status.errorCount >= status.errorThreshold &&
      status.health === ServiceHealth.HEALTHY
    ) {
      this.degradeService(serviceName);
    }

    // 如果是严重错误类型，直接降级
    if (status.lastError && this.isCriticalError(status.lastError)) {
      this.degradeService(serviceName);
    }
  }

  // 检查依赖服务
  private checkDependencies(serviceName: string): void {
    const config = this.services.get(serviceName);
    if (!config) return;

    // 如果服务已经不健康，检查依赖它的其他服务
    for (const [name, otherConfig] of this.services.entries()) {
      if (otherConfig.dependencies.includes(serviceName)) {
        const otherStatus = this.status.get(name);
        if (otherStatus && otherStatus.health === ServiceHealth.HEALTHY) {
          // 根据依赖服务的重要性决定是否降级
          if (config.isCritical) {
            this.degradeService(name);
          }
        }
      }
    }
  }

  // 降级服务
  private degradeService(serviceName: string): void {
    const status = this.status.get(serviceName);
    const config = this.services.get(serviceName);
    if (!status || !config) return;

    // 更新服务状态
    status.health = config.fallbackAvailable
      ? ServiceHealth.DEGRADED
      : ServiceHealth.UNAVAILABLE;
    status.degradedSince = Date.now();
    status.recoveryAttempts = 0;
    status.nextRecoveryTime = Date.now() + this.RECOVERY_INTERVAL;

    // 记录降级事件
    console.warn(`服务${serviceName}已降级为${status.health}状态`);

    // 可以在这里添加通知逻辑
  }

  // 尝试恢复服务
  attemptRecovery(serviceName: string): boolean {
    const status = this.status.get(serviceName);
    if (!status || status.health === ServiceHealth.HEALTHY) return true;

    // 检查是否到达恢复时间
    if (status.nextRecoveryTime && Date.now() < status.nextRecoveryTime) {
      return false;
    }

    // 增加恢复尝试次数
    status.recoveryAttempts++;

    // 如果超过最大尝试次数，延长恢复间隔
    if (status.recoveryAttempts > this.MAX_RECOVERY_ATTEMPTS) {
      const backoffMultiplier = Math.min(
        status.recoveryAttempts - this.MAX_RECOVERY_ATTEMPTS + 1,
        10,
      );
      status.nextRecoveryTime =
        Date.now() + this.RECOVERY_INTERVAL * backoffMultiplier;
      return false;
    }

    // 尝试恢复服务
    status.health = ServiceHealth.HEALTHY;
    status.errorCount = 0;
    status.degradedSince = undefined;
    status.nextRecoveryTime = undefined;

    console.info(`服务${serviceName}已恢复正常状态`);
    return true;
  }

  // 获取服务健康状态
  getServiceHealth(serviceName: string): ServiceHealth {
    return this.status.get(serviceName)?.health || ServiceHealth.UNAVAILABLE;
  }

  // 获取所有服务状态
  getAllServiceStatus(): ServiceStatus[] {
    return Array.from(this.status.values());
  }

  // 检查是否是严重错误
  private isCriticalError(errorType: ErrorType): boolean {
    return [
      ErrorType.DATABASE_ERROR,
      ErrorType.RESOURCE_ERROR,
      ErrorType.SERVER_ERROR,
    ].includes(errorType);
  }

  // 清理过期错误计数
  cleanup(): void {
    const now = Date.now();
    for (const status of this.status.values()) {
      // 如果最后错误时间超过窗口期，重置错误计数
      if (
        status.lastErrorTime &&
        now - status.lastErrorTime > this.ERROR_WINDOW
      ) {
        status.errorCount = 0;
      }

      // 如果服务处于降级状态，尝试恢复
      if (
        status.health !== ServiceHealth.HEALTHY &&
        status.nextRecoveryTime &&
        now >= status.nextRecoveryTime
      ) {
        this.attemptRecovery(status.name);
      }
    }
  }
}

// 创建全局服务降级实例
export const serviceDegradation = new ServiceDegradation();

// 注册核心服务
serviceDegradation.registerService({
  name: "weather",
  priority: 2,
  dependencies: [],
  fallbackAvailable: true,
  isCritical: false,
});

serviceDegradation.registerService({
  name: "news",
  priority: 3,
  dependencies: [],
  fallbackAvailable: true,
  isCritical: false,
});

serviceDegradation.registerService({
  name: "ipinfo",
  priority: 4,
  dependencies: [],
  fallbackAvailable: true,
  isCritical: false,
});

serviceDegradation.registerService({
  name: "currency",
  priority: 5,
  dependencies: [],
  fallbackAvailable: true,
  isCritical: false,
});

serviceDegradation.registerService({
  name: "stock",
  priority: 5,
  dependencies: [],
  fallbackAvailable: true,
  isCritical: false,
});

serviceDegradation.registerService({
  name: "geocode",
  priority: 6,
  dependencies: [],
  fallbackAvailable: true,
  isCritical: false,
});

serviceDegradation.registerService({
  name: "translate",
  priority: 4,
  dependencies: [],
  fallbackAvailable: true,
  isCritical: false,
});

serviceDegradation.registerService({
  name: "qrcode",
  priority: 7,
  dependencies: [],
  fallbackAvailable: false,
  isCritical: false,
});

// 定期清理
setInterval(() => {
  serviceDegradation.cleanup();
}, 60 * 1000); // 每分钟清理一次
