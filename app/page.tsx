"use client"
import React, { useEffect, useRef, useCallback, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group"
import { Badge } from "../components/ui/badge"
import { Separator } from "../components/ui/separator"
import { useSafeDOM } from "../hooks/use-safe-dom"
import {
  Sparkles,
  Rocket,
  BarChart3,
  Activity,
  FileText,
  MessageSquare,
  TrendingUp,
  Trash2,
  Globe,
  Cloud,
  Brain,
  Download,
  RotateCcw,
  ImageIcon,
  User,
  Menu,
  X,
  ChevronRight,
  CheckCircle,
  Search,
  RefreshCw,
  Zap,
  FileText as FileTextIcon,
  Image
} from "lucide-react"
import { Textarea } from "../components/ui/textarea"
import { Slider } from "../components/ui/slider"
import { Progress } from "../components/ui/progress"
import { APIMonitorDashboard } from "../components/api-monitor-dashboard"

// 模拟数据 - 实际应用中应从API获取
const mockStats = {
  servers: 250,
  users: 12500,
  uptime: 99.9,
  totalOperations: 250000,
  weatherQueries: 85000,
  newsQueries: 62000,
  ipQueries: 35000,
  currencyQueries: 42000,
  textProcessed: 58000,
  contentGenerated: 22000,
  imagesProcessed: 18000,
  dataAnalyzed: 45000,
  feedbackCount: 9500,
  imageClassified: 18000
};

// 服务状态数据
const serviceStatusData = [
  {
    name: '天气服务',
    status: 'online',
    uptime: '99.8%',
    color: 'from-blue-400 to-blue-600',
    icon: <Cloud className="w-4 h-4" />,
    responseTime: '0.24s',
  },
  {
    name: '新闻服务',
    status: 'online',
    uptime: '99.7%',
    color: 'from-green-400 to-green-600',
    icon: <FileTextIcon className="w-4 h-4" />,
    responseTime: '0.32s',
  },
  {
    name: 'IP查询',
    status: 'online',
    uptime: '99.9%',
    color: 'from-orange-400 to-orange-600',
    icon: <Globe className="w-4 h-4" />,
    responseTime: '0.18s',
  },
  {
    name: '汇率转换',
    status: 'online',
    uptime: '99.6%',
    color: 'from-purple-400 to-purple-600',
    icon: <BarChart3 className="w-4 h-4" />,
    responseTime: '0.28s',
  },
];

const YYCCloudDashboard = () => {
  // 使用安全DOM操作Hook
  const { safeDownload, isMounted } = useSafeDOM()

  // 安全异步操作管理
  const mountedRef = useRef(true)
  const controllersRef = useRef<Set<AbortController>>(new Set())

  // 组件卸载时清理
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      // 取消所有进行中的请求
      controllersRef.current.forEach((controller) => {
        try {
          controller.abort()
        } catch (error) {
          console.error("取消请求时发生错误", error)
        }
      })
      controllersRef.current.clear()
    }
  }, [])

  // 创建可取消的异步操作
  const createCancellableOperation = useCallback(<T,>(operation: (signal: AbortSignal) => Promise<T>): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      if (!mountedRef.current) {
        reject(new Error("组件已卸载"))
        return
      }

      const controller = new AbortController()
      controllersRef.current.add(controller)

      operation(controller.signal)
        .then((result) => {
          if (mountedRef.current) {
            resolve(result)
          }
        })
        .catch((error) => {
          if (mountedRef.current && error.name !== "AbortError") {
            reject(error)
          }
        })
        .finally(() => {
          controllersRef.current.delete(controller)
        })
    })
  }, [])

  // 安全的状态更新
  const safeSetState = useCallback(
    <T,>(setter: React.Dispatch<React.SetStateAction<T>>, value: T | ((prev: T) => T)): void => {
      if (mountedRef.current) {
        setter(value)
      }
    },
    []
  )

  // 文本处理状态
  const [textInput, setTextInput] = useState("")
  const [stats, setStats] = useState(mockStats)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [services, setServices] = useState(serviceStatusData)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const toastRef = useRef<HTMLDivElement>(null)

  // 模拟数据刷新
  const refreshData = () => {
    setRefreshing(true)
    setTimeout(() => {
      setStats(prev => ({
        ...prev,
        totalOperations: prev.totalOperations + Math.floor(Math.random() * 1000 + 500),
        weatherQueries: prev.weatherQueries + Math.floor(Math.random() * 300 + 100),
        newsQueries: prev.newsQueries + Math.floor(Math.random() * 200 + 50),
        ipQueries: prev.ipQueries + Math.floor(Math.random() * 100 + 30),
        currencyQueries: prev.currencyQueries + Math.floor(Math.random() * 150 + 50),
      }))
      setRefreshing(false)
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 3000)
    }, 1000)
  }

  // 处理服务选择
  const handleServiceSelect = (serviceName: string) => {
    setSelectedService(serviceName)
  }

  // 处理标签切换
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  // 展示成功提示
  useEffect(() => {
    if (showSuccessToast && toastRef.current) {
      toastRef.current.classList.add('animate-in')
      setTimeout(() => {
        if (toastRef.current) {
          toastRef.current.classList.remove('animate-in')
          toastRef.current.classList.add('animate-out')
        }
      }, 2500)
    }
  }, [showSuccessToast])

  // 导出结果功能
  const exportResults = () => {
    const data = {
      timestamp: new Date().toISOString(),
      stats: stats,
      services: services
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `yanyu-cloud-stats-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-indigo-950 text-white">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* 移动菜单按钮 */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <Button
          variant="default"
          className="bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* 移动菜单 */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-gradient-to-b from-slate-900/95 to-indigo-950/95 backdrop-blur-md flex flex-col justify-center items-center">
          <div className="space-y-6">
            <Button className="text-white text-xl" onClick={() => setIsMobileMenuOpen(false)}>
              天气查询
            </Button>
            <Button className="text-white text-xl" onClick={() => setIsMobileMenuOpen(false)}>
              新闻资讯
            </Button>
            <Button className="text-white text-xl" onClick={() => setIsMobileMenuOpen(false)}>
              IP查询
            </Button>
            <Button className="text-white text-xl" onClick={() => setIsMobileMenuOpen(false)}>
              汇率转换
            </Button>
            <Button className="text-white text-xl" onClick={() => setIsMobileMenuOpen(false)}>
              文本处理
            </Button>
            <Button
              variant="default"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg mt-4"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              立即体验
            </Button>
          </div>
        </div>
      )}

      <div className="relative z-10">
        {/* 导航栏 */}
        <nav className="bg-gradient-to-r from-blue-900/80 to-indigo-900/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="h-10 w-48 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent flex items-center justify-center text-xl font-bold">
                    YanYu Cloud³
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center flex-1">
                <div className="grid grid-cols-6 gap-2 md:gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/90 hover:text-white hover:bg-white/10 flex items-center"
                  >
                    <Cloud className="w-4 h-4 mr-1" />
                    <span className="text-xs">天气查询</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/90 hover:text-white hover:bg-white/10 flex items-center"
                  >
                    <FileTextIcon className="w-4 h-4 mr-1" />
                    <span className="text-xs">新闻资讯</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/90 hover:text-white hover:bg-white/10 flex items-center"
                  >
                    <Activity className="w-4 h-4 mr-1" />
                    <span className="text-xs">IP查询</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/90 hover:text-white hover:bg-white/10 flex items-center"
                  >
                    <BarChart3 className="w-4 h-4 mr-1" />
                    <span className="text-xs">汇率转换</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/90 hover:text-white hover:bg-white/10 flex items-center"
                  >
                    <Brain className="w-4 h-4 mr-1" />
                    <span className="text-xs">AI分类</span>
                  </Button>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-2">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-sm">
                  <Rocket className="w-4 h-4 mr-1" />
                  立即体验
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* 英雄区域 */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <Badge
              variant="outline"
              className="mb-6 inline-flex border-white/30 text-white/90"
            >
              云服务监控中心
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              一站式智能云服务<span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent"> YanYu Cloud Cube Integration Center</span>
            </h1>
            <p className="text-xl text-blue-100/80 max-w-3xl mx-auto mb-8">
              整合天气查询、新闻资讯、IP分析、汇率转换等多种智能服务，为您提供高效便捷的云服务体验
            </p>
            <h2 className="text-2xl font-semibold text-cyan-300 mb-12">
              YanYu Cloud³ Intelligence Platform
            </h2>

            {/* 核心数据卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-16">
              <Card className="bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden hover:bg-white/10 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Zap className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{stats.servers.toLocaleString()}+</div>
                  <div className="text-blue-100 text-sm">云服务器</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden hover:bg-white/10 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <User className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{stats.users.toLocaleString()}+</div>
                  <div className="text-green-100 text-sm">企业用户</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden hover:bg-white/10 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{stats.uptime.toFixed(1)}%</div>
                  <div className="text-purple-100 text-sm">可用性</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden hover:bg-white/10 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <RefreshCw className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{stats.totalOperations}</div>
                  <div className="text-orange-100 text-sm">总操作</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden hover:bg-white/10 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Cloud className="w-4 h-4 text-pink-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{stats.weatherQueries}</div>
                  <div className="text-pink-100 text-sm">天气查询</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden hover:bg-white/10 transition-all">
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Image className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{stats.imageClassified}</div>
                  <div className="text-cyan-100 text-sm">AI分类</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* 主要内容区域 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {/* 选项卡导航 */}
          <div className="flex mb-8 border-b border-white/10">
            <Button
              variant={activeTab === 'overview' ? 'default' : 'ghost'}
              className={`rounded-none px-6 py-2 ${activeTab === 'overview' ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white'}`}
              onClick={() => handleTabChange('overview')}
            >
              概览
            </Button>
            <Button
              variant={activeTab === 'services' ? 'default' : 'ghost'}
              className={`rounded-none px-6 py-2 ${activeTab === 'services' ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white'}`}
              onClick={() => handleTabChange('services')}
            >
              服务状态
            </Button>
            <Button
              variant={activeTab === 'analytics' ? 'default' : 'ghost'}
              className={`rounded-none px-6 py-2 ${activeTab === 'analytics' ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white'}`}
              onClick={() => handleTabChange('analytics')}
            >
              数据分析
            </Button>
          </div>

          {/* 概览内容 */}
          {activeTab === 'overview' && (
            <>
              {/* 数据概览卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* 操作统计卡片 */}
                <Card className="bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden">
                  <CardHeader className="border-b border-white/10 pb-2">
                    <CardTitle className="text-white font-semibold">操作统计</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-white/5 rounded-lg">
                        <div className="text-blue-100 text-sm mb-1">总操作</div>
                        <div className="text-3xl font-bold text-white">{stats.totalOperations}</div>
                        <div className="text-green-400 text-xs mt-1">+{Math.floor(Math.random() * 10 + 5)} 今日</div>
                      </div>
                      <div className="text-center p-3 bg-white/5 rounded-lg">
                        <div className="text-blue-100 text-sm mb-1">天气查询</div>
                        <div className="text-3xl font-bold text-white">{stats.weatherQueries}</div>
                        <div className="text-green-400 text-xs mt-1">+{Math.floor(Math.random() * 5 + 2)} 今日</div>
                      </div>
                      <div className="text-center p-3 bg-white/5 rounded-lg">
                        <div className="text-blue-100 text-sm mb-1">新闻查询</div>
                        <div className="text-3xl font-bold text-white">{stats.newsQueries}</div>
                        <div className="text-green-400 text-xs mt-1">+{Math.floor(Math.random() * 8 + 3)} 今日</div>
                      </div>
                      <div className="text-center p-3 bg-white/5 rounded-lg">
                        <div className="text-blue-100 text-sm mb-1">IP查询</div>
                        <div className="text-3xl font-bold text-white">{stats.ipQueries}</div>
                        <div className="text-green-400 text-xs mt-1">+{Math.floor(Math.random() * 3 + 1)} 今日</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI服务统计卡片 */}
                <Card className="bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden">
                  <CardHeader
                    title="AI服务统计"
                    className="border-b border-white/10 pb-2"
                  />
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-white/5 rounded-lg">
                        <div className="text-blue-100 text-sm mb-1">汇率转换</div>
                        <div className="text-3xl font-bold text-white">{stats.currencyQueries}</div>
                        <div className="text-green-400 text-xs mt-1">+{Math.floor(Math.random() * 4 + 2)} 今日</div>
                      </div>
                      <div className="text-center p-3 bg-white/5 rounded-lg">
                        <div className="text-blue-100 text-sm mb-1">文本处理</div>
                        <div className="text-3xl font-bold text-white">{stats.textProcessed}</div>
                        <div className="text-green-400 text-xs mt-1">+{Math.floor(Math.random() * 6 + 3)} 今日</div>
                      </div>
                      <div className="text-center p-3 bg-white/5 rounded-lg">
                        <div className="text-blue-100 text-sm mb-1">内容生成</div>
                        <div className="text-3xl font-bold text-white">{stats.contentGenerated}</div>
                        <div className="text-green-400 text-xs mt-1">+{Math.floor(Math.random() * 7 + 2)} 今日</div>
                      </div>
                      <div className="text-center p-3 bg-white/5 rounded-lg">
                        <div className="text-blue-100 text-sm mb-1">图像处理</div>
                        <div className="text-3xl font-bold text-white">{stats.imagesProcessed}</div>
                        <div className="text-green-400 text-xs mt-1">+{Math.floor(Math.random() * 4 + 1)} 今日</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 系统状态卡片 */}
                <Card className="bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden">
                  <CardHeader
                    title="系统状态"
                    className="border-b border-white/10 pb-2"
                  />
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-blue-100 text-sm">系统可用性</span>
                          <span className="text-white font-semibold">99.9%</span>
                        </div>
                        <Progress value={99.9} className="h-2 bg-white/10" />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-blue-100 text-sm">服务器负载</span>
                          <span className="text-white font-semibold">32%</span>
                        </div>
                        <Progress value={32} className="h-2 bg-white/10" />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-blue-100 text-sm">数据库连接</span>
                          <span className="text-white font-semibold">87%</span>
                        </div>
                        <Progress value={87} className="h-2 bg-white/10" />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-blue-100 text-sm">API响应时间</span>
                          <span className="text-white font-semibold">0.26s</span>
                        </div>
                        <Progress value={95} className="h-2 bg-white/10" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 服务统计概览 */}
              <Card className="bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden">
                <CardHeader className="border-b border-white/10 pb-2">
                  <CardTitle className="text-white font-semibold">服务统计概览</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 天气服务 */}
                  <div className="p-4 rounded-lg bg-white/5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center mr-3">
                          <Cloud className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-white font-medium">天气服务</div>
                          <div className="text-white/60 text-xs">API v2.1</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="flex items-center mr-3">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                          <span className="text-white/70 text-sm">正常</span>
                        </div>
                        <div className="text-white/70 text-sm font-semibold">99.8%</div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-white/60 text-xs">响应时间</div>
                        <div className="text-green-400 text-sm font-bold">0.24s</div>
                      </div>
                      <div className="flex justify-end items-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-400 hover:text-blue-300 p-0"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* 新闻服务 */}
                  <div className="p-4 rounded-lg bg-white/5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mr-3">
                          <FileTextIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-white font-medium">新闻服务</div>
                          <div className="text-white/60 text-xs">API v2.1</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="flex items-center mr-3">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                          <span className="text-white/70 text-sm">正常</span>
                        </div>
                        <div className="text-white/70 text-sm font-semibold">99.7%</div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-white/60 text-xs">响应时间</div>
                        <div className="text-green-400 text-sm font-bold">0.32s</div>
                      </div>
                      <div className="flex justify-end items-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-400 hover:text-blue-300 p-0"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* IP查询 */}
                  <div className="p-4 rounded-lg bg-white/5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center mr-3">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-white font-medium">IP查询</div>
                          <div className="text-white/60 text-xs">API v2.1</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="flex items-center mr-3">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                          <span className="text-white/70 text-sm">正常</span>
                        </div>
                        <div className="text-white/70 text-sm font-semibold">99.9%</div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-white/60 text-xs">响应时间</div>
                        <div className="text-green-400 text-sm font-bold">0.18s</div>
                      </div>
                      <div className="flex justify-end items-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-400 hover:text-blue-300 p-0"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* 汇率转换 */}
                  <div className="p-4 rounded-lg bg-white/5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center mr-3">
                          <BarChart3 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-white font-medium">汇率转换</div>
                          <div className="text-white/60 text-xs">API v2.1</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="flex items-center mr-3">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                          <span className="text-white/70 text-sm">正常</span>
                        </div>
                        <div className="text-white/70 text-sm font-semibold">99.6%</div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-white/60 text-xs">响应时间</div>
                        <div className="text-green-400 text-sm font-bold">0.28s</div>
                      </div>
                      <div className="flex justify-end items-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-400 hover:text-blue-300 p-0"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* 服务状态内容 */}
          {activeTab === 'services' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* 服务状态卡片 */}
              <Card className="bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-white/10 pb-2">
                  <CardTitle className="text-white font-semibold">服务状态监控</CardTitle>
                  <Button
                    variant="default"
                    size="sm"
                    className={`border ${refreshing ? 'text-white/50' : 'text-white border-white/30 hover:border-white/60'}`}
                    onClick={refreshData}
                    disabled={refreshing}
                  >
                      {refreshing ? (
                        <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-1" />
                      )}
                      刷新
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {services.map((service) => (
                    <div
                      key={service.name}
                      className={`p-4 rounded-lg ${selectedService === service.name ? 'bg-white/10' : 'bg-white/5 hover:bg-white/8'}`}
                      onClick={() => handleServiceSelect(service.name)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 bg-gradient-to-r ${service.color} rounded-full flex items-center justify-center mr-3`}>
                            {service.icon}
                          </div>
                          <div>
                            <div className="text-white font-medium">{service.name}</div>
                            <div className="text-white/60 text-xs">API v2.1</div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="flex items-center mr-3">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                            <span className="text-white/70 text-sm">正常</span>
                          </div>
                          <div className="text-white/70 text-sm font-semibold">{service.uptime}</div>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-white/60 text-xs">响应时间</div>
                          <div className="text-green-400 text-sm font-bold">{service.responseTime}</div>
                        </div>
                        <div className="flex justify-end items-end">
                          <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-400 hover:text-blue-300 p-0"
                        >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* 服务详情卡片 */}
              <Card className="bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden">
                <CardHeader className="border-b border-white/10 pb-2">
                  <CardTitle className="text-white font-semibold">{selectedService || "服务详情"}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {selectedService ? (
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                          {services.find(s => s.name === selectedService)?.icon}
                        </div>
                        <h3 className="text-xl font-bold text-white">{selectedService}</h3>
                        <p className="text-blue-100">实时监控数据</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-lg">
                          <div className="text-white/60 text-xs mb-1">可用性</div>
                          <div className="text-2xl font-bold text-green-400">99.8%</div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg">
                          <div className="text-white/60 text-xs mb-1">平均响应时间</div>
                          <div className="text-2xl font-bold text-green-400">0.24s</div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white/80">今日请求次数</span>
                          <span className="text-white font-semibold">1,284</span>
                        </div>
                        <Progress value={75} className="h-2 bg-white/10" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white/80">请求成功率</span>
                          <span className="text-white font-semibold">99.9%</span>
                        </div>
                        <Progress value={99.9} className="h-2 bg-white/10" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white/80">服务器负载</span>
                          <span className="text-white font-semibold">32%</span>
                        </div>
                        <Progress value={32} className="h-2 bg-white/10" />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Search className="w-8 h-8 text-white/40" />
                      </div>
                      <p className="text-white/60">选择一个服务查看详细信息</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* 数据分析内容 */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* 服务可用指标 */}
              <Card className="bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden">
                <CardHeader className="border-b border-white/10 pb-2">
                  <CardTitle className="text-white font-semibold">服务可用指标</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 p-4 rounded-lg border border-blue-700/30">
                      <div className="text-blue-300 text-sm mb-1">总请求数</div>
                      <div className="text-3xl font-bold text-white mb-1">{stats.totalOperations}</div>
                      <div className="text-green-400 text-xs flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        增长 12.5%
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 p-4 rounded-lg border border-green-700/30">
                      <div className="text-green-300 text-sm mb-1">成功率</div>
                      <div className="text-3xl font-bold text-white mb-1">99.9%</div>
                      <div className="text-green-400 text-xs flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        增长 0.2%
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 p-4 rounded-lg border border-purple-700/30">
                      <div className="text-purple-300 text-sm mb-1">平均响应</div>
                      <div className="text-3xl font-bold text-white mb-1">0.24s</div>
                      <div className="text-green-400 text-xs flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        优化 15%
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/20 p-4 rounded-lg border border-orange-700/30">
                      <div className="text-orange-300 text-sm mb-1">服务可用性</div>
                      <div className="text-3xl font-bold text-white mb-1">99.8%</div>
                      <div className="text-green-400 text-xs flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        稳定运行
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>

        {/* 底部信息 */}
        <Card className="max-w-7xl mx-auto mt-8 bg-white/10 backdrop-blur-md border-white/20 m-4">
          <CardContent className="p-6 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">✨ 言枢象限丨语启未来</h3>
            <p className="text-white/90 text-lg mb-4">Yan (Speech) Pivot Quadrants 丨 Yu (Language) Ignite Future</p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-white/80 mb-4">
              <Badge variant="outline" className="border-white/30 text-white/90">
                🌤️ 真实天气数据
              </Badge>
              <Badge variant="outline" className="border-white/30 text-white/90">
                📰 实时新闻资讯
              </Badge>
              <Badge variant="outline" className="border-white/30 text-white/90">
                📍 IP地理查询
              </Badge>
              <Badge variant="outline" className="border-white/30 text-white/90">
                💱 实时汇率转换
              </Badge>
              <Badge variant="outline" className="border-white/30 text-white/90">
                🧠 PyTorch AI分类
              </Badge>
              <Badge variant="outline" className="border-white/30 text-white/90">
                🚀 高性能体验
              </Badge>
              <Badge variant="outline" className="border-white/30 text-white/90">
                🔗 API集成服务
              </Badge>
            </div>
            <Separator className="my-4 bg-white/20" />
            <p className="text-white/70 text-sm">
              © 2024 言语云³ YanYu Cloud | PyTorch AI版本 v3.2.0 |
              <span className="text-green-400">www.yy.0379.pro</span> | 专为v0优化
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 成功提示 */}
      {showSuccessToast && (
        <div
          ref={toastRef}
          className="fixed bottom-4 right-4 bg-green-900/90 backdrop-blur-sm border border-green-500/30 rounded-lg p-4 flex items-center shadow-lg transform transition-all duration-300 translate-y-0 opacity-0"
        >
          <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
          <span className="text-green-100">数据刷新成功</span>
        </div>
      )}
    </div>
  )
}

export default YYCCloudDashboard;
