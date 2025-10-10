import { type NextRequest, NextResponse } from "next/server";
import { aiTextEngine, TextAnalysisType } from "@/lib/ai-text-engine";
import { withErrorHandling } from "@/middleware/error-handler";
import { createAPIError, ErrorType } from "@/lib/error-handler";

export async function POST(request: NextRequest) {
  return withErrorHandling(
    request,
    async () => {
      const body = await request.json();
      const { text, analysisType, options = {} } = body;

      // 验证必需参数
      if (!text) {
        throw createAPIError(
          ErrorType.VALIDATION_ERROR,
          "MISSING_TEXT",
          "请提供要分析的文本",
        );
      }

      if (!analysisType) {
        throw createAPIError(
          ErrorType.VALIDATION_ERROR,
          "MISSING_ANALYSIS_TYPE",
          "请指定分析类型",
        );
      }

      // 验证分析类型
      if (!Object.values(TextAnalysisType).includes(analysisType)) {
        throw createAPIError(
          ErrorType.VALIDATION_ERROR,
          "INVALID_ANALYSIS_TYPE",
          "不支持的分析类型",
        );
      }

      // 执行文本分析
      const result = await aiTextEngine.analyzeText(
        text,
        analysisType,
        options,
      );

      return NextResponse.json({
        success: true,
        data: result,
      });
    },
    "ai_text_analysis",
  );
}
