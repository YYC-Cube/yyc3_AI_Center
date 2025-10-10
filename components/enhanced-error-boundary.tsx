"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorDisplay } from "./error-display";
import { Button } from "@/components/ui/card";
import { RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // 调用可选的错误处理回调
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 这里可以添加错误上报逻辑
    console.error("组件错误:", error, errorInfo);
  }

  componentDidUpdate(prevProps: Props): void {
    // 如果设置了resetOnPropsChange并且props发生变化，重置错误状态
    if (
      this.props.resetOnPropsChange &&
      this.state.hasError &&
      prevProps.children !== this.props.children
    ) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，则使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误UI
      return (
        <div className="p-4 flex flex-col items-center justify-center min-h-[200px]">
          <ErrorDisplay
            title="组件渲染错误"
            message={this.state.error?.message || "渲染过程中发生错误"}
            suggestion="这可能是由于数据格式错误或组件代码问题导致的。请尝试刷新页面或返回首页。"
            severity="high"
            className="max-w-md mx-auto mb-4"
          />

          <div className="flex gap-4 mt-4">
            <Button
              onClick={this.resetErrorBoundary}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              重试
            </Button>
            <Button
              onClick={() => (window.location.href = "/")}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              返回首页
            </Button>
          </div>

          {process.env.NODE_ENV !== "production" && this.state.errorInfo && (
            <details className="mt-4 p-4 bg-gray-800 rounded-md text-white text-sm overflow-auto max-w-full">
              <summary className="cursor-pointer mb-2">
                错误详情（仅开发环境可见）
              </summary>
              <pre>{this.state.error?.toString()}</pre>
              <pre>{this.state.errorInfo.componentStack}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
