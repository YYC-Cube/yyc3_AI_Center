import { type NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rate-limiter";
import { cacheWithTTL } from "@/lib/cache-decorator";

// 地理编码API配置
const GEOCODE_API_CONFIG = {
  baseUrl: "https://maps.googleapis.com/maps/api/geocode/json",
  apiKey: process.env.GOOGLE_MAPS_API_KEY || "",
  enabled: !!process.env.GOOGLE_MAPS_API_KEY,
};

// 缓存地理编码查询，TTL为24小时
const geocodeAddressCached = cacheWithTTL(geocodeAddress, {
  ttl: 24 * 60 * 60, // 24小时
  prefix: "geocode",
  keyGenerator: (address: string) => address.toLowerCase().trim(),
});

// 地理编码函数
async function geocodeAddress(address: string) {
  try {
    if (!address) {
      return { success: false, error: "请提供地址", code: "MISSING_ADDRESS" };
    }

    // 如果API未配置，返回模拟数据
    if (!GEOCODE_API_CONFIG.enabled) {
      return {
        success: true,
        data: generateMockGeocodeData(address),
        demo: true,
      };
    }

    // 构建API请求
    const url = new URL(GEOCODE_API_CONFIG.baseUrl);
    url.searchParams.append("address", address);
    url.searchParams.append("key", GEOCODE_API_CONFIG.apiKey);
    url.searchParams.append("language", "zh-CN");

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "YanYu-Cloud-Platform/3.0",
      },
      next: { revalidate: 86400 }, // 24小时内重用缓存
    });

    if (!response.ok) {
      throw new Error(
        `地理编码API请求失败: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    // 检查API错误
    if (data.status !== "OK") {
      return {
        success: false,
        error: `地理编码失败: ${data.status}`,
        code: "API_ERROR",
      };
    }

    // 格式化地理编码结果
    const geocodeData = formatGeocodeData(data.results[0], address);

    return { success: true, data: geocodeData };
  } catch (error) {
    console.error("地理编码API错误:", error);
    return {
      success: false,
      error: "获取地理编码数据失败",
      code: "FETCH_ERROR",
    };
  }
}

// 格式化地理编码数据
function formatGeocodeData(result: any, address: string) {
  const currentTime = new Date().toLocaleString("zh-CN");
  const location = result.geometry.location;

  // 提取地址组件
  const addressComponents = {
    country: getAddressComponent(result, "country"),
    province: getAddressComponent(result, "administrative_area_level_1"),
    city: getAddressComponent(result, "locality"),
    district: getAddressComponent(result, "sublocality"),
    street: getAddressComponent(result, "route"),
    postalCode: getAddressComponent(result, "postal_code"),
  };

  return `# 🗺️ 地理编码结果

## 📍 查询地址
${address}

## 🌐 地理坐标
• **纬度**：${location.lat}
• **经度**：${location.lng}
• **精确度**：${result.geometry.location_type}

## 📮 地址详情
• **国家/地区**：${addressComponents.country || "未知"}
• **省/州**：${addressComponents.province || "未知"}
• **城市**：${addressComponents.city || "未知"}
• **区/县**：${addressComponents.district || "未知"}
• **街道**：${addressComponents.street || "未知"}
• **邮政编码**：${addressComponents.postalCode || "未知"}

## 📝 完整地址
${result.formatted_address}

## ⏰ 查询信息
• **查询时间**：${currentTime}
• **地址类型**：${result.types.join(", ")}
`;
}

// 获取地址组件
function getAddressComponent(result: any, type: string) {
  const component = result.address_components.find((c: any) =>
    c.types.includes(type),
  );
  return component ? component.long_name : null;
}

// 生成模拟地理编码数据
function generateMockGeocodeData(address: string) {
  const currentTime = new Date().toLocaleString("zh-CN");

  // 根据地址生成伪随机坐标
  const addressHash = Array.from(address).reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0,
  );
  const latBase = 22 + (addressHash % 20);
  const lngBase = 100 + (addressHash % 30);

  const lat = latBase + Math.random() * 10;
  const lng = lngBase + Math.random() * 10;

  // 模拟地址组件
  const country = "中国";
  let province = "未知省份";
  let city = "未知城市";

  if (address.includes("北京")) {
    province = "北京市";
    city = "北京市";
  } else if (address.includes("上海")) {
    province = "上海市";
    city = "上海市";
  } else if (address.includes("广州")) {
    province = "广东省";
    city = "广州市";
  } else if (address.includes("深圳")) {
    province = "广东省";
    city = "深圳市";
  }

  return `# 🗺️ 地理编码结果 (演示模式)

## 📍 查询地址
${address}

## 🌐 地理坐标
• **纬度**：${lat.toFixed(6)}
• **经度**：${lng.toFixed(6)}
• **精确度**：近似

## 📮 地址详情
• **国家/地区**：${country}
• **省/州**：${province}
• **城市**：${city}
• **区/县**：城区
• **街道**：模拟街道
• **邮政编码**：${100000 + (addressHash % 900000)}

## 📝 完整地址
${country}${province}${city}${address}

## ⏰ 查询信息
• **查询时间**：${currentTime}
• **地址类型**：地址

## ⚠️ 提示
当前为演示模式，显示模拟地理编码数据。要获取真实数据，请配置Google Maps API密钥。
`;
}

// API路由处理函数
export async function POST(request: NextRequest) {
  // 应用请求限流
  const rateLimitResult = await applyRateLimit(request, {
    limit: 30,
    windowMs: 60 * 1000, // 1分钟
    identifier: "geocode-api",
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
    const { address } = body;

    if (!address) {
      return NextResponse.json(
        { error: "请提供地址", code: "MISSING_ADDRESS" },
        { status: 400 },
      );
    }

    // 使用缓存版本的函数获取地理编码数据
    const result = await geocodeAddressCached(address);

    if (result.success) {
      return NextResponse.json({ data: result.data, demo: result.demo });
    } else {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("地理编码API处理错误:", error);
    return NextResponse.json(
      { error: "处理请求时发生错误", code: "SERVER_ERROR" },
      { status: 500 },
    );
  }
}
