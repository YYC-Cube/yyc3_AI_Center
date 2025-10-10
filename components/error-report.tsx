"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Clock,
  FileText,
  RefreshCw,
  Search,
  TrendingUp,
  XCircle,
} from "lucide-react";

interface ErrorReport {
  timestamp: number;
  totalErrors: number;
  criticalErrors: number;
  highErrors: number;
  mediumErrors: number;
  lowErrors: number;
  topErrors: Array<{
    errorType: string;
    count: number;
    firstSeen: number;
    lastSeen: number;
    frequency: number;
    isIncreasing: boolean;
  }>;
  recommendations: string[];
}

interface ErrorLog {
  id: string;
  type: string;
  code: string;
  message: string;
  severity: string;
  timestamp: number;
  path?: string;
  userAgent?: string;
  ip?: string;
}

export function ErrorReport() {
  const [report, setReport] = useState<ErrorReport | null>(null);
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");

  // 获取错误报告
  const fetchErrorReport = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/errors/report");
      if (response.ok) {
        const data = await response.json();
        setReport(data);
      }
    } catch (error) {
      console.error("获取错误报告失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 获取错误日志
  const fetchErrorLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedSeverity !== "all") {
        params.append("severity", selectedSeverity);
      }
      params.append("limit", "50");

      const response = await fetch(`/api/errors/logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error("获取错误日志失败:", error);
    }
  };

  useEffect(() => {
    fetchErrorReport();
    fetchErrorLogs();
  }, [selectedSeverity]);

  // 格式化时间
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("zh-CN");
  };

  // 获取严重程度颜色
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "medium":
        return "bg-yellow-500 text-black";
      case "low":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  // 获取严重程度图标
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-4 w-4" />;
      case "high":
        return <AlertCircle className="h-4 w-4" />;
      case "medium":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>加载错误报告中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">错误报告与分析</h2>
          <p className="text-muted-foreground">系统错误监控和分析报告</p>
        </div>
        <Button onClick={fetchErrorReport} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新报告
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="trends">趋势分析</TabsTrigger>
          <TabsTrigger value="logs">错误日志</TabsTrigger>
          <TabsTrigger value="recommendations">建议</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {report && (
            <>
              {/* 错误统计概览 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      总错误数
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {report.totalErrors}
                    </div>
                    <p className="text-xs text-muted-foreground">过去24小时</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      严重错误
                    </CardTitle>
                    <XCircle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-500">
                      {report.criticalErrors}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      需要立即处理
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      高级错误
                    </CardTitle>
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-500">
                      {report.highErrors}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      影响关键功能
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      中级错误
                    </CardTitle>
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-500">
                      {report.mediumErrors}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      影响部分功能
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      低级错误
                    </CardTitle>
                    <AlertTriangle className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-500">
                      {report.lowErrors}
                    </div>
                    <p className="text-xs text-muted-foreground">轻微影响</p>
                  </CardContent>
                </Card>
              </div>

              {/* 错误分布 */}
              <Card>
                <CardHeader>
                  <CardTitle>错误严重程度分布</CardTitle>
                  <CardDescription>
                    过去24小时内各严重程度错误的分布情况
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>严重错误</span>
                      <span>
                        {report.criticalErrors} (
                        {(
                          (report.criticalErrors / report.totalErrors) *
                          100
                        ).toFixed(1)}
                        %)
                      </span>
                    </div>
                    <Progress
                      value={(report.criticalErrors / report.totalErrors) * 100}
                      className="h-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>高级错误</span>
                      <span>
                        {report.highErrors} (
                        {(
                          (report.highErrors / report.totalErrors) *
                          100
                        ).toFixed(1)}
                        %)
                      </span>
                    </div>
                    <Progress
                      value={(report.highErrors / report.totalErrors) * 100}
                      className="h-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>中级错误</span>
                      <span>
                        {report.mediumErrors} (
                        {(
                          (report.mediumErrors / report.totalErrors) *
                          100
                        ).toFixed(1)}
                        %)
                      </span>
                    </div>
                    <Progress
                      value={(report.mediumErrors / report.totalErrors) * 100}
                      className="h-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>低级错误</span>
                      <span>
                        {report.lowErrors} (
                        {(
                          (report.lowErrors / report.totalErrors) *
                          100
                        ).toFixed(1)}
                        %)
                      </span>
                    </div>
                    <Progress
                      value={(report.lowErrors / report.totalErrors) * 100}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          {report && report.topErrors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  错误趋势分析
                </CardTitle>
                <CardDescription>最常见的错误类型和趋势</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.topErrors.map((error, index) => (
                    <div
                      key={error.errorType}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold text-muted-foreground">
                          #{index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{error.errorType}</div>
                          <div className="text-sm text-muted-foreground">
                            首次出现: {formatTime(error.firstSeen)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            最后出现: {formatTime(error.lastSeen)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{error.count}</div>
                        <div className="text-sm text-muted-foreground">
                          {error.frequency.toFixed(1)}/小时
                        </div>
                        {error.isIncreasing && (
                          <Badge variant="destructive" className="mt-1">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            上升趋势
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span className="text-sm font-medium">筛选严重程度:</span>
            </div>
            <div className="flex gap-2">
              {["all", "critical", "high", "medium", "low"].map((severity) => (
                <Button
                  key={severity}
                  variant={
                    selectedSeverity === severity ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedSeverity(severity)}
                >
                  {severity === "all" ? "全部" : severity}
                </Button>
              ))}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                错误日志
              </CardTitle>
              <CardDescription>最近的错误记录</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    没有找到符合条件的错误日志
                  </div>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 p-4 border rounded-lg"
                    >
                      <div className="flex-shrink-0">
                        {getSeverityIcon(log.severity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getSeverityColor(log.severity)}>
                            {log.severity}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {log.code}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatTime(log.timestamp)}
                          </span>
                        </div>
                        <div className="font-medium mb-1">{log.message}</div>
                        <div className="text-sm text-muted-foreground">
                          类型: {log.type}
                          {log.path && ` • 路径: ${log.path}`}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {report && report.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  系统建议
                </CardTitle>
                <CardDescription>基于错误分析的改进建议</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.recommendations.map((recommendation, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg"
                    >
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="text-sm">{recommendation}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
