import type { Redis } from "@upstash/redis";

// 缓存配置接口
export interface CacheConfig {
  ttl: number; // 生存时间（秒）
  maxSize?: number; // 最大缓存大小（内存缓存）
  prefix: string; // 缓存键前缀
  enableCompression?: boolean; // 是否启用压缩
  enableMetrics?: boolean; // 是否启用指标收集
}

// 缓存指标接口
export interface CacheMetrics {
  hits: number; // 命中次数
  misses: number; // 未命中次数
  sets: number; // 设置次数
  deletes: number; // 删除次数
  errors: number; // 错误次数
  totalSize: number; // 总大小
}

// 缓存项接口
interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number;
  compressed?: boolean;
  size: number;
}

// Redis客户端实例
let redis: Redis | null = null;

// 内存缓存存储
const memoryCache = new Map<string, CacheItem>();

// 缓存指标
const metrics: Record<string, CacheMetrics> = {};

// API服务缓存配置
export const CACHE_CONFIGS: Record<string, CacheConfig> = {
  weather: {
    ttl: 300, // 5分钟
    maxSize: 1000,
    prefix: "cache:weather:",
    enableCompression: true,
    enableMetrics: true,
  },
  news: {
    ttl: 600, // 10分钟
    maxSize: 500,
    prefix: "cache:news:",
    enableCompression: true,
    enableMetrics: true,
  },
  ipinfo: {
    ttl: 3600, // 1小时
    maxSize: 2000,
    prefix: "cache:ipinfo:",
    enableCompression: false,
    enableMetrics: true,
  },
  currency: {
    ttl: 180, // 3分钟
    maxSize: 800,
    prefix: "cache:currency:",
    enableCompression: true,
    enableMetrics: true,
  },
};

/**
 * 初始化缓存管理器
 */
export function initCacheManager() {
  try {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;

    if (url && token) {
      import("@upstash/redis")
        .then(({ Redis }) => {
          redis = new Redis({ url, token });
          console.log("Redis cache manager initialized");
        })
        .catch((err) => {
          console.error("Failed to initialize Redis cache:", err);
        });
    } else {
      console.log("Using in-memory cache (Redis not configured)");
    }

    // 初始化指标
    for (const service in CACHE_CONFIGS) {
      metrics[service] = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        errors: 0,
        totalSize: 0,
      };
    }

    // 启动清理任务
    startCleanupTask();
  } catch (error) {
    console.error("Cache manager initialization error:", error);
  }
}

/**
 * 压缩数据
 */
function compressData(data: string): string {
  try {
    // 简单的压缩实现（实际项目中可以使用更好的压缩算法）
    return btoa(data);
  } catch (error) {
    console.error("Compression error:", error);
    return data;
  }
}

/**
 * 解压数据
 */
function decompressData(data: string): string {
  try {
    return atob(data);
  } catch (error) {
    console.error("Decompression error:", error);
    return data;
  }
}

/**
 * 生成缓存键
 */
function generateCacheKey(
  service: string,
  params: Record<string, any>,
): string {
  const config = CACHE_CONFIGS[service];
  const paramString = JSON.stringify(params, Object.keys(params).sort());
  const hash = btoa(paramString)
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 16);
  return `${config.prefix}${hash}`;
}

/**
 * 计算数据大小（字节）
 */
function calculateSize(data: any): number {
  return new Blob([JSON.stringify(data)]).size;
}

/**
 * 更新缓存指标
 */
function updateMetrics(
  service: string,
  operation: keyof CacheMetrics,
  value = 1,
) {
  if (CACHE_CONFIGS[service]?.enableMetrics && metrics[service]) {
    if (operation === "totalSize") {
      metrics[service][operation] = value;
    } else {
      metrics[service][operation] += value;
    }
  }
}

/**
 * 从缓存获取数据
 */
export async function getFromCache<T>(
  service: string,
  params: Record<string, any>,
): Promise<T | null> {
  const config = CACHE_CONFIGS[service];
  if (!config) return null;

  const key = generateCacheKey(service, params);
  const now = Date.now();

  try {
    // 尝试从Redis获取
    if (redis) {
      const cached = await redis.get(key);
      if (cached) {
        const item = JSON.parse(cached as string) as CacheItem;

        // 检查是否过期
        if (now - item.timestamp < item.ttl * 1000) {
          updateMetrics(service, "hits");

          // 解压数据（如果需要）
          let data = item.data;
          if (item.compressed && typeof data === "string") {
            data = JSON.parse(decompressData(data));
          }

          return data as T;
        } else {
          // 过期数据，删除
          await redis.del(key);
        }
      }
    }
    // 从内存缓存获取
    else {
      const item = memoryCache.get(key);
      if (item && now - item.timestamp < item.ttl * 1000) {
        updateMetrics(service, "hits");

        // 解压数据（如果需要）
        let data = item.data;
        if (item.compressed && typeof data === "string") {
          data = JSON.parse(decompressData(data));
        }

        return data as T;
      } else if (item) {
        // 过期数据，删除
        memoryCache.delete(key);
        updateMetrics(
          service,
          "totalSize",
          metrics[service].totalSize - item.size,
        );
      }
    }

    updateMetrics(service, "misses");
    return null;
  } catch (error) {
    console.error("Cache get error:", error);
    updateMetrics(service, "errors");
    return null;
  }
}

/**
 * 设置缓存数据
 */
export async function setToCache(
  service: string,
  params: Record<string, any>,
  data: any,
): Promise<void> {
  const config = CACHE_CONFIGS[service];
  if (!config) return;

  const key = generateCacheKey(service, params);
  const now = Date.now();
  let processedData = data;

  try {
    // 压缩数据（如果启用）
    if (config.enableCompression) {
      const dataString = JSON.stringify(data);
      processedData = compressData(dataString);
    }

    const item: CacheItem = {
      data: processedData,
      timestamp: now,
      ttl: config.ttl,
      compressed: config.enableCompression,
      size: calculateSize(data),
    };

    // 设置到Redis
    if (redis) {
      await redis.setex(key, config.ttl, JSON.stringify(item));
    }
    // 设置到内存缓存
    else {
      // 检查内存缓存大小限制
      if (config.maxSize && memoryCache.size >= config.maxSize) {
        // 删除最旧的项目
        const oldestKey = memoryCache.keys().next().value;
        const oldestItem = memoryCache.get(oldestKey);
        if (oldestItem) {
          memoryCache.delete(oldestKey);
          updateMetrics(
            service,
            "totalSize",
            metrics[service].totalSize - oldestItem.size,
          );
        }
      }

      memoryCache.set(key, item);
      updateMetrics(
        service,
        "totalSize",
        metrics[service].totalSize + item.size,
      );
    }

    updateMetrics(service, "sets");
  } catch (error) {
    console.error("Cache set error:", error);
    updateMetrics(service, "errors");
  }
}

/**
 * 删除缓存数据
 */
export async function deleteFromCache(
  service: string,
  params: Record<string, any>,
): Promise<void> {
  const config = CACHE_CONFIGS[service];
  if (!config) return;

  const key = generateCacheKey(service, params);

  try {
    // 从Redis删除
    if (redis) {
      await redis.del(key);
    }
    // 从内存缓存删除
    else {
      const item = memoryCache.get(key);
      if (item) {
        memoryCache.delete(key);
        updateMetrics(
          service,
          "totalSize",
          metrics[service].totalSize - item.size,
        );
      }
    }

    updateMetrics(service, "deletes");
  } catch (error) {
    console.error("Cache delete error:", error);
    updateMetrics(service, "errors");
  }
}

/**
 * 清空服务缓存
 */
export async function clearServiceCache(service: string): Promise<void> {
  const config = CACHE_CONFIGS[service];
  if (!config) return;

  try {
    // 清空Redis缓存
    if (redis) {
      const keys = await redis.keys(`${config.prefix}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }
    // 清空内存缓存
    else {
      // 使用兼容的方式遍历Map
      const keysToDelete: string[] = [];
      memoryCache.forEach((item, key) => {
        if (key.startsWith(config.prefix)) {
          keysToDelete.push(key);
        }
      });
      
      // 删除匹配的键
      keysToDelete.forEach((key) => {
        const item = memoryCache.get(key);
        if (item) {
          memoryCache.delete(key);
          updateMetrics(
            service,
            "totalSize",
            metrics[service].totalSize - item.size,
          );
        }
      });
    }

    // 重置指标
    if (metrics[service]) {
      metrics[service] = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        errors: 0,
        totalSize: 0,
      };
    }
  } catch (error) {
    console.error("Cache clear error:", error);
  }
}

/**
 * 获取缓存指标
 */
export function getCacheMetrics(
  service?: string,
): Record<string, CacheMetrics> {
  if (service) {
    return { [service]: metrics[service] || ({} as CacheMetrics) };
  }
  return { ...metrics };
}

/**
 * 缓存预热
 */
export async function warmupCache(
  service: string,
  commonParams: Record<string, any>[],
): Promise<void> {
  console.log(`开始预热 ${service} 缓存...`);

  for (const params of commonParams) {
    try {
      // 检查缓存是否已存在
      const cached = await getFromCache(service, params);
      if (!cached) {
        // 这里需要调用实际的API来获取数据
        // 具体实现取决于服务类型
        console.log(`预热缓存参数:`, params);
      }
    } catch (error) {
      console.error(`缓存预热失败:`, params, error);
    }
  }

  console.log(`${service} 缓存预热完成`);
}

/**
 * 启动清理任务
 */
function startCleanupTask() {
  // 每5分钟清理一次过期的内存缓存
  setInterval(
    () => {
      const now = Date.now();

      // 使用兼容的方式遍历并清理过期缓存
      const keysToDelete: string[] = [];
      memoryCache.forEach((item, key) => {
        if (now - item.timestamp >= item.ttl * 1000) {
          keysToDelete.push(key);
        }
      });
      
      // 删除过期的键
      keysToDelete.forEach((key) => {
        const item = memoryCache.get(key);
        if (item) {
          memoryCache.delete(key);
          
          // 更新指标
          for (const service in CACHE_CONFIGS) {
            if (key.startsWith(CACHE_CONFIGS[service].prefix)) {
              updateMetrics(
                service,
                "totalSize",
                metrics[service].totalSize - item.size,
              );
              break;
            }
          }
        }
      });
    },
    5 * 60 * 1000,
  ); // 5分钟
}

/**
 * 获取缓存统计信息
 */
export function getCacheStats(): {
  memoryCache: {
    size: number;
    keys: number;
  };
  metrics: Record<string, CacheMetrics>;
} {
  return {
    memoryCache: {
      size: Array.from(memoryCache.values()).reduce(
        (total, item) => total + item.size,
        0,
      ),
      keys: memoryCache.size,
    },
    metrics: { ...metrics },
  };
}
