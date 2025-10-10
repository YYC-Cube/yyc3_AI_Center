import { type NextRequest, NextResponse } from "next/server";
import type { Redis } from "@upstash/redis";

// 创建Redis客户端实例（如果使用Upstash Redis）
// 在实际部署时，需要配置环境变量
let redis: Redis | null = null;

// 内存缓存，用于开发环境或Redis不可用时
const inMemoryStore: Record<string, { count: number; resetTime: number }> = {};

// 限流配置
type RateLimitConfig = {
  maxRequests: number; // 最大请求数
  windowMs: number; // 时间窗口（毫秒）
  keyPrefix: string; // 键前缀
};

// 默认限流配置
const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 50, // 默认每个窗口50次请求
  windowMs: 60 * 1000, // 默认1分钟窗口
  keyPrefix: "ratelimit:",
};

// API服务特定配置
const API_CONFIGS: Record<string, RateLimitConfig> = {
  weather: {
    maxRequests: 30,
    windowMs: 60 * 1000,
    keyPrefix: "ratelimit:weather:",
  },
  news: {
    maxRequests: 20,
    windowMs: 60 * 1000,
    keyPrefix: "ratelimit:news:",
  },
  ipinfo: {
    maxRequests: 40,
    windowMs: 60 * 1000,
    keyPrefix: "ratelimit:ipinfo:",
  },
  currency: {
    maxRequests: 30,
    windowMs: 60 * 1000,
    keyPrefix: "ratelimit:currency:",
  },
};

/**
 * 获取请求的唯一标识符
 * @param req 请求对象
 * @param service API服务名称
 * @returns 唯一标识符
 */
function getRateLimitKey(req: NextRequest, service: string): string {
  // 优先使用API密钥作为标识符
  const apiKey = req.headers.get("x-api-key") || "";

  // 如果没有API密钥，则使用IP地址
  const ip = req.ip || req.headers.get("x-forwarded-for") || "unknown";

  const config = API_CONFIGS[service] || DEFAULT_CONFIG;
  return `${config.keyPrefix}${apiKey || ip}`;
}

/**
 * 检查请求是否超过限制
 * @param key 限流键
 * @param config 限流配置
 * @returns 是否允许请求和剩余限制信息
 */
async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
}> {
  const now = Date.now();
  const windowStart = Math.floor(now / config.windowMs) * config.windowMs;
  const resetTime = windowStart + config.windowMs;

  try {
    // 尝试使用Redis
    if (redis) {
      const multi = redis.multi();
      multi.incr(key);
      multi.pexpire(key, config.windowMs);

      const [count] = await multi.exec();
      const remaining = Math.max(0, config.maxRequests - (count as number));

      return {
        allowed: (count as number) <= config.maxRequests,
        remaining,
        resetTime,
      };
    }
    // 回退到内存存储
    else {
      if (!inMemoryStore[key] || inMemoryStore[key].resetTime < now) {
        inMemoryStore[key] = { count: 1, resetTime };
        return { allowed: true, remaining: config.maxRequests - 1, resetTime };
      }

      inMemoryStore[key].count += 1;
      const remaining = Math.max(
        0,
        config.maxRequests - inMemoryStore[key].count,
      );

      return {
        allowed: inMemoryStore[key].count <= config.maxRequests,
        remaining,
        resetTime: inMemoryStore[key].resetTime,
      };
    }
  } catch (error) {
    console.error("Rate limit check error:", error);
    // 出错时允许请求通过，避免阻塞服务
    return { allowed: true, remaining: 0, resetTime: now + config.windowMs };
  }
}

/**
 * API请求限流中间件
 * @param req 请求对象
 * @param service API服务名称
 * @returns 响应对象或undefined（允许继续处理）
 */
export async function rateLimiter(
  req: NextRequest,
  service: string,
): Promise<NextResponse | undefined> {
  const config = API_CONFIGS[service] || DEFAULT_CONFIG;
  const key = getRateLimitKey(req, service);

  const { allowed, remaining, resetTime } = await checkRateLimit(key, config);

  // 设置响应头
  const headers = new Headers();
  headers.set("X-RateLimit-Limit", config.maxRequests.toString());
  headers.set("X-RateLimit-Remaining", remaining.toString());
  headers.set("X-RateLimit-Reset", resetTime.toString());

  // 如果超过限制，返回429错误
  if (!allowed) {
    return new NextResponse(
      JSON.stringify({
        error: "请求过于频繁，请稍后再试",
        code: "RATE_LIMIT_EXCEEDED",
        service,
        retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": Math.ceil((resetTime - Date.now()) / 1000).toString(),
          ...Object.fromEntries(headers.entries()),
        },
      },
    );
  }

  // 允许请求继续处理
  return undefined;
}

/**
 * 初始化Redis客户端
 * 在应用启动时调用
 */
export function initRateLimiter() {
  try {
    // 检查环境变量
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;

    if (url && token) {
      // 动态导入以避免服务器端渲染问题
      import("@upstash/redis")
        .then(({ Redis }) => {
          redis = new Redis({
            url,
            token,
          });
          console.log("Redis rate limiter initialized");
        })
        .catch((err) => {
          console.error("Failed to initialize Redis:", err);
        });
    } else {
      console.log("Using in-memory rate limiter (Redis not configured)");
    }
  } catch (error) {
    console.error("Rate limiter initialization error:", error);
  }
}
