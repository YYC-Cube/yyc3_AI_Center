"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
} from "lucide-react";

// 健康状态颜色映射
const healthColorMap: Record<string, string> = {
  HEALTHY: "bg-green-500",
  DEGRADED: "bg-yellow-500",
  CRITICAL: "bg-orange-500",
  UNAVAILABLE: "bg-red-500",
};

// 健康状态图标映射
const healthIconMap: Record<string, React.ReactNode> = {
  HEALTHY: <CheckCircle className="h-5 w-5 text-green-500" />,
  DEGRADED: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  CRITICAL: <AlertCircle className="h-5 w-5 text-orange-500" />,
  UNAVAILABLE: <AlertCircle className="h-5 w-5 text-red-500" />,
};

// 格式化时间
function formatTime(timestamp: number): string {
  if (!timestamp) return "未知";
  const date = new Date(timestamp);
  return date.toLocaleString("zh-CN");
}

// 格式化持续时间
function formatDuration(ms: number): string {
  if (!ms) return "0秒";

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}天${hours % 24}小时`;
  if (hours > 0) return `${hours}小时${minutes % 60}分钟`;
  if (minutes > 0) return `${minutes}分钟${seconds % 60}秒`;
  return `${seconds}秒`;
}

export default function SystemHealthDashboard() {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // 获取健康数据
  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/health");
      if (!response.ok) {
        throw new Error(`获取健康数据失败: ${response.status}`);
      }
      const data = await response.json();
      setHealthData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取健康数据失败");
    } finally {
      setLoading(false);
    }
  };

  // 初始加载和定时刷新
  useEffect(() => {
    fetchHealthData();

    // 每60秒刷新一次
    const interval = setInterval(fetchHealthData, 60000);

    return () => clearInterval(interval);
  }, []);

  // 手动刷新
  const handleRefresh = () => {
    fetchHealthData();
  };

  if (loading && !healthData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="mt-2">加载系统健康数据...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>加载失败</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!healthData) {
    return null;
  }

  const { health, services, cache, uptime } = healthData;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">系统健康仪表盘</h2>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* 系统概览卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>系统概览</CardTitle>
          <CardDescription>
            系统运行时间: {formatDuration(uptime * 1000)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 健康评分 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  系统健康评分
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {health.overallHealth.score}/100
                </div>
                <Progress
                  value={health.overallHealth.score}
                  className="h-2 mt-2"
                  indicatorClassName={
                    health.overallHealth.score > 80
                      ? "bg-green-500"
                      : health.overallHealth.score > 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }
                />
                <div className="mt-2 text-sm text-gray-500">
                  状态: {health.overallHealth.status}
                </div>
              </CardContent>
            </Card>

            {/* 请求统计 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">请求统计</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {health.performance.totalRequests}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  错误率: {(health.performance.errorRate * 100).toFixed(2)}%
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  平均响应时间:{" "}
                  {health.performance.averageResponseTime.toFixed(0)}ms
                </div>
              </CardContent>
            </Card>

            {/* 系统资源 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">系统资源</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">内存使用</span>
                  <span className="text-sm font-medium">
                    {health.systemResources.memoryUsage.toFixed(1)} MB
                  </span>
                </div>
                <Progress
                  value={Math.min(health.systemResources.memoryUsage / 5, 100)}
                  className="h-1 mb-3"
                />

                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">CPU使用</span>
                  <span className="text-sm font-medium">
                    {health.systemResources.cpuUsage.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={health.systemResources.cpuUsage}
                  className="h-1"
                />
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* 详细信息标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="services">服务状态</TabsTrigger>
          <TabsTrigger value="cache">缓存状态</TabsTrigger>
          <TabsTrigger value="alerts">告警信息</TabsTrigger>
        </TabsList>

        {/* 服务状态标签页 */}
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>服务健康状态</CardTitle>
              <CardDescription>各API服务的当前运行状态</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(services).map(
                  ([name, service]: [string, any]) => (
                    <Card key={name}>
                      <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{name}</CardTitle>
                          <CardDescription>
                            健康评分: {health.serviceHealth[name] || 0}/100
                          </CardDescription>
                        </div>
                        <Badge
                          className={
                            healthColorMap[service.health] || "bg-gray-500"
                          }
                        >
                          {service.health}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm space-y-2">
                          <div className="flex justify-between">
                            <span>错误计数:</span>
                            <span>{service.errorCount}</span>
                          </div>
                          {service.lastErrorTime && (
                            <div className="flex justify-between">
                              <span>最后错误:</span>
                              <span>{formatTime(service.lastErrorTime)}</span>
                            </div>
                          )}
                          {service.degradedSince && (
                            <div className="flex justify-between">
                              <span>降级时长:</span>
                              <span>
                                {formatDuration(
                                  Date.now() - service.degradedSince,
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 缓存状态标签页 */}
        <TabsContent value="cache">
          <Card>
            <CardHeader>
              <CardTitle>缓存状态</CardTitle>
              <CardDescription>
                内存缓存大小: {(cache.stats.memoryCache.size / 1024).toFixed(2)}{" "}
                KB, 键数量: {cache.stats.memoryCache.keys}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(cache.serviceMetrics).map(
                  ([service, metrics]: [string, any]) => (
                    <Card key={service}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">
                          {service} 缓存
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-medium mb-1">
                              命中率
                            </div>
                            <div className="flex items-center">
                              <div className="flex-1 mr-2">
                                <Progress
                                  value={
                                    (metrics.hits /
                                      (metrics.hits + metrics.misses)) *
                                      100 || 0
                                  }
                                  className="h-2"
                                />
                              </div>
                              <div className="text-sm">
                                {(
                                  (metrics.hits /
                                    (metrics.hits + metrics.misses)) *
                                    100 || 0
                                ).toFixed(1)}
                                %
                              </div>
                            </div>
                          </div>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span>命中:</span>
                              <span>{metrics.hits}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>未命中:</span>
                              <span>{metrics.misses}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>总大小:</span>
                              <span>
                                {(metrics.totalSize / 1024).toFixed(2)} KB
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 告警信息标签页 */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>最近告警</CardTitle>
              <CardDescription>系统最近生成的告警信息</CardDescription>
            </CardHeader>
            <CardContent>
              {health.recentAlerts && health.recentAlerts.length > 0 ? (
                <div className="space-y-3">
                  {health.recentAlerts.map((alert: any, index: number) => (
                    <Alert
                      key={index}
                      variant={
                        alert.level === "critical"
                          ? "destructive"
                          : alert.level === "warning"
                            ? "default"
                            : "outline"
                      }
                    >
                      <div className="flex items-start">
                        {alert.level === "critical" ? (
                          <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 mr-2 mt-0.5" />
                        )}
                        <div>
                          <AlertTitle className="mb-1">
                            {alert.service} - {alert.message}
                          </AlertTitle>
                          <AlertDescription className="flex justify-between text-sm">
                            <span>{formatTime(alert.timestamp)}</span>
                            <Badge variant="outline">{alert.level}</Badge>
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>没有最近的告警信息</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CardFooter className="text-sm text-gray-500 justify-center">
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          最后更新: {formatTime(new Date(healthData.timestamp).getTime())}
        </div>
      </CardFooter>
    </div>
  );
}
