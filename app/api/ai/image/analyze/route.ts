import { type NextRequest, NextResponse } from "next/server";
import { aiImageEngine, ImageAnalysisType } from "@/lib/ai-image-engine";
import { withErrorHandling } from "@/middleware/error-handler";
import { createAPIError, ErrorType } from "@/lib/error-handler";

export async function POST(request: NextRequest) {
  return withErrorHandling(
    request,
    async () => {
      const formData = await request.formData();
      const imageFile = formData.get("image") as File;
      const analysisType = formData.get("analysisType") as ImageAnalysisType;
      const optionsStr = formData.get("options") as string;

      let options = {};
      if (optionsStr) {
        try {
          options = JSON.parse(optionsStr);
        } catch (error) {
          throw createAPIError(
            ErrorType.VALIDATION_ERROR,
            "INVALID_OPTIONS",
            "选项格式错误",
          );
        }
      }

      // 验证必需参数
      if (!imageFile) {
        throw createAPIError(
          ErrorType.VALIDATION_ERROR,
          "MISSING_IMAGE",
          "请提供要分析的图像文件",
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
      if (!Object.values(ImageAnalysisType).includes(analysisType)) {
        throw createAPIError(
          ErrorType.VALIDATION_ERROR,
          "INVALID_ANALYSIS_TYPE",
          "不支持的分析类型",
        );
      }

      // 执行图像分析
      const result = await aiImageEngine.analyzeImage(
        imageFile,
        analysisType,
        options,
      );

      return NextResponse.json({
        success: true,
        data: result,
      });
    },
    "ai_image_analysis",
  );
}
