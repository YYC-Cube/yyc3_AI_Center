import { type NextRequest, NextResponse } from "next/server";
import { aiTextEngine, TextGenerationType } from "@/lib/ai-text-engine";
import { withErrorHandling } from "@/middleware/error-handler";
import { createAPIError, ErrorType } from "@/lib/error-handler";

export async function POST(request: NextRequest) {
  return withErrorHandling(
    request,
    async () => {
      const body = await request.json();
      const { prompt, generationType, options = {} } = body;

      // 验证必需参数
      if (!prompt) {
        throw createAPIError(
          ErrorType.VALIDATION_ERROR,
          "MISSING_PROMPT",
          "请提供生成提示",
        );
      }

      if (!generationType) {
        throw createAPIError(
          ErrorType.VALIDATION_ERROR,
          "MISSING_GENERATION_TYPE",
          "请指定生成类型",
        );
      }

      // 验证生成类型
      if (!Object.values(TextGenerationType).includes(generationType)) {
        throw createAPIError(
          ErrorType.VALIDATION_ERROR,
          "INVALID_GENERATION_TYPE",
          "不支持的生成类型",
        );
      }

      // 执行文本生成
      const result = await aiTextEngine.generateText(
        prompt,
        generationType,
        options,
      );

      return NextResponse.json({
        success: true,
        data: result,
      });
    },
    "ai_text_generation",
  );
}
