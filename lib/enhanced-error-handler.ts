/**
 * 增强错误处理工具 - 提供更友好的错误处理和用户体验
 */

import { ErrorType } from "./error-handler";
import { ServiceHealth, serviceDegradation } from "./service-degradation";

// 错误消息模板
interface ErrorMessageTemplate {
  title: string;
  message: string;
  suggestion: string;
  code: string;
  httpStatus: number;
}

// 用户友好的错误消息
const USER_FRIENDLY_ERRORS: Record<ErrorType, ErrorMessageTemplate> = {
  [ErrorType.VALIDATION_ERROR]: {
    title: "输入参数有误",
    message: "您提供的参数格式不正确或缺少必要信息",
    suggestion: "请检查输入参数并重试",
    code: "INVALID_INPUT",
    httpStatus: 400,
  },
  [ErrorType.AUTHENTICATION_ERROR]: {
    title: "身份验证失败",
    message: "无法验证您的身份或访问令牌已过期",
    suggestion: "请重新登录后再试",
    code: "AUTH_FAILED",
    httpStatus: 401,
  },
  [ErrorType.AUTHORIZATION_ERROR]: {
    title: "权限不足",
    message: "您没有执行此操作的权限",
    suggestion: "请联系管理员获取必要权限",
    code: "PERMISSION_DENIED",
    httpStatus: 403,
  },
  [ErrorType.NOT_FOUND_ERROR]: {
    title: "资源不存在",
    message: "您请求的资源不存在或已被移除",
    suggestion: "请检查资源标识符是否正确",
    code: "RESOURCE_NOT_FOUND",
    httpStatus: 404,
  },
  [ErrorType.RATE_LIMIT_ERROR]: {
    title: "请求频率过高",
    message: "您的请求频率超出了系统限制",
    suggestion: "请稍后再试或减少请求频率",
    code: "RATE_LIMITED",
    httpStatus: 429,
  },
  [ErrorType.API_ERROR]: {
    title: "API服务异常",
    message: "外部API服务返回错误或无响应",
    suggestion: "请稍后再试，如问题持续存在请联系客服",
    code: "API_ERROR",
    httpStatus: 502,
  },
  [ErrorType.DATABASE_ERROR]: {
    title: "数据服务异常",
    message: "数据库操作失败或超时",
    suggestion: "请稍后再试，我们正在努力修复此问题",
    code: "DATABASE_ERROR",
    httpStatus: 500,
  },
  [ErrorType.NETWORK_ERROR]: {
    title: "网络连接异常",
    message: "与服务器的网络连接中断或超时",
    suggestion: "请检查您的网络连接并重试",
    code: "NETWORK_ERROR",
    httpStatus: 503,
  },
  [ErrorType.SERVER_ERROR]: {
    title: "服务器内部错误",
    message: "服务器处理请求时发生内部错误",
    suggestion: "请稍后再试，我们的技术团队正在处理此问题",
    code: "SERVER_ERROR",
    httpStatus: 500,
  },
  [ErrorType.RESOURCE_ERROR]: {
    title: "资源访问异常",
    message: "无法访问所需的系统资源",
    suggestion: "请稍后再试，如问题持续存在请联系客服",
    code: "RESOURCE_ERROR",
    httpStatus: 500,
  },
  [ErrorType.UNKNOWN_ERROR]: {
    title: "未知错误",
    message: "处理您的请求时发生未知错误",
    suggestion: "请稍后再试，如问题持续存在请联系客服",
    code: "UNKNOWN_ERROR",
    httpStatus: 500,
  },
};

// 服务降级错误消息
const DEGRADED_SERVICE_MESSAGES: Record<ServiceHealth, ErrorMessageTemplate> = {
  [ServiceHealth.HEALTHY]: {
    title: "服务正常",
    message: "服务运行正常",
    suggestion: "",
    code: "SERVICE_HEALTHY",
    httpStatus: 200,
  },
  [ServiceHealth.DEGRADED]: {
    title: "服务部分可用",
    message: "该服务当前处于降级状态，部分功能可能不可用",
    suggestion: "您可以继续使用基本功能，我们正在努力恢复完整服务",
    code: "SERVICE_DEGRADED",
    httpStatus: 200,
  },
  [ServiceHealth.CRITICAL]: {
    title: "服务严重受限",
    message: "该服务当前处于严重受限状态，仅核心功能可用",
    suggestion: "请仅使用必要功能，我们正在紧急修复中",
    code: "SERVICE_CRITICAL",
    httpStatus: 503,
  },
  [ServiceHealth.UNAVAILABLE]: {
    title: "服务暂时不可用",
    message: "该服务当前不可用",
    suggestion: "请稍后再试，我们正在全力恢复服务",
    code: "SERVICE_UNAVAILABLE",
    httpStatus: 503,
  },
};

/**
 * 生成用户友好的错误响应
 */
export function createUserFriendlyError(
  errorType: ErrorType,
  originalError?: Error,
  details?: Record<string, any>,
): {
  error: ErrorMessageTemplate;
  details?: Record<string, any>;
  originalMessage?: string;
} {
  const errorTemplate =
    USER_FRIENDLY_ERRORS[errorType] ||
    USER_FRIENDLY_ERRORS[ErrorType.UNKNOWN_ERROR];

  return {
    error: errorTemplate,
    details,
    originalMessage: originalError?.message,
  };
}

/**
 * 检查服务健康状态并生成适当的响应
 */
export function checkServiceHealth(service: string): {
  isHealthy: boolean;
  status: ServiceHealth;
  message?: ErrorMessageTemplate;
} {
  const health = serviceDegradation.getServiceHealth(service);

  if (health === ServiceHealth.HEALTHY) {
    return { isHealthy: true, status: health };
  }

  return {
    isHealthy: false,
    status: health,
    message: DEGRADED_SERVICE_MESSAGES[health],
  };
}

/**
 * 增强的API错误处理
 */
export function handleApiError(
  service: string,
  error: any,
): { status: number; body: Record<string, any> } {
  // 确定错误类型
  let errorType = ErrorType.UNKNOWN_ERROR;
  if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
    errorType = ErrorType.NETWORK_ERROR;
  } else if (error.response) {
    const status = error.response.status;
    if (status === 400) errorType = ErrorType.VALIDATION_ERROR;
    else if (status === 401) errorType = ErrorType.AUTHENTICATION_ERROR;
    else if (status === 403) errorType = ErrorType.AUTHORIZATION_ERROR;
    else if (status === 404) errorType = ErrorType.NOT_FOUND_ERROR;
    else if (status === 429) errorType = ErrorType.RATE_LIMIT_ERROR;
    else if (status >= 500) errorType = ErrorType.API_ERROR;
  } else if (error.message?.includes("rate limit")) {
    errorType = ErrorType.RATE_LIMIT_ERROR;
  } else if (error.message?.includes("validation")) {
    errorType = ErrorType.VALIDATION_ERROR;
  }

  // 记录错误到服务降级系统
  serviceDegradation.recordError(service, errorType);

  // 创建用户友好的错误响应
  const friendlyError = createUserFriendlyError(errorType, error, {
    service,
    timestamp: new Date().toISOString(),
  });

  // 检查服务健康状态
  const healthCheck = checkServiceHealth(service);
  if (!healthCheck.isHealthy && healthCheck.message) {
    // 如果服务已降级，返回降级消息
    return {
      status: healthCheck.message.httpStatus,
      body: {
        error: healthCheck.message,
        serviceStatus: healthCheck.status,
      },
    };
  }

  // 返回友好错误
  return {
    status: friendlyError.error.httpStatus,
    body: friendlyError,
  };
}

/**
 * 生成错误响应
 */
export function generateErrorResponse(
  service: string,
  errorType: ErrorType,
  details?: Record<string, any>,
): { status: number; body: Record<string, any> } {
  const friendlyError = createUserFriendlyError(errorType, undefined, details);

  return {
    status: friendlyError.error.httpStatus,
    body: friendlyError,
  };
}
