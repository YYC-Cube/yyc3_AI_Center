"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Server,
  TrendingUp,
  XCircle,
  RefreshCw,
  Bell,
  BarChart3,
  Cpu,
  Wifi,
} from "lucide-react";

interface MonitoringData {
  services: Record<string, ServiceStats>;
  systemHealth: {
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
    activeConnections: number;
    totalRequests: number;
    errorRate: number;
  };
  alerts: Array<{
    id: string;
    type: "error" | "warning" | "info";
    service: string;
    message: string;
    timestamp: number;
    resolved: boolean;
  }>;
  summary: {
    totalServices: number;
    healthyServices: number;
    totalRequests: number;
    averageResponseTime: number;
    overallErrorRate: number;
    activeAlerts: number;
  };
  timestamp: string;
}

interface ServiceStats {
  totalRequests: number;
  successRequests: number;
  errorRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
  lastHour: any[];
  lastDay: any[];
}

export function APIMonitorDashboard() {
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 获取监控数据
  const fetchMonitoringData = useCallback(async () => {
    try {
      const response = await fetch("/api/monitor");
      if (response.ok) {
        const data = await response.json();
        setMonitoringData(data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("获取监控数据失败:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 解决警报
  const resolveAlert = useCallback(
    async (alertId: string) => {
      try {
        const response = await fetch("/api/monitor", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ alertId }),
        });

        if (response.ok) {
          fetchMonitoringData(); // 刷新数据
        }
      } catch (error) {
        console.error("解决警报失败:", error);
      }
    },
    [fetchMonitoringData],
  );

  // 自动刷新
  useEffect(() => {
    fetchMonitoringData();

    if (autoRefresh) {
      const interval = setInterval(fetchMonitoringData, 30000); // 30秒刷新一次
      return () => clearInterval(interval);
    }
  }, [fetchMonitoringData, autoRefresh]);

  // 格式化时间
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}天 ${hours % 24}小时`;
    if (hours > 0) return `${hours}小时 ${minutes % 60}分钟`;
    if (minutes > 0) return `${minutes}分钟 ${seconds % 60}秒`;
    return `${seconds}秒`;
  };

  // 获取服务状态颜色
  const getServiceStatusColor = (stats: ServiceStats) => {
    if (stats.errorRate > 0.1) return "from-red-400 to-red-600";
    if (stats.errorRate > 0.05) return "from-yellow-400 to-yellow-600";
    return "from-green-400 to-green-600";
  };

  // 获取服务状态文本
  const getServiceStatusText = (stats: ServiceStats) => {
    if (stats.errorRate > 0.1) return "异常";
    if (stats.errorRate > 0.05) return "警告";
    return "正常";
  };

  if (isLoading) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-white/80">加载监控数据中...</div>
        </CardContent>
      </Card>
    );
  }

  if (!monitoringData) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6 text-center">
          <XCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <div className="text-white/80">无法获取监控数据</div>
          <Button onClick={fetchMonitoringData} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            重试
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 顶部控制栏 */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                API监控仪表板
              </h2>
              {lastUpdate && (
                <div className="text-white/60 text-sm">
                  最后更新: {lastUpdate.toLocaleTimeString("zh-CN")}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setAutoRefresh(!autoRefresh)}
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                className="text-white"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`}
                />
                自动刷新
              </Button>
              <Button
                onClick={fetchMonitoringData}
                size="sm"
                className="text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                手动刷新
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 系统概览 */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-400/20 to-blue-600/20 border-blue-300/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {monitoringData.summary.totalServices}
            </div>
            <div className="text-blue-100 text-sm">总服务数</div>
            <div className="text-xs text-blue-200 mt-1">
              {monitoringData.summary.healthyServices} 健康
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-400/20 to-green-600/20 border-green-300/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {monitoringData.summary.totalRequests.toLocaleString()}
            </div>
            <div className="text-green-100 text-sm">总请求数</div>
            <div className="text-xs text-green-200 mt-1">24小时内</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-400/20 to-purple-600/20 border-purple-300/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {monitoringData.summary.averageResponseTime.toFixed(0)}ms
            </div>
            <div className="text-purple-100 text-sm">平均响应</div>
            <div className="text-xs text-purple-200 mt-1">所有服务</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-400/20 to-orange-600/20 border-orange-300/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {(monitoringData.summary.overallErrorRate * 100).toFixed(2)}%
            </div>
            <div className="text-orange-100 text-sm">错误率</div>
            <div className="text-xs text-orange-200 mt-1">
              {monitoringData.summary.overallErrorRate < 0.01
                ? "优秀"
                : "需关注"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-400/20 to-red-600/20 border-red-300/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {monitoringData.summary.activeAlerts}
            </div>
            <div className="text-red-100 text-sm">活跃警报</div>
            <div className="text-xs text-red-200 mt-1">需要处理</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-400/20 to-cyan-600/20 border-cyan-300/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {formatDuration(monitoringData.systemHealth.uptime)}
            </div>
            <div className="text-cyan-100 text-sm">系统运行</div>
            <div className="text-xs text-cyan-200 mt-1">持续时间</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white/20 backdrop-blur-sm text-white">
          <TabsTrigger
            value="services"
            className="data-[state=active]:bg-white/30 text-white data-[state=active]:text-white"
          >
            <Server className="w-4 h-4 mr-2" />
            服务监控
          </TabsTrigger>
          <TabsTrigger
            value="system"
            className="data-[state=active]:bg-white/30 text-white data-[state=active]:text-white"
          >
            <Cpu className="w-4 h-4 mr-2" />
            系统状态
          </TabsTrigger>
          <TabsTrigger
            value="alerts"
            className="data-[state=active]:bg-white/30 text-white data-[state=active]:text-white"
          >
            <Bell className="w-4 h-4 mr-2" />
            警报中心
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-white/30 text-white data-[state=active]:text-white"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            数据分析
          </TabsTrigger>
        </TabsList>

        {/* 服务监控标签页 */}
        <TabsContent value="services" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(monitoringData.services).map(
              ([serviceName, stats]) => (
                <Card key={serviceName} className="bg-white/5 border-white/10">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-white text-lg capitalize">
                        {serviceName}
                      </CardTitle>
                      <Badge
                        className={`bg-gradient-to-r ${getServiceStatusColor(stats)} text-white border-0`}
                      >
                        {getServiceStatusText(stats)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-white/60">总请求</div>
                        <div className="text-white font-semibold">
                          {stats.totalRequests.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/60">成功率</div>
                        <div className="text-green-400 font-semibold">
                          {(
                            (stats.successRequests / stats.totalRequests) *
                              100 || 0
                          ).toFixed(1)}
                          %
                        </div>
                      </div>
                      <div>
                        <div className="text-white/60">平均响应</div>
                        <div className="text-blue-400 font-semibold">
                          {stats.averageResponseTime.toFixed(0)}ms
                        </div>
                      </div>
                      <div>
                        <div className="text-white/60">缓存命中</div>
                        <div className="text-purple-400 font-semibold">
                          {(stats.cacheHitRate * 100 || 0).toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-white/20" />

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">错误率</span>
                        <span
                          className={
                            stats.errorRate > 0.05
                              ? "text-red-400"
                              : "text-green-400"
                          }
                        >
                          {(stats.errorRate * 100 || 0).toFixed(2)}%
                        </span>
                      </div>
                      <Progress
                        value={stats.errorRate * 100}
                        className="h-2 bg-white/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">P95响应时间</span>
                        <span className="text-orange-400">
                          {stats.p95ResponseTime.toFixed(0)}ms
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">P99响应时间</span>
                        <span className="text-red-400">
                          {stats.p99ResponseTime.toFixed(0)}ms
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ),
            )}
          </div>
        </TabsContent>

        {/* 系统状态标签页 */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Cpu className="w-5 h-5 mr-2" />
                  系统资源使用情况
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-white/90 mb-2">
                    <span className="flex items-center">
                      <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full mr-2"></div>
                      CPU 使用率
                    </span>
                    <span className="font-bold">
                      {monitoringData.systemHealth.cpuUsage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={monitoringData.systemHealth.cpuUsage}
                    className="h-3 bg-white/20"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-white/90 mb-2">
                    <span className="flex items-center">
                      <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-green-600 rounded-full mr-2"></div>
                      内存使用
                    </span>
                    <span className="font-bold">
                      {monitoringData.systemHealth.memoryUsage.toFixed(1)}MB
                    </span>
                  </div>
                  <Progress
                    value={
                      (monitoringData.systemHealth.memoryUsage / 1024) * 100
                    }
                    className="h-3 bg-white/20"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-white/90 mb-2">
                    <span className="flex items-center">
                      <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full mr-2"></div>
                      错误率
                    </span>
                    <span className="font-bold">
                      {(monitoringData.systemHealth.errorRate * 100).toFixed(2)}
                      %
                    </span>
                  </div>
                  <Progress
                    value={monitoringData.systemHealth.errorRate * 100}
                    className="h-3 bg-white/20"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  实时连接状态
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-400 mb-1">
                      {monitoringData.systemHealth.activeConnections}
                    </div>
                    <div className="text-white/60 text-sm">活跃连接</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400 mb-1">
                      {monitoringData.systemHealth.totalRequests.toLocaleString()}
                    </div>
                    <div className="text-white/60 text-sm">总请求数</div>
                  </div>
                </div>

                <Separator className="bg-white/20" />

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white/80 flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      系统运行时间
                    </span>
                    <span className="text-cyan-400 font-semibold">
                      {formatDuration(monitoringData.systemHealth.uptime)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80 flex items-center">
                      <Wifi className="w-4 h-4 mr-2" />
                      网络状态
                    </span>
                    <Badge className="bg-green-500/20 text-green-300 border-green-400/30">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      正常
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80 flex items-center">
                      <Database className="w-4 h-4 mr-2" />
                      数据库连接
                    </span>
                    <Badge className="bg-green-500/20 text-green-300 border-green-400/30">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      健康
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 警报中心标签页 */}
        <TabsContent value="alerts" className="space-y-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                活跃警报 ({monitoringData.alerts.length})
              </CardTitle>
              <CardDescription className="text-white/80">
                系统自动检测到的异常情况和需要关注的问题
              </CardDescription>
            </CardHeader>
            <CardContent>
              {monitoringData.alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <div className="text-white/80 text-lg">暂无活跃警报</div>
                  <div className="text-white/60 text-sm">所有服务运行正常</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {monitoringData.alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border ${
                        alert.type === "error"
                          ? "bg-red-500/10 border-red-400/30"
                          : alert.type === "warning"
                            ? "bg-yellow-500/10 border-yellow-400/30"
                            : "bg-blue-500/10 border-blue-400/30"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-3">
                          {alert.type === "error" ? (
                            <XCircle className="w-5 h-5 text-red-400 mt-0.5" />
                          ) : alert.type === "warning" ? (
                            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                          ) : (
                            <Activity className="w-5 h-5 text-blue-400 mt-0.5" />
                          )}
                          <div>
                            <div className="text-white font-medium">
                              {alert.message}
                            </div>
                            <div className="text-white/60 text-sm mt-1">
                              服务: {alert.service} • 时间:{" "}
                              {new Date(alert.timestamp).toLocaleString(
                                "zh-CN",
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => resolveAlert(alert.id)}
                          size="sm"
                          className="bg-white/20 hover:bg-white/30 text-white"
                        >
                          解决
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 数据分析标签页 */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  服务性能趋势
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(monitoringData.services)
                    .sort(([, a], [, b]) => b.totalRequests - a.totalRequests)
                    .slice(0, 5)
                    .map(([serviceName, stats]) => (
                      <div key={serviceName} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/80 capitalize">
                            {serviceName}
                          </span>
                          <span className="text-white/60">
                            {stats.totalRequests} 请求
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <div className="flex-1">
                            <div className="text-xs text-white/60 mb-1">
                              成功率
                            </div>
                            <Progress
                              value={
                                (stats.successRequests / stats.totalRequests) *
                                  100 || 0
                              }
                              className="h-2 bg-white/20"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-white/60 mb-1">
                              缓存命中
                            </div>
                            <Progress
                              value={stats.cacheHitRate * 100 || 0}
                              className="h-2 bg-white/20"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  关键指标汇总
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400 mb-1">
                        {Object.values(monitoringData.services)
                          .reduce(
                            (sum, service) => sum + service.totalRequests,
                            0,
                          )
                          .toLocaleString()}
                      </div>
                      <div className="text-white/60 text-sm">总请求量</div>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <div className="text-2xl font-bold text-green-400 mb-1">
                        {(
                          (Object.values(monitoringData.services).reduce(
                            (sum, service) => sum + service.successRequests,
                            0,
                          ) /
                            Object.values(monitoringData.services).reduce(
                              (sum, service) => sum + service.totalRequests,
                              0,
                            )) *
                            100 || 0
                        ).toFixed(1)}
                        %
                      </div>
                      <div className="text-white/60 text-sm">整体成功率</div>
                    </div>
                  </div>

                  <Separator className="bg-white/20" />

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/80">最快响应服务</span>
                      <span className="text-green-400 font-semibold">
                        {Object.entries(monitoringData.services).reduce(
                          (fastest, [name, stats]) =>
                            stats.averageResponseTime < fastest.time
                              ? { name, time: stats.averageResponseTime }
                              : fastest,
                          { name: "", time: Number.POSITIVE_INFINITY },
                        ).name || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">最高缓存命中</span>
                      <span className="text-purple-400 font-semibold">
                        {Object.entries(monitoringData.services).reduce(
                          (highest, [name, stats]) =>
                            stats.cacheHitRate > highest.rate
                              ? { name, rate: stats.cacheHitRate }
                              : highest,
                          { name: "", rate: 0 },
                        ).name || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">最活跃服务</span>
                      <span className="text-cyan-400 font-semibold">
                        {Object.entries(monitoringData.services).reduce(
                          (busiest, [name, stats]) =>
                            stats.totalRequests > busiest.requests
                              ? { name, requests: stats.totalRequests }
                              : busiest,
                          { name: "", requests: 0 },
                        ).name || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
