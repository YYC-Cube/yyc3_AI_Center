import { type NextRequest, NextResponse } from "next/server";

// API服务状态检查
export async function GET(request: NextRequest) {
  try {
    // 检查各API服务的配置状态
    const apiStatus = {
      weather: {
        enabled: !!process.env.OPENWEATHER_API_KEY,
        name: "天气查询服务",
        status: "online",
        demo: !process.env.OPENWEATHER_API_KEY,
      },
      news: {
        enabled: !!process.env.NEWS_API_KEY,
        name: "新闻资讯服务",
        status: "online",
        demo: !process.env.NEWS_API_KEY,
      },
      ipinfo: {
        enabled: !!process.env.IPINFO_TOKEN,
        name: "IP查询服务",
        status: "online",
        demo: !process.env.IPINFO_TOKEN,
      },
      currency: {
        enabled: !!process.env.EXCHANGE_RATE_API_KEY,
        name: "汇率转换服务",
        status: "online",
        demo: !process.env.EXCHANGE_RATE_API_KEY,
      },
      stock: {
        enabled: !!process.env.ALPHA_VANTAGE_API_KEY,
        name: "股票查询服务",
        status: "online",
        demo: !process.env.ALPHA_VANTAGE_API_KEY,
      },
      geocode: {
        enabled: !!process.env.GOOGLE_MAPS_API_KEY,
        name: "地理编码服务",
        status: "online",
        demo: !process.env.GOOGLE_MAPS_API_KEY,
      },
      translate: {
        enabled: !!process.env.GOOGLE_TRANSLATE_API_KEY,
        name: "翻译服务",
        status: "online",
        demo: !process.env.GOOGLE_TRANSLATE_API_KEY,
      },
      qrcode: {
        enabled: true,
        name: "二维码生成服务",
        status: "online",
        demo: false,
      },
    };

    // 返回API服务状态
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      services: apiStatus,
      totalServices: Object.keys(apiStatus).length,
      enabledServices: Object.values(apiStatus).filter(
        (service) => service.enabled,
      ).length,
      demoServices: Object.values(apiStatus).filter((service) => service.demo)
        .length,
    });
  } catch (error) {
    console.error("API状态检查错误:", error);
    return NextResponse.json(
      { error: "获取API状态失败", code: "SERVER_ERROR" },
      { status: 500 },
    );
  }
}
