import { type NextRequest, NextResponse } from "next/server";
import {
  aiRecommendationEngine,
  RecommendationType,
  RecommendationAlgorithm,
} from "@/lib/ai-recommendation-engine";
import { withErrorHandling } from "@/middleware/error-handler";
import { createAPIError, ErrorType } from "@/lib/error-handler";

export async function POST(request: NextRequest) {
  return withErrorHandling(
    request,
    async () => {
      const body = await request.json();
      const { userId, type, options = {} } = body;

      // 验证必需参数
      if (!userId) {
        throw createAPIError(
          ErrorType.VALIDATION_ERROR,
          "MISSING_USER_ID",
          "请提供用户ID",
        );
      }

      if (!type) {
        throw createAPIError(
          ErrorType.VALIDATION_ERROR,
          "MISSING_TYPE",
          "请指定推荐类型",
        );
      }

      // 验证推荐类型
      if (!Object.values(RecommendationType).includes(type)) {
        throw createAPIError(
          ErrorType.VALIDATION_ERROR,
          "INVALID_TYPE",
          "不支持的推荐类型",
        );
      }

      // 验证算法类型（如果提供）
      if (
        options.algorithm &&
        !Object.values(RecommendationAlgorithm).includes(options.algorithm)
      ) {
        throw createAPIError(
          ErrorType.VALIDATION_ERROR,
          "INVALID_ALGORITHM",
          "不支持的推荐算法",
        );
      }

      // 获取推荐结果
      const result = await aiRecommendationEngine.getRecommendations(
        userId,
        type,
        options,
      );

      return NextResponse.json({
        success: true,
        data: result,
      });
    },
    "ai_recommendations",
  );
}
