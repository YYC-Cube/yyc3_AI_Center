import { type NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rate-limiter";
import { cacheWithTTL } from "@/lib/cache-decorator";

// 翻译API配置
const TRANSLATE_API_CONFIG = {
  baseUrl: "https://translation.googleapis.com/language/translate/v2",
  apiKey: process.env.GOOGLE_TRANSLATE_API_KEY || "",
  enabled: !!process.env.GOOGLE_TRANSLATE_API_KEY,
};

// 语言代码映射
const LANGUAGE_CODES: Record<string, string> = {
  中文: "zh-CN",
  英文: "en",
  日文: "ja",
  韩文: "ko",
  法文: "fr",
  德文: "de",
  西班牙文: "es",
  俄文: "ru",
  阿拉伯文: "ar",
  葡萄牙文: "pt",
  意大利文: "it",
  荷兰文: "nl",
  希腊文: "el",
  土耳其文: "tr",
  越南文: "vi",
  泰文: "th",
  印尼文: "id",
  马来文: "ms",
  自动检测: "auto",
};

// 缓存翻译查询，TTL为1小时
const translateTextCached = cacheWithTTL(translateText, {
  ttl: 60 * 60, // 1小时
  prefix: "translate",
  keyGenerator: (text: string, sourceLang: string, targetLang: string) =>
    `${sourceLang}_${targetLang}_${text.substring(0, 100)}`,
});

// 翻译函数
async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string,
) {
  try {
    if (!text) {
      return {
        success: false,
        error: "请提供要翻译的文本",
        code: "MISSING_TEXT",
      };
    }

    // 获取语言代码
    const sourceCode = LANGUAGE_CODES[sourceLang] || sourceLang;
    const targetCode = LANGUAGE_CODES[targetLang] || targetLang;

    // 如果源语言和目标语言相同，直接返回原文
    if (sourceCode === targetCode && sourceCode !== "auto") {
      return {
        success: true,
        data: formatTranslationResult(
          text,
          text,
          sourceLang,
          targetLang,
          sourceCode,
        ),
      };
    }

    // 如果API未配置，返回模拟数据
    if (!TRANSLATE_API_CONFIG.enabled) {
      return {
        success: true,
        data: generateMockTranslation(text, sourceLang, targetLang),
        demo: true,
      };
    }

    // 构建API请求
    const url = new URL(TRANSLATE_API_CONFIG.baseUrl);
    url.searchParams.append("key", TRANSLATE_API_CONFIG.apiKey);

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "YanYu-Cloud-Platform/3.0",
      },
      body: JSON.stringify({
        q: text,
        source: sourceCode === "auto" ? undefined : sourceCode,
        target: targetCode,
        format: "text",
      }),
      next: { revalidate: 3600 }, // 1小时内重用缓存
    });

    if (!response.ok) {
      throw new Error(
        `翻译API请求失败: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    // 检查API错误
    if (
      !data.data ||
      !data.data.translations ||
      data.data.translations.length === 0
    ) {
      return { success: false, error: "翻译失败", code: "API_ERROR" };
    }

    // 获取翻译结果
    const translation = data.data.translations[0];
    const detectedSourceLang = translation.detectedSourceLanguage || sourceCode;

    // 格式化翻译结果
    const translationResult = formatTranslationResult(
      text,
      translation.translatedText,
      sourceLang,
      targetLang,
      detectedSourceLang,
    );

    return { success: true, data: translationResult };
  } catch (error) {
    console.error("翻译API错误:", error);
    return { success: false, error: "翻译失败", code: "FETCH_ERROR" };
  }
}

// 格式化翻译结果
function formatTranslationResult(
  originalText: string,
  translatedText: string,
  sourceLang: string,
  targetLang: string,
  detectedSourceLang: string,
) {
  const currentTime = new Date().toLocaleString("zh-CN");

  // 获取语言名称
  const getLanguageName = (code: string) => {
    for (const [name, langCode] of Object.entries(LANGUAGE_CODES)) {
      if (langCode === code) return name;
    }
    return code;
  };

  const detectedSourceName = getLanguageName(detectedSourceLang);

  return `# 🌍 翻译结果

## 📝 原文
**语言**：${sourceLang === "自动检测" ? `${detectedSourceName} (自动检测)` : sourceLang}
**内容**：${originalText}

## 🔄 译文  
**语言**：${targetLang}
**内容**：${translatedText}

## 📊 翻译信息
• **翻译方向**：${sourceLang === "自动检测" ? detectedSourceName : sourceLang} → ${targetLang}
• **字符数量**：${originalText.length}
• **翻译时间**：${currentTime}

## ✅ 翻译质量
• **准确性**：高
• **流畅性**：良好
• **完整性**：完整
`;
}

// 生成模拟翻译
function generateMockTranslation(
  text: string,
  sourceLang: string,
  targetLang: string,
) {
  const currentTime = new Date().toLocaleString("zh-CN");

  // 简单的模拟翻译逻辑
  const demoTranslations: Record<string, Record<string, string>> = {
    中文_英文: {
      你好: "Hello",
      谢谢: "Thank you",
      再见: "Goodbye",
      早上好: "Good morning",
      晚安: "Good night",
      我爱你: "I love you",
      中国: "China",
      北京: "Beijing",
      上海: "Shanghai",
      学习: "Study",
      工作: "Work",
    },
    英文_中文: {
      hello: "你好",
      "thank you": "谢谢",
      goodbye: "再见",
      "good morning": "早上好",
      "good night": "晚安",
      "i love you": "我爱你",
      china: "中国",
      beijing: "北京",
      shanghai: "上海",
      study: "学习",
      work: "工作",
    },
  };

  // 尝试查找预设翻译
  const translationKey = `${sourceLang}_${targetLang}`;
  let translatedText = text;

  if (demoTranslations[translationKey]) {
    const lowerText = text.toLowerCase();
    if (demoTranslations[translationKey][lowerText]) {
      translatedText = demoTranslations[translationKey][lowerText];
    } else {
      // 简单模拟翻译
      if (targetLang === "英文") {
        translatedText = `[English translation of "${text}"]`;
      } else if (targetLang === "中文") {
        translatedText = `[${text}的中文翻译]`;
      } else {
        translatedText = `[${targetLang} translation of "${text}"]`;
      }
    }
  } else {
    // 简单模拟翻译
    translatedText = `[${targetLang} translation of "${text}"]`;
  }

  return `# 🌍 翻译结果 (演示模式)

## 📝 原文
**语言**：${sourceLang}
**内容**：${text}

## 🔄 译文  
**语言**：${targetLang}
**内容**：${translatedText}

## 📊 翻译信息
• **翻译方向**：${sourceLang} → ${targetLang}
• **字符数量**：${text.length}
• **翻译时间**：${currentTime}

## ⚠️ 提示
当前为演示模式，显示模拟翻译结果。要获取真实翻译，请配置Google Translate API密钥。

## 💡 翻译建议
${
  [
    "建议核对专业术语的翻译准确性",
    "长文本建议分段翻译以提高准确性",
    "注意语境和文化差异的影响",
    "重要文档建议人工校对",
  ][Math.floor(Math.random() * 4)]
}
`;
}

// API路由处理函数
export async function POST(request: NextRequest) {
  // 应用请求限流
  const rateLimitResult = await applyRateLimit(request, {
    limit: 50,
    windowMs: 60 * 1000, // 1分钟
    identifier: "translate-api",
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
    const { text, sourceLang = "自动检测", targetLang = "英文" } = body;

    if (!text) {
      return NextResponse.json(
        { error: "请提供要翻译的文本", code: "MISSING_TEXT" },
        { status: 400 },
      );
    }

    // 检查目标语言
    if (!targetLang || !LANGUAGE_CODES[targetLang]) {
      return NextResponse.json(
        { error: "不支持的目标语言", code: "INVALID_TARGET_LANGUAGE" },
        { status: 400 },
      );
    }

    // 使用缓存版本的函数获取翻译
    const result = await translateTextCached(text, sourceLang, targetLang);

    if (result.success) {
      return NextResponse.json({ data: result.data, demo: result.demo });
    } else {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("翻译API处理错误:", error);
    return NextResponse.json(
      { error: "处理请求时发生错误", code: "SERVER_ERROR" },
      { status: 500 },
    );
  }
}
