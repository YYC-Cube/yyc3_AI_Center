/**
 * API错误处理系统 - 提供统一的错误分类、处理和响应机制
 */

// 错误类型定义
export enum ErrorType {
  // 客户端错误
  VALIDATION_ERROR = "VALIDATION_ERROR", // 输入验证错误
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR", // 认证错误
  AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR", // 授权错误
  RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR", // 请求限流错误
  REQUEST_ERROR = "REQUEST_ERROR", // 请求格式错误
  NOT_FOUND_ERROR = "NOT_FOUND_ERROR", // 资源不存在错误

  // 服务端错误
  SERVER_ERROR = "SERVER_ERROR", // 一般服务器错误
  DATABASE_ERROR = "DATABASE_ERROR", // 数据库错误
  CACHE_ERROR = "CACHE_ERROR", // 缓存错误
  EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR", // 外部API错误
  TIMEOUT_ERROR = "TIMEOUT_ERROR", // 超时错误
  RESOURCE_ERROR = "RESOURCE_ERROR", // 资源不足错误

  // 网络错误
  NETWORK_ERROR = "NETWORK_ERROR", // 网络连接错误
  DNS_ERROR = "DNS_ERROR", // DNS解析错误

  // 业务逻辑错误
  BUSINESS_ERROR = "BUSINESS_ERROR", // 业务逻辑错误

  // 未知错误
  UNKNOWN_ERROR = "UNKNOWN_ERROR", // 未分类错误
}

// 错误严重程度
export enum ErrorSeverity {
  LOW = "LOW", // 低严重性，不影响主要功能
  MEDIUM = "MEDIUM", // 中等严重性，影响部分功能
  HIGH = "HIGH", // 高严重性，影响关键功能
  CRITICAL = "CRITICAL", // 严重错误，系统不可用
}

// 错误来源
export enum ErrorSource {
  CLIENT = "CLIENT", // 客户端错误
  SERVER = "SERVER", // 服务器错误
  NETWORK = "NETWORK", // 网络错误
  EXTERNAL = "EXTERNAL", // 外部服务错误
  UNKNOWN = "UNKNOWN", // 未知来源
}

// API错误接口
export interface APIError {
  type: ErrorType; // 错误类型
  code: string; // 错误代码
  message: string; // 用户友好的错误消息
  detail?: string; // 详细错误信息（仅用于日志）
  source: ErrorSource; // 错误来源
  severity: ErrorSeverity; // 错误严重程度
  timestamp: number; // 错误发生时间
  requestId?: string; // 请求ID，用于跟踪
  path?: string; // 发生错误的API路径
  suggestion?: string; // 解决建议
  retryable: boolean; // 是否可重试
  retryAfter?: number; // 建议重试时间（秒）
}

// 创建API错误
export function createAPIError(
  type: ErrorType,
  code: string,
  message: string,
  options: Partial<
    Omit<APIError, "type" | "code" | "message" | "timestamp">
  > = {},
): APIError {
  // 根据错误类型推断错误来源和严重程度
  let source = options.source || ErrorSource.UNKNOWN;
  let severity = options.severity || ErrorSeverity.MEDIUM;

  if (!options.source) {
    switch (type) {
      case ErrorType.VALIDATION_ERROR:
      case ErrorType.AUTHENTICATION_ERROR:
      case ErrorType.AUTHORIZATION_ERROR:
      case ErrorType.REQUEST_ERROR:
        source = ErrorSource.CLIENT;
        break;
      case ErrorType.SERVER_ERROR:
      case ErrorType.DATABASE_ERROR:
      case ErrorType.CACHE_ERROR:
      case ErrorType.RESOURCE_ERROR:
        source = ErrorSource.SERVER;
        break;
      case ErrorType.EXTERNAL_API_ERROR:
        source = ErrorSource.EXTERNAL;
        break;
      case ErrorType.NETWORK_ERROR:
      case ErrorType.DNS_ERROR:
      case ErrorType.TIMEOUT_ERROR:
        source = ErrorSource.NETWORK;
        break;
    }
  }

  if (!options.severity) {
    switch (type) {
      case ErrorType.VALIDATION_ERROR:
      case ErrorType.REQUEST_ERROR:
      case ErrorType.RATE_LIMIT_ERROR:
        severity = ErrorSeverity.LOW;
        break;
      case ErrorType.AUTHENTICATION_ERROR:
      case ErrorType.AUTHORIZATION_ERROR:
      case ErrorType.NOT_FOUND_ERROR:
      case ErrorType.EXTERNAL_API_ERROR:
      case ErrorType.TIMEOUT_ERROR:
        severity = ErrorSeverity.MEDIUM;
        break;
      case ErrorType.SERVER_ERROR:
      case ErrorType.DATABASE_ERROR:
      case ErrorType.CACHE_ERROR:
      case ErrorType.NETWORK_ERROR:
        severity = ErrorSeverity.HIGH;
        break;
      case ErrorType.RESOURCE_ERROR:
        severity = ErrorSeverity.CRITICAL;
        break;
    }
  }

  // 确定是否可重试
  const retryable =
    options.retryable !== undefined
      ? options.retryable
      : [
          ErrorType.TIMEOUT_ERROR,
          ErrorType.NETWORK_ERROR,
          ErrorType.EXTERNAL_API_ERROR,
          ErrorType.RATE_LIMIT_ERROR,
          ErrorType.RESOURCE_ERROR,
        ].includes(type);

  return {
    type,
    code,
    message,
    source,
    severity,
    timestamp: Date.now(),
    retryable,
    ...options,
  };
}

// 获取HTTP状态码
export function getHttpStatusFromError(error: APIError): number {
  switch (error.type) {
    case ErrorType.VALIDATION_ERROR:
    case ErrorType.REQUEST_ERROR:
      return 400; // Bad Request
    case ErrorType.AUTHENTICATION_ERROR:
      return 401; // Unauthorized
    case ErrorType.AUTHORIZATION_ERROR:
      return 403; // Forbidden
    case ErrorType.NOT_FOUND_ERROR:
      return 404; // Not Found
    case ErrorType.RATE_LIMIT_ERROR:
      return 429; // Too Many Requests
    case ErrorType.TIMEOUT_ERROR:
      return 408; // Request Timeout
    case ErrorType.EXTERNAL_API_ERROR:
    case ErrorType.DATABASE_ERROR:
    case ErrorType.CACHE_ERROR:
    case ErrorType.SERVER_ERROR:
    case ErrorType.RESOURCE_ERROR:
      return 500; // Internal Server Error
    default:
      return 500;
  }
}

// 生成用户友好的错误消息
export function getUserFriendlyMessage(error: APIError): string {
  // 如果已经有用户友好的消息，直接返回
  if (error.message) {
    return error.message;
  }

  // 根据错误类型生成默认消息
  switch (error.type) {
    case ErrorType.VALIDATION_ERROR:
      return "输入数据无效，请检查您的输入并重试。";
    case ErrorType.AUTHENTICATION_ERROR:
      return "身份验证失败，请重新登录。";
    case ErrorType.AUTHORIZATION_ERROR:
      return "您没有权限执行此操作。";
    case ErrorType.RATE_LIMIT_ERROR:
      return `请求频率过高，请在${error.retryAfter || 60}秒后重试。`;
    case ErrorType.REQUEST_ERROR:
      return "请求格式错误，请检查您的输入。";
    case ErrorType.NOT_FOUND_ERROR:
      return "请求的资源不存在。";
    case ErrorType.SERVER_ERROR:
      return "服务器内部错误，请稍后重试。";
    case ErrorType.DATABASE_ERROR:
      return "数据库操作失败，请稍后重试。";
    case ErrorType.CACHE_ERROR:
      return "缓存服务暂时不可用，请稍后重试。";
    case ErrorType.EXTERNAL_API_ERROR:
      return "外部服务暂时不可用，请稍后重试。";
    case ErrorType.TIMEOUT_ERROR:
      return "请求超时，请稍后重试。";
    case ErrorType.RESOURCE_ERROR:
      return "系统资源不足，请稍后重试。";
    case ErrorType.NETWORK_ERROR:
      return "网络连接错误，请检查您的网络连接。";
    case ErrorType.DNS_ERROR:
      return "DNS解析错误，请检查您的网络设置。";
    case ErrorType.BUSINESS_ERROR:
      return "业务处理失败，请检查您的输入。";
    default:
      return "发生未知错误，请稍后重试。";
  }
}

// 生成解决建议
export function getSuggestion(error: APIError): string {
  // 如果已经有建议，直接返回
  if (error.suggestion) {
    return error.suggestion;
  }

  // 根据错误类型生成默认建议
  switch (error.type) {
    case ErrorType.VALIDATION_ERROR:
      return "请检查输入数据的格式和有效性，确保所有必填字段都已提供。";
    case ErrorType.AUTHENTICATION_ERROR:
      return "请尝试重新登录，或检查您的API密钥是否有效。";
    case ErrorType.AUTHORIZATION_ERROR:
      return "请联系管理员获取必要的权限，或使用具有适当权限的账户。";
    case ErrorType.RATE_LIMIT_ERROR:
      return `请减少请求频率，或在${error.retryAfter || 60}秒后重试。考虑实施请求缓存或批处理。`;
    case ErrorType.REQUEST_ERROR:
      return "请检查请求格式和参数，确保符合API要求。";
    case ErrorType.NOT_FOUND_ERROR:
      return "请验证资源ID或URL是否正确，确保请求的资源存在。";
    case ErrorType.SERVER_ERROR:
      return "这是服务器端的问题，请稍后重试。如果问题持续存在，请联系支持团队。";
    case ErrorType.DATABASE_ERROR:
      return "数据库操作失败，请稍后重试。如果问题持续存在，请联系支持团队。";
    case ErrorType.CACHE_ERROR:
      return "缓存服务暂时不可用，系统将尝试直接访问数据源。请稍后重试。";
    case ErrorType.EXTERNAL_API_ERROR:
      return "外部服务暂时不可用，请稍后重试。您可以检查服务状态页面获取更多信息。";
    case ErrorType.TIMEOUT_ERROR:
      return "请求处理时间过长，请稍后重试。考虑简化请求或分批处理数据。";
    case ErrorType.RESOURCE_ERROR:
      return "系统资源暂时不足，请稍后重试。如果问题持续存在，请联系支持团队。";
    case ErrorType.NETWORK_ERROR:
      return "请检查您的网络连接，确保能够访问服务器。尝试使用不同的网络连接。";
    case ErrorType.DNS_ERROR:
      return "DNS解析失败，请检查您的网络设置或联系网络管理员。";
    case ErrorType.BUSINESS_ERROR:
      return "请检查您的业务逻辑和输入数据，确保符合业务规则。";
    default:
      return "如果问题持续存在，请联系支持团队并提供错误代码。";
  }
}

// 错误响应格式化
export function formatErrorResponse(error: APIError) {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message || getUserFriendlyMessage(error),
      type: error.type,
      suggestion: error.suggestion || getSuggestion(error),
      retryable: error.retryable,
      retryAfter: error.retryAfter,
      timestamp: error.timestamp,
      requestId: error.requestId,
    },
  };
}

// 从各种错误类型创建API错误
export function handleError(
  error: unknown,
  defaultType = ErrorType.UNKNOWN_ERROR,
): APIError {
  // 如果已经是APIError，直接返回
  if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    "code" in error &&
    "message" in error
  ) {
    return error as APIError;
  }

  // 处理标准Error对象
  if (error instanceof Error) {
    // 尝试从错误消息中提取更多信息
    const errorMessage = error.message;

    // 检查是否是网络错误
    if (
      errorMessage.includes("network") ||
      errorMessage.includes("连接") ||
      errorMessage.includes("connection") ||
      error.name === "NetworkError"
    ) {
      return createAPIError(
        ErrorType.NETWORK_ERROR,
        "NETWORK_FAILURE",
        "网络连接错误，请检查您的网络连接",
        {
          detail: errorMessage,
        },
      );
    }

    // 检查是否是超时错误
    if (
      errorMessage.includes("timeout") ||
      errorMessage.includes("超时") ||
      error.name === "TimeoutError"
    ) {
      return createAPIError(
        ErrorType.TIMEOUT_ERROR,
        "REQUEST_TIMEOUT",
        "请求超时，请稍后重试",
        {
          detail: errorMessage,
          retryable: true,
        },
      );
    }

    // 检查是否是外部API错误
    if (
      errorMessage.includes("API") ||
      errorMessage.includes("api") ||
      error.name === "ApiError"
    ) {
      return createAPIError(
        ErrorType.EXTERNAL_API_ERROR,
        "EXTERNAL_API_FAILURE",
        "外部服务暂时不可用，请稍后重试",
        {
          detail: errorMessage,
          retryable: true,
        },
      );
    }

    // 默认作为服务器错误处理
    return createAPIError(
      defaultType,
      "INTERNAL_ERROR",
      "服务器内部错误，请稍后重试",
      { detail: errorMessage },
    );
  }

  // 处理字符串错误
  if (typeof error === "string") {
    return createAPIError(defaultType, "ERROR", error, { detail: error });
  }

  // 处理未知错误类型
  return createAPIError(
    ErrorType.UNKNOWN_ERROR,
    "UNKNOWN_ERROR",
    "发生未知错误，请稍后重试",
    {
      detail: JSON.stringify(error),
    },
  );
}
