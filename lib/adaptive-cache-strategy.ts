/**
 * 自适应缓存策略 - 根据访问模式和数据特性动态调整缓存策略
 */

import { CACHE_CONFIGS } from "./cache-manager";

// 缓存使用统计
interface CacheUsageStats {
  hits: number;
  misses: number;
  lastAccess: number;
  accessPattern: number[]; // 最近10次访问的时间间隔
  averageAccessInterval: number;
  volatility: number; // 数据波动性评分 (0-1)
}

// 缓存键使用统计
const keyUsageStats: Record<string, Record<string, CacheUsageStats>> = {};

// 初始化服务缓存统计
for (const service in CACHE_CONFIGS) {
  keyUsageStats[service] = {};
}

/**
 * 记录缓存访问
 */
export function recordCacheAccess(
  service: string,
  key: string,
  hit: boolean,
  dataChanged = false,
): void {
  if (!keyUsageStats[service]) {
    keyUsageStats[service] = {};
  }

  if (!keyUsageStats[service][key]) {
    keyUsageStats[service][key] = {
      hits: 0,
      misses: 0,
      lastAccess: Date.now(),
      accessPattern: [],
      averageAccessInterval: 0,
      volatility: 0,
    };
  }

  const stats = keyUsageStats[service][key];
  const now = Date.now();

  // 更新命中/未命中计数
  if (hit) {
    stats.hits++;
  } else {
    stats.misses++;
  }

  // 更新访问模式
  if (stats.lastAccess > 0) {
    const interval = now - stats.lastAccess;
    stats.accessPattern.push(interval);
    if (stats.accessPattern.length > 10) {
      stats.accessPattern.shift();
    }
  }

  // 更新平均访问间隔
  if (stats.accessPattern.length > 0) {
    stats.averageAccessInterval =
      stats.accessPattern.reduce((sum, interval) => sum + interval, 0) /
      stats.accessPattern.length;
  }

  // 如果数据发生变化，更新波动性评分
  if (dataChanged) {
    // 简单的波动性计算：最近变化次数/总访问次数
    const totalAccesses = stats.hits + stats.misses;
    stats.volatility = Math.min(1, (stats.misses + 1) / (totalAccesses + 1));
  }

  // 更新最后访问时间
  stats.lastAccess = now;
}

/**
 * 获取推荐的缓存TTL
 */
export function getRecommendedTTL(service: string, key: string): number {
  const defaultTTL = CACHE_CONFIGS[service]?.ttl || 300; // 默认5分钟

  if (!keyUsageStats[service] || !keyUsageStats[service][key]) {
    return defaultTTL;
  }

  const stats = keyUsageStats[service][key];
  const totalAccesses = stats.hits + stats.misses;

  // 如果访问次数太少，使用默认TTL
  if (totalAccesses < 5) {
    return defaultTTL;
  }

  // 计算命中率
  const hitRate = stats.hits / totalAccesses;

  // 基于访问模式和数据波动性计算推荐TTL
  let recommendedTTL = defaultTTL;

  // 1. 基于访问频率调整
  if (stats.averageAccessInterval > 0) {
    // 将平均访问间隔作为基础，但不超过默认TTL的5倍
    recommendedTTL = Math.min(
      stats.averageAccessInterval * 0.8,
      defaultTTL * 5,
    );
  }

  // 2. 基于数据波动性调整
  if (stats.volatility > 0.7) {
    // 高波动性数据，减少TTL
    recommendedTTL *= 0.5;
  } else if (stats.volatility < 0.3) {
    // 低波动性数据，增加TTL
    recommendedTTL *= 1.5;
  }

  // 3. 基于命中率调整
  if (hitRate > 0.8) {
    // 高命中率，可以增加TTL
    recommendedTTL *= 1.2;
  } else if (hitRate < 0.4) {
    // 低命中率，减少TTL
    recommendedTTL *= 0.8;
  }

  // 确保TTL在合理范围内
  const minTTL = 60; // 最小1分钟
  const maxTTL = defaultTTL * 10; // 最大是默认值的10倍
  return Math.max(minTTL, Math.min(maxTTL, Math.round(recommendedTTL)));
}

/**
 * 获取缓存优先级
 * 返回0-10的优先级分数，10为最高优先级
 */
export function getCachePriority(service: string, key: string): number {
  if (!keyUsageStats[service] || !keyUsageStats[service][key]) {
    return 5; // 默认中等优先级
  }

  const stats = keyUsageStats[service][key];
  const totalAccesses = stats.hits + stats.misses;

  // 如果访问次数太少，使用默认优先级
  if (totalAccesses < 5) {
    return 5;
  }

  // 计算基础优先级分数
  let priority = 5;

  // 1. 基于访问频率
  if (stats.averageAccessInterval > 0) {
    // 访问间隔越短，优先级越高
    const frequencyScore = Math.min(
      5,
      5 * (3600000 / stats.averageAccessInterval),
    );
    priority += frequencyScore;
  }

  // 2. 基于命中率
  const hitRate = stats.hits / totalAccesses;
  if (hitRate > 0.8) {
    priority += 2;
  } else if (hitRate < 0.4) {
    priority -= 2;
  }

  // 3. 基于最近访问时间
  const timeSinceLastAccess = Date.now() - stats.lastAccess;
  if (timeSinceLastAccess < 3600000) {
    // 1小时内
    priority += 1;
  } else if (timeSinceLastAccess > 86400000) {
    // 1天以上
    priority -= 2;
  }

  // 确保优先级在0-10范围内
  return Math.max(0, Math.min(10, Math.round(priority)));
}

/**
 * 分析缓存使用模式并提供优化建议
 */
export function analyzeCacheUsage(service: string): {
  hotKeys: string[];
  coldKeys: string[];
  volatileKeys: string[];
  stableKeys: string[];
  recommendations: string[];
} {
  const serviceStats = keyUsageStats[service] || {};
  const keys = Object.keys(serviceStats);

  if (keys.length === 0) {
    return {
      hotKeys: [],
      coldKeys: [],
      volatileKeys: [],
      stableKeys: [],
      recommendations: ["没有足够的缓存使用数据进行分析"],
    };
  }

  // 按访问频率排序
  const sortedByFrequency = [...keys].sort((a, b) => {
    const aFreq = serviceStats[a].hits + serviceStats[a].misses;
    const bFreq = serviceStats[b].hits + serviceStats[b].misses;
    return bFreq - aFreq;
  });

  // 按波动性排序
  const sortedByVolatility = [...keys].sort((a, b) => {
    return serviceStats[b].volatility - serviceStats[a].volatility;
  });

  // 热门键（访问频率前20%）
  const hotKeysCount = Math.max(1, Math.ceil(keys.length * 0.2));
  const hotKeys = sortedByFrequency.slice(0, hotKeysCount);

  // 冷门键（访问频率后20%）
  const coldKeys = sortedByFrequency.slice(-hotKeysCount);

  // 波动性高的键（波动性前20%）
  const volatileKeysCount = Math.max(1, Math.ceil(keys.length * 0.2));
  const volatileKeys = sortedByVolatility.slice(0, volatileKeysCount);

  // 稳定的键（波动性后20%）
  const stableKeys = sortedByVolatility.slice(-volatileKeysCount);

  // 生成建议
  const recommendations: string[] = [];

  // 1. 热门键建议
  if (hotKeys.length > 0) {
    const hotKeysTTLs = hotKeys.map((key) => {
      const currentTTL = CACHE_CONFIGS[service]?.ttl || 300;
      const recommendedTTL = getRecommendedTTL(service, key);
      return { key, currentTTL, recommendedTTL };
    });

    const increaseTTLKeys = hotKeysTTLs.filter(
      (k) => k.recommendedTTL > k.currentTTL * 1.5,
    );
    if (increaseTTLKeys.length > 0) {
      recommendations.push(
        `增加热门键的TTL: ${increaseTTLKeys.map((k) => k.key).join(", ")}`,
      );
    }
  }

  // 2. 波动性键建议
  if (volatileKeys.length > 0) {
    recommendations.push(`减少波动性高的键的TTL: ${volatileKeys.join(", ")}`);
  }

  // 3. 稳定键建议
  if (stableKeys.length > 0) {
    recommendations.push(`增加稳定键的TTL: ${stableKeys.join(", ")}`);
  }

  // 4. 整体建议
  const avgHitRate =
    keys.reduce((sum, key) => {
      const stats = serviceStats[key];
      const totalAccesses = stats.hits + stats.misses;
      return sum + (totalAccesses > 0 ? stats.hits / totalAccesses : 0);
    }, 0) / keys.length;

  if (avgHitRate < 0.5) {
    recommendations.push(
      `${service}服务整体命中率较低(${(avgHitRate * 100).toFixed(1)}%)，考虑调整缓存策略`,
    );
  } else if (avgHitRate > 0.8) {
    recommendations.push(
      `${service}服务整体命中率良好(${(avgHitRate * 100).toFixed(1)}%)，可以考虑增加缓存容量`,
    );
  }

  return {
    hotKeys,
    coldKeys,
    volatileKeys,
    stableKeys,
    recommendations,
  };
}

/**
 * 应用自适应缓存策略
 */
export function applyAdaptiveCacheStrategy(): void {
  console.log("应用自适应缓存策略...");

  for (const service in CACHE_CONFIGS) {
    const analysis = analyzeCacheUsage(service);

    console.log(`服务 ${service} 缓存分析:`);
    console.log(`- 热门键: ${analysis.hotKeys.length}个`);
    console.log(`- 冷门键: ${analysis.coldKeys.length}个`);
    console.log(`- 波动性高的键: ${analysis.volatileKeys.length}个`);
    console.log(`- 稳定的键: ${analysis.stableKeys.length}个`);

    if (analysis.recommendations.length > 0) {
      console.log("优化建议:");
      analysis.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
    }
  }
}

// 定期应用自适应缓存策略
setInterval(applyAdaptiveCacheStrategy, 30 * 60 * 1000); // 每30分钟
