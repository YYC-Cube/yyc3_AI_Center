import { type NextRequest, NextResponse } from "next/server";
import { rateLimiter } from "@/lib/rate-limiter";
import { getFromCache, setToCache } from "@/lib/cache-manager";
import { withErrorHandling } from "@/middleware/error-handler";
import { ErrorType, createAPIError } from "@/lib/error-handler";
import { recordAPICall } from "@/lib/api-monitor";
import { serviceDegradation, ServiceHealth } from "@/lib/service-degradation";

export async function POST(request: NextRequest) {
  return withErrorHandling(
    request,
    async () => {
      const startTime = Date.now();
      let statusCode = 200;
      let cacheHit = false;

      try {
        const reqBody = await request.json();
        const { city } = reqBody;

        if (!city) {
          throw createAPIError(
            ErrorType.VALIDATION_ERROR,
            "MISSING_CITY",
            "请提供城市名称",
            {
              suggestion:
                '请确保请求中包含城市名称参数。例如: { "city": "北京" }',
            },
          );
        }

        // 限流检查
        const rateLimitResponse = await rateLimiter(request, "weather");
        if (rateLimitResponse) {
          statusCode = 429;
          throw createAPIError(
            ErrorType.RATE_LIMIT_ERROR,
            "RATE_LIMITED",
            "请求过于频繁，请稍后再试",
            {
              retryable: true,
              retryAfter: Number.parseInt(
                rateLimitResponse.headers.get("Retry-After") || "60",
                10,
              ),
            },
          );
        }

        // 缓存检查
        const cacheParams = { city: city.trim().toLowerCase() };
        const cachedWeather = await getFromCache<{ data: string }>(
          "weather",
          cacheParams,
        );

        if (cachedWeather) {
          console.log(`Weather cache hit for city: ${city}`);
          cacheHit = true;
          return NextResponse.json(cachedWeather);
        }

        console.log(`Weather cache miss for city: ${city}`);

        // 检查服务健康状态
        const serviceHealth = serviceDegradation.getServiceHealth("weather");
        if (serviceHealth === ServiceHealth.DEGRADED) {
          // 降级模式：返回简化的天气数据
          const degradedWeather = generateDegradedWeather(city);
          return NextResponse.json({
            data: degradedWeather,
            degraded: true,
          });
        }

        // 正常模式：调用外部API
        const weatherInfo = await fetchWeather(city);

        if (!weatherInfo) {
          throw createAPIError(
            ErrorType.EXTERNAL_API_ERROR,
            "WEATHER_API_ERROR",
            "无法获取天气数据",
            {
              suggestion: "外部天气API可能暂时不可用，请稍后重试。",
            },
          );
        }

        // 在返回成功响应之前
        const responseData = { data: weatherInfo };

        // 存入缓存
        await setToCache("weather", cacheParams, responseData);

        return NextResponse.json(responseData);
      } catch (error) {
        // 错误已由withErrorHandling中间件处理
        throw error;
      } finally {
        // 记录API调用
        const responseTime = Date.now() - startTime;
        recordAPICall(
          "weather",
          "/api/weather",
          "POST",
          statusCode,
          responseTime,
          {
            userAgent: request.headers.get("user-agent") || undefined,
            ip: request.headers.get("x-forwarded-for") || undefined,
            cacheHit,
          },
        );
      }
    },
    "weather",
  );
}

async function fetchWeather(city: string): Promise<string> {
  try {
    // 这里应该是实际的天气API调用
    // 为了演示，我们返回模拟数据
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      throw new Error("Weather API key not configured");
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=zh_cn`,
      { next: { revalidate: 3600 } }, // 1小时缓存
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw createAPIError(
          ErrorType.NOT_FOUND_ERROR,
          "CITY_NOT_FOUND",
          `未找到城市"${city}"的天气信息`,
          {
            suggestion:
              "请检查城市名称拼写是否正确，或尝试使用更常见的城市名称。",
          },
        );
      }

      throw createAPIError(
        ErrorType.EXTERNAL_API_ERROR,
        "WEATHER_API_ERROR",
        "天气服务暂时不可用",
        {
          detail: `Weather API responded with status ${response.status}`,
          retryable: true,
        },
      );
    }

    const data = await response.json();

    // 格式化天气数据
    return formatWeatherData(data, city);
  } catch (error) {
    console.error("Error fetching weather:", error);

    // 如果是我们自己创建的APIError，直接抛出
    if (error && typeof error === "object" && "type" in error) {
      throw error;
    }

    // 否则创建一个新的APIError
    throw createAPIError(
      ErrorType.EXTERNAL_API_ERROR,
      "WEATHER_API_ERROR",
      "获取天气数据失败",
      {
        detail: error instanceof Error ? error.message : String(error),
        suggestion: "天气服务可能暂时不可用，请稍后重试。",
        retryable: true,
      },
    );
  }
}

// 格式化天气数据
function formatWeatherData(data: any, city: string): string {
  const temp = data.main.temp;
  const feelsLike = data.main.feels_like;
  const humidity = data.main.humidity;
  const windSpeed = data.wind.speed;
  const description = data.weather[0].description;
  const pressure = data.main.pressure;
  const visibility = data.visibility / 1000; // 转换为公里
  const clouds = data.clouds.all;
  const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString("zh-CN");
  const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString("zh-CN");

  return `# 🌤️ ${city}天气预报

## 📊 当前天气
• **天气状况**：${description}
• **温度**：${temp}°C
• **体感温度**：${feelsLike}°C
• **湿度**：${humidity}%
• **风速**：${windSpeed}m/s

## 🌡️ 详细信息
• **气压**：${pressure}hPa
• **能见度**：${visibility}km
• **云量**：${clouds}%
• **日出时间**：${sunrise}
• **日落时间**：${sunset}

## ⏰ 更新时间
${new Date().toLocaleString("zh-CN")}

## 💡 天气小贴士
${getWeatherTip(temp, description)}
`;
}

// 生成降级模式的天气数据
function generateDegradedWeather(city: string): string {
  return `# 🌤️ ${city}天气预报 (降级模式)

## ⚠️ 服务降级通知
天气服务当前处于降级模式，提供的是有限信息。

## 📊 基本天气信息
• **地区**：${city}
• **更新时间**：${new Date().toLocaleString("zh-CN")}

## 💡 提示
• 完整的天气服务将很快恢复
• 您可以稍后再次查询获取详细信息
• 感谢您的理解和耐心

## 🔄 状态
系统正在自动恢复中，请稍后重试。
`;
}

// 根据天气状况生成小贴士
function getWeatherTip(temp: number, description: string): string {
  if (temp > 30) {
    return "今天温度较高，外出请做好防晒措施，多补充水分。";
  } else if (temp < 5) {
    return "今天温度较低，外出请注意保暖，预防感冒。";
  } else if (description.includes("雨")) {
    return "今天有雨，出门请携带雨具，注意路滑。";
  } else if (description.includes("雪")) {
    return "今天有雪，出行注意保暖和路面结冰情况。";
  } else if (description.includes("雾")) {
    return "今天有雾，驾车出行请注意安全，减速慢行。";
  } else if (description.includes("晴")) {
    return "今天天气晴朗，适合户外活动，注意防晒。";
  } else {
    return "随时关注天气变化，合理安排出行计划。";
  }
}
