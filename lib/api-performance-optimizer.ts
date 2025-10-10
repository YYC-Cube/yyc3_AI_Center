/**
 * API性能优化工具 - 针对现有API服务进行性能优化
 */

import { recordAPICall } from "./api-monitor";
import { getFromCache, setToCache } from "./cache-manager";

// 性能优化配置
export interface PerformanceConfig {
  enableCompression: boolean; // 是否启用响应压缩
  enableStreamingResponse: boolean; // 是否启用流式响应
  enableBatchProcessing: boolean; // 是否启用批处理
  enablePrefetching: boolean; // 是否启用预取
  enableResponseSizeOptimization: boolean; // 是否启用响应大小优化
  compressionThreshold: number; // 压缩阈值（字节）
  maxBatchSize: number; // 最大批处理大小
  prefetchProbability: number; // 预取概率
}

// 默认性能配置
export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  enableCompression: true,
  enableStreamingResponse: false,
  enableBatchProcessing: true,
  enablePrefetching: true,
  enableResponseSizeOptimization: true,
  compressionThreshold: 1024, // 1KB
  maxBatchSize: 10,
  prefetchProbability: 0.3, // 30%的概率预取
};

// 服务特定配置
export const SERVICE_PERFORMANCE_CONFIGS: Record<
  string,
  Partial<PerformanceConfig>
> = {
  weather: {
    enablePrefetching: true,
    prefetchProbability: 0.5, // 天气服务预取概率更高
  },
  news: {
    enableResponseSizeOptimization: true,
    enableStreamingResponse: true, // 新闻服务启用流式响应
  },
  translate: {
    enableCompression: true,
    compressionThreshold: 512, // 翻译服务压缩阈值更低
  },
};

/**
 * 获取服务性能配置
 */
export function getServicePerformanceConfig(
  service: string,
): PerformanceConfig {
  return {
    ...DEFAULT_PERFORMANCE_CONFIG,
    ...(SERVICE_PERFORMANCE_CONFIGS[service] || {}),
  };
}

/**
 * 压缩响应数据
 */
export function compressResponseData(
  data: any,
  config: PerformanceConfig,
): any {
  if (!config.enableCompression) return data;

  try {
    const jsonString = JSON.stringify(data);
    if (jsonString.length < config.compressionThreshold) return data;

    // 在实际项目中，这里可以使用压缩算法
    // 这里我们只是模拟压缩过程
    return data;
  } catch (error) {
    console.error("压缩响应数据失败:", error);
    return data;
  }
}

/**
 * 优化响应大小
 */
export function optimizeResponseSize(
  data: any,
  config: PerformanceConfig,
): any {
  if (!config.enableResponseSizeOptimization) return data;

  try {
    // 移除不必要的字段
    if (Array.isArray(data)) {
      return data.map((item) => removeUnnecessaryFields(item));
    } else if (typeof data === "object" && data !== null) {
      return removeUnnecessaryFields(data);
    }
    return data;
  } catch (error) {
    console.error("优化响应大小失败:", error);
    return data;
  }
}

/**
 * 移除不必要的字段
 */
function removeUnnecessaryFields(
  obj: Record<string, any>,
): Record<string, any> {
  const result: Record<string, any> = {};
  const unnecessaryFields = ["_internal", "debug", "metadata", "raw"];

  for (const key in obj) {
    if (!unnecessaryFields.includes(key)) {
      result[key] = obj[key];
    }
  }

  return result;
}

/**
 * 预取相关数据
 */
export async function prefetchRelatedData(
  service: string,
  params: Record<string, any>,
): Promise<void> {
  const config = getServicePerformanceConfig(service);
  if (!config.enablePrefetching) return;

  try {
    // 只有一定概率会预取，避免过多无用请求
    if (Math.random() > config.prefetchProbability) return;

    // 根据服务类型预取不同的相关数据
    switch (service) {
      case "weather":
        // 预取周边城市天气
        if (params.city) {
          const nearbyCities = getNearbyLocations(params.city);
          for (const city of nearbyCities) {
            // 异步预取，不等待结果
            getFromCache("weather", { city }).catch(() => {
              // 缓存未命中时，实际项目中这里会调用API
              console.log(`预取${city}天气数据`);
            });
          }
        }
        break;
      case "news":
        // 预取相关分类新闻
        if (params.category) {
          const relatedCategories = getRelatedCategories(params.category);
          for (const category of relatedCategories) {
            getFromCache("news", { category }).catch(() => {
              console.log(`预取${category}新闻数据`);
            });
          }
        }
        break;
    }
  } catch (error) {
    console.error("预取相关数据失败:", error);
  }
}

/**
 * 获取周边位置
 */
function getNearbyLocations(city: string): string[] {
  const cityMap: Record<string, string[]> = {
    北京: ["天津", "石家庄", "张家口"],
    上海: ["苏州", "杭州", "南京"],
    广州: ["深圳", "佛山", "东莞"],
    成都: ["重庆", "绵阳", "德阳"],
  };

  return cityMap[city] || [];
}

/**
 * 获取相关分类
 */
function getRelatedCategories(category: string): string[] {
  const categoryMap: Record<string, string[]> = {
    technology: ["science", "business"],
    business: ["economy", "finance"],
    sports: ["health", "entertainment"],
    politics: ["world", "national"],
  };

  return categoryMap[category] || [];
}

/**
 * 批处理请求
 */
export async function batchProcess<T>(
  service: string,
  batchParams: Record<string, any>[],
  processFn: (params: Record<string, any>) => Promise<T>,
): Promise<T[]> {
  const config = getServicePerformanceConfig(service);
  if (!config.enableBatchProcessing || batchParams.length <= 1) {
    // 不启用批处理或只有一个请求时，直接处理
    return Promise.all(batchParams.map(processFn));
  }

  try {
    // 分批处理
    const batches: Record<string, any>[][] = [];
    for (let i = 0; i < batchParams.length; i += config.maxBatchSize) {
      batches.push(batchParams.slice(i, i + config.maxBatchSize));
    }

    const results: T[] = [];
    for (const batch of batches) {
      const batchResults = await Promise.all(batch.map(processFn));
      results.push(...batchResults);
    }

    return results;
  } catch (error) {
    console.error("批处理请求失败:", error);
    // 回退到单个处理
    return Promise.all(batchParams.map(processFn));
  }
}

/**
 * 性能增强的API处理器
 */
export async function enhancedApiHandler<T>(
  service: string,
  params: Record<string, any>,
  apiFn: (params: Record<string, any>) => Promise<T>,
): Promise<T> {
  const startTime = Date.now();
  const config = getServicePerformanceConfig(service);

  try {
    // 1. 尝试从缓存获取
    const cachedData = await getFromCache<T>(service, params);
    if (cachedData) {
      recordAPICall(
        service,
        `/api/${service}`,
        "POST",
        200,
        Date.now() - startTime,
        { cacheHit: true },
      );
      return cachedData;
    }

    // 2. 预取相关数据
    prefetchRelatedData(service, params).catch(() => {
      // 预取失败不影响主流程
    });

    // 3. 调用API函数
    const data = await apiFn(params);

    // 4. 优化响应大小
    const optimizedData = optimizeResponseSize(data, config);

    // 5. 压缩响应数据
    const compressedData = compressResponseData(optimizedData, config);

    // 6. 存入缓存
    setToCache(service, params, compressedData).catch(() => {
      // 缓存失败不影响主流程
    });

    // 7. 记录API调用
    recordAPICall(
      service,
      `/api/${service}`,
      "POST",
      200,
      Date.now() - startTime,
      { cacheHit: false },
    );

    return optimizedData;
  } catch (error) {
    // 记录错误
    recordAPICall(
      service,
      `/api/${service}`,
      "POST",
      500,
      Date.now() - startTime,
      {
        error: error instanceof Error ? error.message : String(error),
      },
    );
    throw error;
  }
}
