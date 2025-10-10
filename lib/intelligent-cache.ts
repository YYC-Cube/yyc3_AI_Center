// 智能缓存管理系统
// 实现基于使用频率、数据新鲜度需求的动态缓存策略

/**
 * 缓存配置接口
 */
export interface CacheConfig {
  ttl: number; // 缓存过期时间（秒）
  maxSize: number; // 最大缓存条目数
  enabled: boolean; // 是否启用缓存
  slidingExpiration?: boolean; // 是否启用滑动过期
  staleWhileRevalidate?: boolean; // 是否启用过期刷新
}

/**
 * 缓存项接口
 */
export interface CacheItem<T> {
  data: T; // 缓存数据
  expiry: number; // 过期时间戳
  lastAccessed: number; // 最后访问时间
  accessCount: number; // 访问次数
  metadata?: Record<string, any>; // 元数据
}

/**
 * 智能缓存管理器
 */
export class IntelligentCacheManager {
  private cache: Map<string, CacheItem<any>> = new Map();
  private configs: Map<string, CacheConfig> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // 每5分钟清理一次过期缓存
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredCache();
    }, 5 * 60 * 1000);
  }

  /**
   * 设置服务的缓存配置
   */
  setServiceConfig(service: string, config: CacheConfig): void {
    this.configs.set(service, config);
  }

  /**
   * 获取服务的缓存配置
   */
  getServiceConfig(service: string): CacheConfig | undefined {
    return this.configs.get(service);
  }

  /**
   * 设置缓存项
   */
  set<T>(service: string, key: string, data: T): void {
    const config = this.configs.get(service);
    if (!config || !config.enabled) {
      return;
    }

    const fullKey = `${service}:${key}`;
    const now = Date.now();
    const expiry = now + (config.ttl * 1000);

    // 如果缓存已满，执行LRU淘汰
    if (this.cache.size >= config.maxSize) {
      this.evictLRUItem(service);
    }

    this.cache.set(fullKey, {
      data,
      expiry,
      lastAccessed: now,
      accessCount: 0
    });
  }

  /**
   * 获取缓存项
   */
  get<T>(service: string, key: string): T | null {
    const config = this.configs.get(service);
    if (!config || !config.enabled) {
      return null;
    }

    const fullKey = `${service}:${key}`;
    const item = this.cache.get(fullKey);
    const now = Date.now();

    if (!item) {
      return null;
    }

    // 检查是否过期
    if (now > item.expiry) {
      // 如果启用了过期刷新，返回过期数据并异步刷新
      if (config.staleWhileRevalidate) {
        // 注意：实际应用中这里应该有一个回调来刷新缓存
        console.log(`缓存已过期但返回：${fullKey}`);
        return item.data as T;
      }
      // 否则删除过期缓存
      this.cache.delete(fullKey);
      return null;
    }

    // 更新访问信息
    item.lastAccessed = now;
    item.accessCount++;

    // 如果启用了滑动过期，更新过期时间
    if (config.slidingExpiration) {
      item.expiry = now + (config.ttl * 1000);
    }

    return item.data as T;
  }

  /**
   * 删除缓存项
   */
  delete(service: string, key: string): void {
    const fullKey = `${service}:${key}`;
    this.cache.delete(fullKey);
  }

  /**
   * 清理指定服务的所有缓存
   */
  clearServiceCache(service: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${service}:`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 清理所有缓存
   */
  clearAllCache(): void {
    this.cache.clear();
  }

  /**
   * 清理过期缓存
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 执行LRU淘汰策略
   */
  private evictLRUItem(service: string): void {
    let leastRecentlyUsedKey: string | null = null;
    let oldestAccessTime = Infinity;

    for (const [key, item] of this.cache.entries()) {
      if (key.startsWith(`${service}:`) && item.lastAccessed < oldestAccessTime) {
        oldestAccessTime = item.lastAccessed;
        leastRecentlyUsedKey = key;
      }
    }

    if (leastRecentlyUsedKey) {
      this.cache.delete(leastRecentlyUsedKey);
    }
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(service?: string): {
    totalItems: number;
    itemsByService: Record<string, number>;
  } {
    const itemsByService: Record<string, number> = {};
    let totalItems = 0;

    for (const key of this.cache.keys()) {
      const serviceName = key.split(':')[0];
      if (!service || serviceName === service) {
        itemsByService[serviceName] = (itemsByService[serviceName] || 0) + 1;
        totalItems++;
      }
    }

    return {
      totalItems,
      itemsByService
    };
  }

  /**
   * 销毁缓存管理器
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
    this.configs.clear();
  }
}

/**
 * 创建全局智能缓存管理器实例
 */
export const intelligentCache = new IntelligentCacheManager();

/**
 * 初始化默认服务的缓存配置
 */
export function initializeDefaultCacheConfigs(): void {
  // 天气服务：数据更新频繁，ttl较短
  intelligentCache.setServiceConfig('weather', {
    ttl: 300, // 5分钟
    maxSize: 100,
    enabled: true,
    slidingExpiration: true,
    staleWhileRevalidate: true
  });

  // 新闻服务：数据更新较快，ttl适中
  intelligentCache.setServiceConfig('news', {
    ttl: 1800, // 30分钟
    maxSize: 50,
    enabled: true,
    slidingExpiration: true
  });

  // 汇率服务：数据相对稳定，ttl较长
  intelligentCache.setServiceConfig('currency', {
    ttl: 3600, // 1小时
    maxSize: 30,
    enabled: true
  });

  // IP信息服务：数据相对稳定，ttl长
  intelligentCache.setServiceConfig('ipinfo', {
    ttl: 86400, // 24小时
    maxSize: 200,
    enabled: true
  });

  // 股票服务：数据更新频繁，ttl短但启用过期刷新
  intelligentCache.setServiceConfig('stock', {
    ttl: 60, // 1分钟
    maxSize: 100,
    enabled: true,
    staleWhileRevalidate: true
  });

  // 翻译服务：结果稳定，ttl长
  intelligentCache.setServiceConfig('translate', {
    ttl: 604800, // 7天
    maxSize: 500,
    enabled: true
  });
}