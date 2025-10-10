/**
 * 优化的API路由处理工具 - 提供统一的API路由处理模式
 */

import type { NextRequest, NextResponse } from "next/server";
import {
  handleApiError,
  generateErrorResponse,
  type ErrorType,
} from "./enhanced-error-handler";
import { enhancedRecordAPICall } from "./enhanced-api-monitor";
import { checkServiceHealth } from "./enhanced-error-handler";

// API处理选项
interface ApiHandlerOptions {
  service: string;
  rateLimit?: {
    limit: number;
    windowMs: number;
  };
  validation?: (body: any) => { valid: boolean; error?: string };
  cacheEnabled?: boolean;
  errorMapping?: Record<string, ErrorType>;
}

// 默认API处理选项
const DEFAULT_API_OPTIONS: Partial<ApiHandlerOptions> = {
  rateLimit: {
    limit: 100,
    windowMs: 60 * 1000, // 1分钟
  },
  cacheEnabled: true,
};

/**
 * 创建优化的API处理函数
 */
export function createOptimizedApiHandler<T>(
  service: string,
  handler: (params: any) => Promise<T>,
  options?: Partial<ApiHandlerOptions>,
): (request: NextRequest) => Promise<NextResponse> {
  // 合并选项
  const mergedOptions: ApiHandlerOptions = {
    service,
    ...DEFAULT_API_OPTIONS,
    ...options,
  };

  return async (request: NextRequest) => {
    const startTime = Date.now();
    const requestMethod = request.method;
    const requestUrl = request.url;
    const userAgent = request.headers.get("user-agent") || undefined;
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      undefined;

    try {
      // 1. 检查服务健康状态
      const healthCheck = checkServiceHealth(service);
      if (!healthCheck.isHealthy && healthCheck.message) {
        enhancedRecordAPICall(
          service,
          requestUrl,
          requestMethod,
          healthCheck.message.httpStatus,
          Date.now() - startTime,
        );
        return generateErrorResponse(
          healthCheck.message.message,
          healthCheck.message.httpStatus,
        );
      }
    } catch (error: any) {
      // 5. 统一错误处理
      return handleApiError(
        error,
        service,
        requestUrl,
        requestMethod,
        startTime,
      );
    }
  };
}
