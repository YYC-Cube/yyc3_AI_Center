import { NextResponse } from "next/server"
import { type APIError, ErrorType, formatErrorResponse, handleError } from "@/lib/error-handler"
import { errorLogger } from "@/lib/error-logger"
import { serviceDegradation } from "@/lib/service-degradation"
import { generateRequestId } from "@/lib/utils"

// API错误处理中间件
export async function withErrorHandling(
  request: Request,
  handler: () => Promise<Response>,
  serviceName: string,
): Promise<Response> {
  const requestId = generateRequestId()
  const url = new URL(request.url)
  const path = url.pathname

  try {
    // 检查服务健康状态
    const serviceHealth = serviceDegradation.getServiceHealth(serviceName)
    if (serviceHealth === "UNAVAILABLE") {
      const error = {
        type: ErrorType.SERVICE_ERROR,
        code: "SERVICE_UNAVAILABLE",
        message: `${serviceName}服务暂时不可用，请稍后重试`,
        source: "SERVER",
        severity: "HIGH",
        timestamp: Date.now(),
        requestId,
        path,
        retryable: true,
        retryAfter: 60,
        suggestion: "服务当前处于维护状态或遇到技术问题，请稍后重试。",
      } as APIError

      errorLogger.logError(error, {
        userAgent: request.headers.get("user-agent") || undefined,
        ip: request.headers.get("x-forwarded-for") || undefined,
      })

      return NextResponse.json(formatErrorResponse(error), { status: 503 })
    }

    // 执行原始处理程序
    return await handler()
  } catch (error) {
    // 处理错误
    const apiError = handleError(error)

    // 添加请求信息
    apiError.requestId = requestId
    apiError.path = path

    // 记录错误
    errorLogger.logError(apiError, {
      userAgent: request.headers.get("user-agent") || undefined,
      ip: request.headers.get("x-forwarded-for") || undefined,
    })

    // 记录服务错误
    serviceDegradation.recordError(serviceName, apiError.type)

    // 返回格式化的错误响应
    const statusCode =
      apiError.type === ErrorType.RATE_LIMIT_ERROR
        ? 429
        : apiError.type === ErrorType.VALIDATION_ERROR
          ? 400
          : apiError.type === ErrorType.AUTHENTICATION_ERROR
            ? 401
            : apiError.type === ErrorType.AUTHORIZATION_ERROR
              ? 403
              : apiError.type === ErrorType.NOT_FOUND_ERROR
                ? 404
                : 500

    const response = NextResponse.json(formatErrorResponse(apiError), { status: statusCode })

    // 如果是限流错误，添加Retry-After头
    if (apiError.type === ErrorType.RATE_LIMIT_ERROR && apiError.retryAfter) {
      response.headers.set("Retry-After", apiError.retryAfter.toString())
    }

    return response
  }
}
