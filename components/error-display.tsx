"use client";

import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  XCircle,
  CheckCircle,
  RefreshCw,
  HelpCircle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ErrorDisplayProps {
  title?: string;
  message: string;
  code?: string;
  suggestion?: string;
  retryable?: boolean;
  onRetry?: () => void;
  severity?: "critical" | "high" | "medium" | "low" | "info";
  className?: string;
  expanded?: boolean;
}

export function ErrorDisplay({
  title,
  message,
  code,
  suggestion,
  retryable = false,
  onRetry,
  severity = "medium",
  className = "",
  expanded = false,
}: ErrorDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);

  // 根据严重程度选择图标和颜色
  const getIconAndColor = () => {
    switch (severity) {
      case "critical":
        return {
          icon: <XCircle className="h-5 w-5" />,
          color: "bg-red-500/10 text-red-500 border-red-500/20",
          iconColor: "text-red-500",
          title: title || "严重错误",
        };
      case "high":
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          color: "bg-orange-500/10 text-orange-500 border-orange-500/20",
          iconColor: "text-orange-500",
          title: title || "错误",
        };
      case "medium":
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
          iconColor: "text-yellow-500",
          title: title || "警告",
        };
      case "low":
        return {
          icon: <Info className="h-5 w-5" />,
          color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
          iconColor: "text-blue-500",
          title: title || "提示",
        };
      case "info":
        return {
          icon: <Info className="h-5 w-5" />,
          color: "bg-green-500/10 text-green-500 border-green-500/20",
          iconColor: "text-green-500",
          title: title || "信息",
        };
      default:
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
          iconColor: "text-yellow-500",
          title: title || "警告",
        };
    }
  };

  const { icon, color, iconColor, title: defaultTitle } = getIconAndColor();

  // 简单版本的错误提示
  if (!suggestion && !code) {
    return (
      <Alert className={`${color} ${className}`}>
        {icon}
        <AlertTitle>{title || defaultTitle}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
        {retryable && onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-2 bg-white/20 hover:bg-white/30 border-white/20"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            重试
          </Button>
        )}
      </Alert>
    );
  }

  // 详细版本的错误提示
  return (
    <Card className={`${color} border shadow-sm ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-lg">{title || defaultTitle}</CardTitle>
          </div>
          {code && <div className="text-sm opacity-70">错误代码: {code}</div>}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base font-medium mb-2">
          {message}
        </CardDescription>

        {suggestion && (
          <Collapsible
            open={isExpanded}
            onOpenChange={setIsExpanded}
            className="mt-2"
          >
            <div className="flex items-center">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0 h-auto">
                  <HelpCircle className="h-4 w-4 mr-1" />
                  <span>{isExpanded ? "隐藏建议" : "查看建议"}</span>
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="mt-2 space-y-2">
              <div className="rounded-md bg-white/10 p-3 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="font-medium">解决建议</span>
                </div>
                <p>{suggestion}</p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
      {retryable && onRetry && (
        <CardFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="bg-white/20 hover:bg-white/30 border-white/20"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            重试
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
