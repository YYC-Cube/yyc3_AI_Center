import { type NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rate-limiter";
import { cacheWithTTL } from "@/lib/cache-decorator";

// 股票API配置
const STOCK_API_CONFIG = {
  baseUrl: "https://www.alphavantage.co/query",
  apiKey: process.env.ALPHA_VANTAGE_API_KEY || "",
  enabled: !!process.env.ALPHA_VANTAGE_API_KEY,
};

// 缓存股票数据查询，TTL为5分钟
const fetchStockDataCached = cacheWithTTL(fetchStockData, {
  ttl: 5 * 60, // 5分钟
  prefix: "stock",
  keyGenerator: (symbol: string) => `${symbol.toUpperCase()}`,
});

// 获取股票数据
async function fetchStockData(symbol: string) {
  try {
    if (!symbol) {
      return {
        success: false,
        error: "请提供股票代码",
        code: "MISSING_SYMBOL",
      };
    }

    // 如果API未配置，返回模拟数据
    if (!STOCK_API_CONFIG.enabled) {
      return {
        success: true,
        data: generateMockStockData(symbol),
        demo: true,
      };
    }

    // 构建API请求
    const url = new URL(STOCK_API_CONFIG.baseUrl);
    url.searchParams.append("function", "GLOBAL_QUOTE");
    url.searchParams.append("symbol", symbol);
    url.searchParams.append("apikey", STOCK_API_CONFIG.apiKey);

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "YanYu-Cloud-Platform/3.0",
      },
      next: { revalidate: 300 }, // 5分钟内重用缓存
    });

    if (!response.ok) {
      throw new Error(
        `股票API请求失败: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    // 检查API错误
    if (data["Error Message"]) {
      return {
        success: false,
        error: data["Error Message"],
        code: "API_ERROR",
      };
    }

    // 检查是否有数据
    if (
      !data["Global Quote"] ||
      Object.keys(data["Global Quote"]).length === 0
    ) {
      return { success: false, error: "未找到股票数据", code: "NO_DATA" };
    }

    // 格式化股票数据
    const quote = data["Global Quote"];
    const stockData = formatStockData(quote, symbol);

    return { success: true, data: stockData };
  } catch (error) {
    console.error("股票API错误:", error);
    return { success: false, error: "获取股票数据失败", code: "FETCH_ERROR" };
  }
}

// 格式化股票数据
function formatStockData(quote: any, symbol: string) {
  const currentTime = new Date().toLocaleString("zh-CN");

  return `# 📈 ${symbol.toUpperCase()} 股票信息

## 📊 基本信息
• **股票代码**：${symbol.toUpperCase()}
• **当前价格**：$${quote["05. price"]}
• **开盘价**：$${quote["02. open"]}
• **最高价**：$${quote["03. high"]}
• **最低价**：$${quote["04. low"]}
• **成交量**：${quote["06. volume"]}

## 📈 价格变动
• **涨跌额**：$${quote["09. change"]}
• **涨跌幅**：${quote["10. change percent"]}
• **前收盘价**：$${quote["08. previous close"]}

## ⏰ 更新信息
• **最后交易日**：${quote["07. latest trading day"]}
• **查询时间**：${currentTime}

## 💡 投资建议
${getInvestmentAdvice(Number.parseFloat(quote["09. change"]))}
`;
}

// 生成模拟股票数据
function generateMockStockData(symbol: string) {
  const currentTime = new Date().toLocaleString("zh-CN");
  const basePrice = Math.random() * 500 + 50;
  const changePercent = (Math.random() * 10 - 5).toFixed(2);
  const change = ((basePrice * Number.parseFloat(changePercent)) / 100).toFixed(
    2,
  );
  const currentPrice = (basePrice + Number.parseFloat(change)).toFixed(2);

  return `# 📈 ${symbol.toUpperCase()} 股票信息 (演示模式)

## 📊 基本信息
• **股票代码**：${symbol.toUpperCase()}
• **当前价格**：$${currentPrice}
• **开盘价**：$${(basePrice - Math.random() * 5).toFixed(2)}
• **最高价**：$${(Number.parseFloat(currentPrice) + Math.random() * 10).toFixed(2)}
• **最低价**：$${(Number.parseFloat(currentPrice) - Math.random() * 10).toFixed(2)}
• **成交量**：${Math.floor(Math.random() * 10000000)}

## 📈 价格变动
• **涨跌额**：$${change}
• **涨跌幅**：${changePercent}%
• **前收盘价**：$${basePrice.toFixed(2)}

## 📊 技术指标
• **市盈率**：${(Math.random() * 30 + 5).toFixed(2)}
• **市净率**：${(Math.random() * 5 + 1).toFixed(2)}
• **52周最高**：$${(Number.parseFloat(currentPrice) * 1.3).toFixed(2)}
• **52周最低**：$${(Number.parseFloat(currentPrice) * 0.7).toFixed(2)}

## ⏰ 更新信息
• **查询时间**：${currentTime}

## ⚠️ 提示
当前为演示模式，显示模拟股票数据。要获取真实数据，请配置Alpha Vantage API密钥。

## 💡 投资建议
${getInvestmentAdvice(Number.parseFloat(change))}
`;
}

// 根据股票变动生成投资建议
function getInvestmentAdvice(change: number) {
  if (change > 10) {
    return "股票表现强劲，可考虑适当获利了结，保持关注。";
  } else if (change > 0) {
    return "股票呈现上涨趋势，可考虑持有并关注市场动态。";
  } else if (change > -5) {
    return "股票略有下跌，可考虑观望或择机小幅加仓。";
  } else {
    return "股票下跌明显，建议谨慎评估后再做决策，关注基本面变化。";
  }
}

// API路由处理函数
export async function POST(request: NextRequest) {
  // 应用请求限流
  const rateLimitResult = await applyRateLimit(request, {
    limit: 20,
    windowMs: 60 * 1000, // 1分钟
    identifier: "stock-api",
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试", code: "RATE_LIMITED" },
      {
        status: 429,
        headers: {
          "Retry-After": rateLimitResult.retryAfter.toString(),
        },
      },
    );
  }

  try {
    const body = await request.json();
    const { symbol } = body;

    if (!symbol) {
      return NextResponse.json(
        { error: "请提供股票代码", code: "MISSING_SYMBOL" },
        { status: 400 },
      );
    }

    // 使用缓存版本的函数获取股票数据
    const result = await fetchStockDataCached(symbol);

    if (result.success) {
      return NextResponse.json({ data: result.data, demo: result.demo });
    } else {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("股票API处理错误:", error);
    return NextResponse.json(
      { error: "处理请求时发生错误", code: "SERVER_ERROR" },
      { status: 500 },
    );
  }
}
