import { type NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rate-limiter";
import QRCode from "qrcode";

// API路由处理函数
export async function POST(request: NextRequest) {
  // 应用请求限流
  const rateLimitResult = await applyRateLimit(request, {
    limit: 30,
    windowMs: 60 * 1000, // 1分钟
    identifier: "qrcode-api",
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
    const {
      content,
      format = "svg",
      errorCorrectionLevel = "M",
      color = "#000000",
      backgroundColor = "#ffffff",
      margin = 4,
      width = 300,
    } = body;

    if (!content) {
      return NextResponse.json(
        { error: "请提供二维码内容", code: "MISSING_CONTENT" },
        { status: 400 },
      );
    }

    // 验证格式
    if (!["svg", "png", "data-url"].includes(format)) {
      return NextResponse.json(
        {
          error: "不支持的格式，请使用 svg, png 或 data-url",
          code: "INVALID_FORMAT",
        },
        { status: 400 },
      );
    }

    // 验证纠错级别
    if (!["L", "M", "Q", "H"].includes(errorCorrectionLevel)) {
      return NextResponse.json(
        {
          error: "不支持的纠错级别，请使用 L, M, Q 或 H",
          code: "INVALID_ERROR_CORRECTION",
        },
        { status: 400 },
      );
    }

    // 生成二维码
    const options = {
      errorCorrectionLevel,
      type: format === "data-url" ? "image/png" : format,
      margin,
      width,
      color: {
        dark: color,
        light: backgroundColor,
      },
    };

    let qrCodeData;
    if (format === "svg") {
      qrCodeData = await QRCode.toString(content, options);
    } else {
      qrCodeData = await QRCode.toDataURL(content, options);
    }

    // 返回二维码数据
    return NextResponse.json({
      data: qrCodeData,
      format,
      content,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("二维码生成错误:", error);
    return NextResponse.json(
      { error: "生成二维码时发生错误", code: "GENERATION_ERROR" },
      { status: 500 },
    );
  }
}
