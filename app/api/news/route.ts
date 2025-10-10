import { type NextRequest, NextResponse } from "next/server";
import { rateLimiter } from "@/lib/rate-limiter";
import { getFromCache, setToCache } from "@/lib/cache-manager";

export async function POST(request: NextRequest) {
  try {
    const { category } = await request.json();

    // 限流检查
    const rateLimitResponse = await rateLimiter(request, "news");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // 缓存检查
    const cacheParams = { category };
    const cachedNews = await getFromCache<{ data: string }>(
      "news",
      cacheParams,
    );

    if (cachedNews) {
      console.log(`News cache hit for category: ${category}`);
      return NextResponse.json(cachedNews);
    }

    console.log(`News cache miss for category: ${category}`);

    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API密钥未配置" }, { status: 500 });
    }

    const url = `https://newsapi.org/v2/top-headlines?category=${category}&country=us&apiKey=${apiKey}&pageSize=10`;

    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { error: "新闻服务暂时不可用" },
        { status: 500 },
      );
    }

    const data = await response.json();

    if (data.status !== "ok") {
      return NextResponse.json(
        { error: data.message || "新闻获取失败" },
        { status: 500 },
      );
    }

    const articles = data.articles || [];

    let newsContent = `# 📰 ${getCategoryName(category)} 新闻资讯

## 📡 实时新闻更新
获取时间：${new Date().toLocaleString("zh-CN")}

`;

    if (articles.length === 0) {
      newsContent += "暂无相关新闻内容";
    } else {
      articles.slice(0, 8).forEach((article: any, index: number) => {
        const publishTime = new Date(article.publishedAt).toLocaleString(
          "zh-CN",
        );
        newsContent += `
## ${index + 1}. ${article.title || "无标题"}

**来源**：${article.source?.name || "未知来源"}
**时间**：${publishTime}
**描述**：${article.description || "暂无描述"}
${article.url ? `**链接**：${article.url}` : ""}

---
`;
      });
    }

    newsContent += `

## 📊 新闻统计
• **类别**：${getCategoryName(category)}
• **新闻数量**：${articles.length}
• **数据来源**：NewsAPI
• **更新时间**：${new Date().toLocaleString("zh-CN")}

## 💡 阅读建议
• 建议关注多个可靠新闻源以获取全面信息
• 注意甄别新闻的真实性和可靠性
• 重要新闻建议查看官方权威发布
`;

    const responseData = { data: newsContent };

    // 存入缓存
    await setToCache("news", cacheParams, responseData);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("News API error:", error);
    return NextResponse.json({ error: "新闻获取服务异常" }, { status: 500 });
  }
}

function getCategoryName(category: string): string {
  const categoryMap: Record<string, string> = {
    technology: "科技",
    business: "商业",
    health: "健康",
    sports: "体育",
    entertainment: "娱乐",
    science: "科学",
    general: "综合",
  };
  return categoryMap[category] || category;
}
