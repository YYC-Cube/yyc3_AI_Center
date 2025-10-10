import { type NextRequest, NextResponse } from "next/server";
import { clearServiceCache, warmupCache } from "@/lib/cache-manager";

export async function POST(request: NextRequest) {
  try {
    const { action, service, params } = await request.json();

    switch (action) {
      case "clear":
        if (!service) {
          return NextResponse.json(
            { error: "服务名称不能为空" },
            { status: 400 },
          );
        }
        await clearServiceCache(service);
        return NextResponse.json({ message: `${service} 缓存已清空` });

      case "warmup":
        if (!service || !params) {
          return NextResponse.json(
            { error: "服务名称和参数不能为空" },
            { status: 400 },
          );
        }
        await warmupCache(service, params);
        return NextResponse.json({ message: `${service} 缓存预热完成` });

      default:
        return NextResponse.json({ error: "不支持的操作" }, { status: 400 });
    }
  } catch (error) {
    console.error("Cache management error:", error);
    return NextResponse.json({ error: "缓存管理操作失败" }, { status: 500 });
  }
}
