/**
 * 重试配置
 */
export interface RetryConfig {
  maxRetries: number; // 最大重试次数
  initialDelay: number; // 初始延迟（毫秒）
  maxDelay: number; // 最大延迟（毫秒）
  factor: number; // 退避因子
  statusCodesToRetry: number[]; // 需要重试的HTTP状态码
  retryableErrors: string[]; // 可重试的错误类型
}

/**
 * 默认重试配置
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 300,
  maxDelay: 3000,
  factor: 2,
  statusCodesToRetry: [408, 429, 500, 502, 503, 504],
  retryableErrors: ["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED"],
};

/**
 * 计算重试延迟时间（指数退避策略）
 * @param retryCount 当前重试次数
 * @param config 重试配置
 * @returns 延迟时间（毫秒）
 */
export function calculateBackoff(
  retryCount: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): number {
  // 指数退避算法: initialDelay * (factor ^ retryCount)
  const delay = config.initialDelay * Math.pow(config.factor, retryCount);

  // 添加随机抖动，避免多个请求同时重试
  const jitter = Math.random() * 0.3 * delay;

  // 确保不超过最大延迟
  return Math.min(delay + jitter, config.maxDelay);
}

/**
 * 判断是否应该重试请求
 * @param error 错误对象或HTTP状态码
 * @param config 重试配置
 * @returns 是否应该重试
 */
export function shouldRetry(
  error: any,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): boolean {
  // 如果是HTTP错误响应
  if (typeof error === "number") {
    return config.statusCodesToRetry.includes(error);
  }

  // 如果是网络错误
  if (error && error.code) {
    return config.retryableErrors.includes(error.code);
  }

  // 如果是AbortError，不重试
  if (error && error.name === "AbortError") {
    return false;
  }

  return false;
}

/**
 * 执行带重试的异步操作
 * @param operation 要执行的异步操作
 * @param config 重试配置
 * @returns 操作结果
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): Promise<T> {
  let lastError: any;

  for (let retryCount = 0; retryCount <= config.maxRetries; retryCount++) {
    try {
      // 首次尝试或重试
      return await operation();
    } catch (error: any) {
      lastError = error;

      // 判断是否应该重试
      if (
        retryCount >= config.maxRetries ||
        !shouldRetry(error.status || error)
      ) {
        break;
      }

      // 计算延迟时间
      const delay = calculateBackoff(retryCount, config);

      // 记录重试信息
      console.log(
        `Retry ${retryCount + 1}/${config.maxRetries} after ${delay}ms due to:`,
        error,
      );

      // 等待后重试
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // 所有重试都失败了，抛出最后一个错误
  throw lastError;
}

/**
 * 创建带重试功能的fetch函数
 * @param config 重试配置
 * @returns 增强的fetch函数
 */
export function createRetryableFetch(
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
) {
  return async function retryableFetch(
    url: string,
    options?: RequestInit,
  ): Promise<Response> {
    return withRetry(async () => {
      const response = await fetch(url, options);

      // 检查状态码，如果是需要重试的状态码，抛出错误
      if (config.statusCodesToRetry.includes(response.status)) {
        throw {
          status: response.status,
          message: `HTTP error ${response.status}`,
        };
      }

      return response;
    }, config);
  };
}
