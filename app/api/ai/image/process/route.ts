import { type NextRequest, NextResponse } from "next/server";
import { aiImageEngine, ImageProcessingType } from "@/lib/ai-image-engine";
import { withErrorHandling } from "@/middleware/error-handler";
import { createAPIError, ErrorType } from "@/lib/error-handler";

export async function POST(request: NextRequest) {
  return withErrorHandling(
    request,
    async () => {
      const formData = await request.formData();
      const imageFile = formData.get("image") as File;
      const processingType = formData.get(
        "processingType",
      ) as ImageProcessingType;
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
          "请提供要处理的图像文件",
        );
      }

      if (!processingType) {
        throw createAPIError(
          ErrorType.VALIDATION_ERROR,
          "MISSING_PROCESSING_TYPE",
          "请指定处理类型",
        );
      }

      // 验证处理类型
      if (!Object.values(ImageProcessingType).includes(processingType)) {
        throw createAPIError(
          ErrorType.VALIDATION_ERROR,
          "INVALID_PROCESSING_TYPE",
          "不支持的处理类型",
        );
      }

      // 执行图像处理
      const result = await aiImageEngine.processImage(
        imageFile,
        processingType,
        options,
      );

      return NextResponse.json({
        success: true,
        data: result,
      });
    },
    "ai_image_processing",
  );
}
