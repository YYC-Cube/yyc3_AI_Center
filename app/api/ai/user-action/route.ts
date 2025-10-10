import { type NextRequest, NextResponse } from "next/server";
import {
  aiRecommendationEngine,
  UserActionType,
} from "@/lib/ai-recommendation-engine";
import { withErrorHandling } from "@/middleware/error-handler";
import { createAPIError, ErrorType } from "@/lib/error-handler";

export async function POST(request: NextRequest) {
  return withErrorHandling(
    request,
    async () => {
      const body = await request.json();
      const { userId, itemId, actionType, context, weight } = body;

      // 验证必需参数
      if (!userId) {
        throw createAPIError(
          ErrorType.VALIDATION_ERROR,
          "MISSING_USER_ID",
          "请提供用户ID",
        );
      }

      if (!itemId) {
        throw createAPIError(
          ErrorType.VALIDATION_ERROR,
          "MISSING_ITEM_ID",
          "请提供项目ID",
        );
      }

      if (!actionType) {
        throw createAPIError(
          ErrorType.VALIDATION_ERROR,
          "MISSING_ACTION_TYPE",
          "请指定行为类型",
        );
      }

      // 验证行为类型
      if (!Object.values(UserActionType).includes(actionType)) {
        throw createAPIError(
          ErrorType.VALIDATION_ERROR,
          "INVALID_ACTION_TYPE",
          "不支持的行为类型",
        );
      }

      // 记录用户行为
      await aiRecommendationEngine.recordUserAction({
        userId,
        itemId,
        actionType,
        timestamp: Date.now(),
        context,
        weight,
      });

      return NextResponse.json({
        success: true,
        message: "用户行为记录成功",
      });
    },
    "user_action_recording",
  );
}
