import { NextResponse } from "next/server";
import { errorLogger } from "@/lib/error-logger";

export async function GET() {
  try {
    const report = errorLogger.generateErrorReport();
    return NextResponse.json(report);
  } catch (error) {
    console.error("生成错误报告失败:", error);
    return NextResponse.json({ error: "生成错误报告失败" }, { status: 500 });
  }
}
