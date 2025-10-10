import { type NextRequest, NextResponse } from "next/server";
import { rateLimiter } from "@/lib/rate-limiter";
import { getFromCache, setToCache } from "@/lib/cache-manager";

export async function POST(request: NextRequest) {
  try {
    const { from, to, amount } = await request.json();

    if (!from || !to || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "请输入有效的货币和金额" },
        { status: 400 },
      );
    }

    // 限流检查
    const rateLimitResponse = await rateLimiter(request, "currency");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // 缓存检查 - 汇率缓存不包含具体金额，只缓存汇率
    const cacheParams = { from, to };
    const cachedRate = await getFromCache<{
      rate: number;
      base: string;
      date: string;
    }>("currency", cacheParams);

    if (cachedRate) {
      console.log(`Currency cache hit for ${from} -> ${to}`);

      // 使用缓存的汇率计算结果
      const convertedAmount = amount * cachedRate.rate;

      const currencyInfo = `# 💱 汇率转换结果 (缓存)

## 💰 转换信息
• **原始金额**：${amount.toLocaleString()} ${from}
• **转换金额**：${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${to}
• **汇率**：1 ${from} = ${cachedRate.rate.toFixed(6)} ${to}

## 📊 汇率信息 (缓存数据)
• **基准货币**：${cachedRate.base}
• **更新时间**：${cachedRate.date}
• **缓存时间**：${new Date().toLocaleString("zh-CN")}
• **数据来源**：ExchangeRate-API (缓存)

## 📈 市场分析
• **汇率趋势**：${getMarketTrend(cachedRate.rate)}
• **市场情绪**：${getMarketSentiment()}
• **风险等级**：${getRiskLevel(from, to)}

## 💡 投资建议
${getInvestmentAdvice(from, to, cachedRate.rate)}

## ⚠️ 免责声明
• 汇率数据仅供参考，实际交易请以银行汇率为准
• 汇率波动较大，投资需谨慎
• 重要交易建议咨询专业金融顾问

## ⏰ 查询时间
${new Date().toLocaleString("zh-CN")}
`;

      return NextResponse.json({ data: currencyInfo });
    }

    console.log(`Currency cache miss for ${from} -> ${to}`);

    // 使用免费的汇率API
    const url = `https://api.exchangerate-api.com/v4/latest/${from}`;

    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { error: "汇率服务暂时不可用" },
        { status: 500 },
      );
    }

    const data = await response.json();

    if (!data.rates || !data.rates[to]) {
      return NextResponse.json(
        { error: `不支持的货币转换：${from} -> ${to}` },
        { status: 400 },
      );
    }

    const rate = data.rates[to];
    const convertedAmount = amount * rate;

    const currencyInfo = `# 💱 汇率转换结果

## 💰 转换信息
• **原始金额**：${amount.toLocaleString()} ${from}
• **转换金额**：${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${to}
• **汇率**：1 ${from} = ${rate.toFixed(6)} ${to}

## 📊 汇率信息
• **基准货币**：${data.base}
• **更新时间**：${data.date}
• **数据来源**：ExchangeRate-API

## 📈 市场分析
• **汇率趋势**：${getMarketTrend(rate)}
• **市场情绪**：${getMarketSentiment()}
• **风险等级**：${getRiskLevel(from, to)}

## 💡 投资建议
${getInvestmentAdvice(from, to, rate)}

## ⚠️ 免责声明
• 汇率数据仅供参考，实际交易请以银行汇率为准
• 汇率波动较大，投资需谨慎
• 重要交易建议咨询专业金融顾问

## ⏰ 查询时间
${new Date().toLocaleString("zh-CN")}
`;

    // 在生成完整响应之前，先缓存汇率数据
    await setToCache("currency", cacheParams, {
      rate,
      base: data.base,
      date: data.date,
    });

    const responseData = { data: currencyInfo };
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Currency API error:", error);
    return NextResponse.json({ error: "汇率转换服务异常" }, { status: 500 });
  }
}

function getMarketTrend(rate: number): string {
  // 简单的趋势判断逻辑
  if (rate > 1) {
    return "上升";
  } else if (rate < 0.5) {
    return "下降";
  } else {
    return "稳定";
  }
}

function getMarketSentiment(): string {
  const sentiments = ["乐观", "谨慎", "中性", "悲观"];
  return sentiments[Math.floor(Math.random() * sentiments.length)];
}

function getRiskLevel(from: string, to: string): string {
  const majorCurrencies = ["USD", "EUR", "JPY", "GBP", "CNY"];
  if (majorCurrencies.includes(from) && majorCurrencies.includes(to)) {
    return "低";
  } else {
    return "中";
  }
}

function getInvestmentAdvice(from: string, to: string, rate: number): string {
  const advice = [];

  if (from === "USD" && to === "CNY") {
    advice.push("美元兑人民币是重要的货币对，建议关注中美经济政策");
  } else if (from === "EUR" && to === "USD") {
    advice.push("欧美货币对波动较大，建议分散投资风险");
  }

  advice.push("汇率波动受多种因素影响，建议长期观察");
  advice.push("重要投资决策前请咨询专业金融顾问");

  return advice.join("；");
}
