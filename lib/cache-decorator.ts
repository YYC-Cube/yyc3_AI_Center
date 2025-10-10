import { getFromCache, setToCache } from "./cache-manager";

/**
 * 缓存装饰器选项
 */
interface CacheOptions {
  service: string;
  keyGenerator?: (args: any[]) => Record<string, any>;
  skipCache?: (args: any[]) => boolean;
  onCacheHit?: (data: any) => void;
  onCacheMiss?: () => void;
}

/**
 * 创建带缓存的API函数
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  originalFunction: T,
  options: CacheOptions,
): T {
  return (async (...args: any[]) => {
    const { service, keyGenerator, skipCache, onCacheHit, onCacheMiss } =
      options;

    // 检查是否跳过缓存
    if (skipCache && skipCache(args)) {
      return await originalFunction(...args);
    }

    // 生成缓存键参数
    const cacheParams = keyGenerator
      ? keyGenerator(args)
      : { args: JSON.stringify(args) };

    try {
      // 尝试从缓存获取
      const cachedResult = await getFromCache(service, cacheParams);

      if (cachedResult !== null) {
        onCacheHit?.(cachedResult);
        return cachedResult;
      }

      // 缓存未命中，调用原函数
      onCacheMiss?.();
      const result = await originalFunction(...args);

      // 将结果存入缓存
      if (result && typeof result === "object" && result.success) {
        await setToCache(service, cacheParams, result);
      }

      return result;
    } catch (error) {
      console.error(`Cache decorator error for ${service}:`, error);
      // 出错时直接调用原函数
      return await originalFunction(...args);
    }
  }) as T;
}

/**
 * 预定义的键生成器
 */
export const keyGenerators = {
  weather: (args: any[]) => ({ city: args[0] }),
  news: (args: any[]) => ({ category: args[0] }),
  ipinfo: (args: any[]) => ({ ip: args[0] }),
  currency: (args: any[]) => ({ from: args[0], to: args[1], amount: args[2] }),
};

/**
 * 预定义的跳过缓存条件
 */
export const skipCacheConditions = {
  // 对于实时性要求很高的请求跳过缓存
  realtime: () => false,

  // 对于错误的输入跳过缓存
  invalidInput: (args: any[]) => {
    return args.some(
      (arg) => !arg || (typeof arg === "string" && arg.trim().length === 0),
    );
  },
};
