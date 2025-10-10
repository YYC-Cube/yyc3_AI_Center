// API服务函数 - 客户端调用 - 扩展版本

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  retryAfter?: number;
}

// 添加请求中断控制器
let weatherController: AbortController | null = null;
let newsController: AbortController | null = null;
let ipController: AbortController | null = null;
let currencyController: AbortController | null = null;
let stockController: AbortController | null = null;
let geocodeController: AbortController | null = null;
let translateController: AbortController | null = null;
let qrcodeController: AbortController | null = null;

// 智能重试配置接口
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  shouldRetry: (status: number) => boolean;
  jitterFactor: number;
  timeout: number;
}

// 客户端智能重试配置
const CLIENT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3, // 增加最大重试次数
  initialDelay: 500,
  maxDelay: 10000, // 最大延迟10秒
  shouldRetry: (status: number) =>
    [408, 429, 500, 502, 503, 504].includes(status),
  jitterFactor: 0.2, // 20%的抖动因子
  timeout: 30000, // 30秒超时
};

/**
 * 生成带抖动的延迟时间
 */
function getJitteredDelay(baseDelay: number, jitterFactor: number, maxDelay: number): number {
  const jitter = Math.random() * 2 * jitterFactor - jitterFactor; // -jitterFactor 到 +jitterFactor
  const delay = baseDelay * (1 + jitter);
  return Math.min(delay, maxDelay); // 不超过最大延迟
}

/**
 * 根据错误类型确定是否应该重试
 */
function shouldRetryError(error: any): boolean {
  // 网络错误、连接超时等可以重试
  return !error.status || 
         (error.status >= 500 && error.status < 600) || 
         error.status === 429 || 
         error.status === 408;
}

/**
 * 带智能重试功能的API请求函数
 */
async function fetchWithRetry<T>(
  url: string,
  options: RequestInit,
  signal: AbortSignal,
  retryConfig: Partial<RetryConfig> = {},
): Promise<T> {
  const config = { ...CLIENT_RETRY_CONFIG, ...retryConfig };
  let retries = 0;

  // 创建一个新的AbortController，用于处理超时
  const timeoutController = new AbortController();
  const combinedSignal = AbortSignal.any([signal, timeoutController.signal]);
  let timeoutId: NodeJS.Timeout;

  try {
    while (true) {
      try {
        // 设置超时
        timeoutId = setTimeout(() => {
          timeoutController.abort(new Error('Request timeout'));
        }, config.timeout);

        const response = await fetch(url, {
          ...options,
          signal: combinedSignal,
        });

        clearTimeout(timeoutId);

        // 如果是429状态码，获取Retry-After头
        if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");
          let waitTime = retryAfter
            ? Number.parseInt(retryAfter, 10) * 1000
            : config.initialDelay;

          if (retries < config.maxRetries) {
            retries++;
            // 对限流错误使用更长的延迟
            waitTime = Math.max(waitTime, config.initialDelay * Math.pow(2, retries - 1));
            const jitteredWaitTime = getJitteredDelay(waitTime, config.jitterFactor, config.maxDelay);
            console.log(
              `请求限流，${Math.round(jitteredWaitTime)}ms后重试 (${retries}/${config.maxRetries})...`,
            );
            await new Promise((resolve) => setTimeout(resolve, jitteredWaitTime));
            continue;
          }
        }

        // 检查其他需要重试的状态码
        if (
          config.shouldRetry(response.status) &&
          retries < config.maxRetries
        ) {
          retries++;
          const baseDelay = config.initialDelay * Math.pow(2, retries - 1);
          const jitteredDelay = getJitteredDelay(baseDelay, config.jitterFactor, config.maxDelay);
          console.log(
            `请求失败(${response.status})，${Math.round(jitteredDelay)}ms后重试 (${retries}/${config.maxRetries})...`,
          );
          await new Promise((resolve) => setTimeout(resolve, jitteredDelay));
          continue;
        }

        // 解析JSON响应
        let result: any;
        try {
          result = await response.json();
        } catch (jsonError) {
          // 处理非JSON响应
          const text = await response.text();
          throw {
            status: response.status,
            message: 'Invalid JSON response',
            responseText: text
          };
        }

        if (response.ok) {
          // 记录成功的请求统计
          recordApiRequestMetrics(url, response.status, retries);
          return result as T;
        } else {
          throw {
            status: response.status,
            ...result,
          };
        }
      } catch (error) {
        clearTimeout(timeoutId);
        
        // 如果是中断错误，直接抛出
        if (error instanceof DOMException && error.name === "AbortError") {
          throw error;
        }

        // 如果达到最大重试次数，抛出错误
        if (retries >= config.maxRetries || !shouldRetryError(error)) {
          // 记录失败的请求统计
          recordApiRequestMetrics(url, error.status || 0, retries, true);
          throw error;
        }

        // 其他错误尝试重试
        retries++;
        const baseDelay = config.initialDelay * Math.pow(2, retries - 1);
        const jitteredDelay = getJitteredDelay(baseDelay, config.jitterFactor, config.maxDelay);
      console.log(
          `请求异常，${Math.round(jitteredDelay)}ms后重试 (${retries}/${config.maxRetries})...`,
        );
        await new Promise((resolve) => setTimeout(resolve, jitteredDelay));
        continue;
      }
    }
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * API请求指标记录函数
 */
function recordApiRequestMetrics(
  url: string,
  statusCode: number,
  retryCount: number,
  isError = false
): void {
  try {
    // 提取服务类型（从URL路径中）
    let serviceType = 'unknown';
    if (url.includes('weather')) serviceType = 'weather';
    else if (url.includes('news')) serviceType = 'news';
    else if (url.includes('currency')) serviceType = 'currency';
    else if (url.includes('ipinfo')) serviceType = 'ipinfo';
    else if (url.includes('stock')) serviceType = 'stock';
    else if (url.includes('translate')) serviceType = 'translate';
    else if (url.includes('qrcode')) serviceType = 'qrcode';
    
    // 生成指标数据
    const metricData = {
      timestamp: Date.now(),
      serviceType,
      statusCode,
      retryCount,
      isError,
      url: url.split('?')[0] // 移除查询参数
    };
    
    // 在实际应用中，这里应该将指标发送到监控系统
    // 例如：sendToMonitoringSystem(metricData);
    console.log('API Request Metrics:', metricData);
    
    // 存储到localStorage用于前端监控展示
    if (typeof window !== 'undefined') {
      try {
        const metrics = JSON.parse(localStorage.getItem('apiMetrics') || '[]');
        metrics.push(metricData);
        // 只保留最近100条记录
        if (metrics.length > 100) {
          metrics.shift();
        }
        localStorage.setItem('apiMetrics', JSON.stringify(metrics));
      } catch (localStorageError) {
        // 忽略localStorage错误
        console.error('Failed to store API metrics in localStorage:', localStorageError);
      }
    }
  } catch (error) {
    // 确保指标记录不会影响主流程
    console.error('Failed to record API metrics:', error);
  }
}

// 天气查询服务
export async function fetchWeather(city: string): Promise<APIResponse<string>> {
  try {
    // 取消之前的请求
    if (weatherController) {
      weatherController.abort();
    }

    // 创建新的控制器
    weatherController = new AbortController();

    // 输入验证
    if (!city || city.trim().length === 0) {
      return {
        success: false,
        error: "请输入有效的城市名称",
        code: "INVALID_INPUT",
      };
    }

    // 城市名称长度验证
    if (city.trim().length > 50) {
      return {
        success: false,
        error: "城市名称过长，请输入有效的城市名称",
        code: "INVALID_INPUT",
      };
    }

    const result = await fetchWithRetry<{
      data?: string;
      error?: string;
      code?: string;
      demo?: boolean;
    }>(
      "/api/weather",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ city: city.trim() }),
      },
      weatherController.signal,
    );

    return { success: true, data: result.data, demo: result.demo };
  } catch (error: any) {
    // 检查是否是中断错误
    if (error instanceof DOMException && error.name === "AbortError") {
      return { success: false, error: "请求已取消", code: "REQUEST_ABORTED" };
    }

    console.error("Weather fetch error:", error);

    // 处理限流错误
    if (error.status === 429) {
      return {
        success: false,
        error: "请求过于频繁，请稍后重试",
        code: "RATE_LIMITED",
        retryAfter: error.retryAfter || 60,
      };
    }

    // 网络错误处理
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return {
        success: false,
        error: "网络连接失败，请检查网络连接",
        code: "NETWORK_ERROR",
      };
    }

    // 处理API返回的错误
    if (error.error && error.code) {
      return {
        success: false,
        error: error.error,
        code: error.code,
      };
    }

    return {
      success: false,
      error: "网络连接错误，请稍后重试",
      code: "UNKNOWN_ERROR",
    };
  } finally {
    // 清理控制器
    weatherController = null;
  }
}

// 新闻查询服务
export async function fetchNews(
  category: string,
): Promise<APIResponse<string>> {
  try {
    // 取消之前的请求
    if (newsController) {
      newsController.abort();
    }

    // 创建新的控制器
    newsController = new AbortController();

    const result = await fetchWithRetry<{
      data?: string;
      error?: string;
      code?: string;
      demo?: boolean;
    }>(
      "/api/news",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ category }),
      },
      newsController.signal,
    );

    return { success: true, data: result.data, demo: result.demo };
  } catch (error: any) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { success: false, error: "请求已取消", code: "REQUEST_ABORTED" };
    }

    if (error.status === 429) {
      return {
        success: false,
        error: "请求过于频繁，请稍后重试",
        code: "RATE_LIMITED",
        retryAfter: error.retryAfter || 60,
      };
    }

    return { success: false, error: "网络连接错误", code: "NETWORK_ERROR" };
  } finally {
    newsController = null;
  }
}

// IP查询服务
export async function fetchIPInfo(ip: string): Promise<APIResponse<string>> {
  try {
    // 取消之前的请求
    if (ipController) {
      ipController.abort();
    }

    // 创建新的控制器
    ipController = new AbortController();

    const result = await fetchWithRetry<{
      data?: string;
      error?: string;
      code?: string;
      demo?: boolean;
    }>(
      "/api/ipinfo",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ip }),
      },
      ipController.signal,
    );

    return { success: true, data: result.data, demo: result.demo };
  } catch (error: any) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { success: false, error: "请求已取消", code: "REQUEST_ABORTED" };
    }

    if (error.status === 429) {
      return {
        success: false,
        error: "请求过于频繁，请稍后重试",
        code: "RATE_LIMITED",
        retryAfter: error.retryAfter || 60,
      };
    }

    return { success: false, error: "网络连接错误", code: "NETWORK_ERROR" };
  } finally {
    ipController = null;
  }
}

// 汇率转换服务
export async function fetchCurrency(
  from: string,
  to: string,
  amount: number,
): Promise<APIResponse<string>> {
  try {
    // 取消之前的请求
    if (currencyController) {
      currencyController.abort();
    }

    // 创建新的控制器
    currencyController = new AbortController();

    const result = await fetchWithRetry<{
      data?: string;
      error?: string;
      code?: string;
      demo?: boolean;
    }>(
      "/api/currency",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to, amount }),
      },
      currencyController.signal,
    );

    return { success: true, data: result.data, demo: result.demo };
  } catch (error: any) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { success: false, error: "请求已取消", code: "REQUEST_ABORTED" };
    }

    if (error.status === 429) {
      return {
        success: false,
        error: "请求过于频繁，请稍后重试",
        code: "RATE_LIMITED",
        retryAfter: error.retryAfter || 60,
      };
    }

    return { success: false, error: "网络连接错误", code: "NETWORK_ERROR" };
  } finally {
    currencyController = null;
  }
}

// 股票查询服务
export async function fetchStock(symbol: string): Promise<APIResponse<string>> {
  try {
    // 取消之前的请求
    if (stockController) {
      stockController.abort();
    }

    // 创建新的控制器
    stockController = new AbortController();

    // 输入验证
    if (!symbol || symbol.trim().length === 0) {
      return {
        success: false,
        error: "请输入有效的股票代码",
        code: "INVALID_INPUT",
      };
    }

    const result = await fetchWithRetry<{
      data?: string;
      error?: string;
      code?: string;
      demo?: boolean;
    }>(
      "/api/stock",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symbol: symbol.trim() }),
      },
      stockController.signal,
    );

    return { success: true, data: result.data, demo: result.demo };
  } catch (error: any) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { success: false, error: "请求已取消", code: "REQUEST_ABORTED" };
    }

    if (error.status === 429) {
      return {
        success: false,
        error: "请求过于频繁，请稍后重试",
        code: "RATE_LIMITED",
        retryAfter: error.retryAfter || 60,
      };
    }

    return { success: false, error: "网络连接错误", code: "NETWORK_ERROR" };
  } finally {
    stockController = null;
  }
}

// 地理编码服务
export async function fetchGeocode(
  address: string,
): Promise<APIResponse<string>> {
  try {
    // 取消之前的请求
    if (geocodeController) {
      geocodeController.abort();
    }

    // 创建新的控制器
    geocodeController = new AbortController();

    // 输入验证
    if (!address || address.trim().length === 0) {
      return {
        success: false,
        error: "请输入有效的地址",
        code: "INVALID_INPUT",
      };
    }

    const result = await fetchWithRetry<{
      data?: string;
      error?: string;
      code?: string;
      demo?: boolean;
    }>(
      "/api/geocode",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address: address.trim() }),
      },
      geocodeController.signal,
    );

    return { success: true, data: result.data, demo: result.demo };
  } catch (error: any) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { success: false, error: "请求已取消", code: "REQUEST_ABORTED" };
    }

    if (error.status === 429) {
      return {
        success: false,
        error: "请求过于频繁，请稍后重试",
        code: "RATE_LIMITED",
        retryAfter: error.retryAfter || 60,
      };
    }

    return { success: false, error: "网络连接错误", code: "NETWORK_ERROR" };
  } finally {
    geocodeController = null;
  }
}

// 翻译服务
export async function fetchTranslation(
  text: string,
  sourceLang = "自动检测",
  targetLang = "英文",
): Promise<APIResponse<string>> {
  try {
    // 取消之前的请求
    if (translateController) {
      translateController.abort();
    }

    // 创建新的控制器
    translateController = new AbortController();

    // 输入验证
    if (!text || text.trim().length === 0) {
      return {
        success: false,
        error: "请输入要翻译的文本",
        code: "INVALID_INPUT",
      };
    }

    const result = await fetchWithRetry<{
      data?: string;
      error?: string;
      code?: string;
      demo?: boolean;
    }>(
      "/api/translate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text.trim(),
          sourceLang,
          targetLang,
        }),
      },
      translateController.signal,
    );

    return { success: true, data: result.data, demo: result.demo };
  } catch (error: any) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { success: false, error: "请求已取消", code: "REQUEST_ABORTED" };
    }

    if (error.status === 429) {
      return {
        success: false,
        error: "请求过于频繁，请稍后重试",
        code: "RATE_LIMITED",
        retryAfter: error.retryAfter || 60,
      };
    }

    return { success: false, error: "网络连接错误", code: "NETWORK_ERROR" };
  } finally {
    translateController = null;
  }
}

// 二维码生成服务
export async function generateQRCode(
  content: string,
  options: {
    format?: "svg" | "png" | "data-url";
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    color?: string;
    backgroundColor?: string;
    margin?: number;
    width?: number;
  } = {},
): Promise<
  APIResponse<{
    data: string;
    format: string;
    content: string;
    timestamp: string;
  }>
> {
  try {
    // 取消之前的请求
    if (qrcodeController) {
      qrcodeController.abort();
    }

    // 创建新的控制器
    qrcodeController = new AbortController();

    // 输入验证
    if (!content || content.trim().length === 0) {
      return {
        success: false,
        error: "请输入二维码内容",
        code: "INVALID_INPUT",
      };
    }

    const result = await fetchWithRetry<{
      data: string;
      format: string;
      content: string;
      timestamp: string;
      error?: string;
      code?: string;
    }>(
      "/api/qrcode",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim(),
          ...options,
        }),
      },
      qrcodeController.signal,
    );

    return { success: true, data: result };
  } catch (error: any) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { success: false, error: "请求已取消", code: "REQUEST_ABORTED" };
    }

    if (error.status === 429) {
      return {
        success: false,
        error: "请求过于频繁，请稍后重试",
        code: "RATE_LIMITED",
        retryAfter: error.retryAfter || 60,
      };
    }

    return { success: false, error: "网络连接错误", code: "NETWORK_ERROR" };
  } finally {
    qrcodeController = null;
  }
}

// 清理所有请求的函数
export function cancelAllRequests() {
  if (weatherController) {
    weatherController.abort();
    weatherController = null;
  }
  if (newsController) {
    newsController.abort();
    newsController = null;
  }
  if (ipController) {
    ipController.abort();
    ipController = null;
  }
  if (currencyController) {
    currencyController.abort();
    currencyController = null;
  }
  if (stockController) {
    stockController.abort();
    stockController = null;
  }
  if (geocodeController) {
    geocodeController.abort();
    geocodeController = null;
  }
  if (translateController) {
    translateController.abort();
    translateController = null;
  }
  if (qrcodeController) {
    qrcodeController.abort();
    qrcodeController = null;
  }
}
