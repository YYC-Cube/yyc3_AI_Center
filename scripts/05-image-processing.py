"""
图像处理演示
展示 Gradio 的图像处理功能
"""

import gradio as gr
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance
import io


def process_image(image, filter_type, brightness, contrast, blur_radius):
    """图像处理函数"""
    if image is None:
        return None, "❌ 请先上传图像"

    try:
        # 确保输入是 PIL Image
        if isinstance(image, np.ndarray):
            image = Image.fromarray(image)

        # 应用滤镜
        processed_image = image.copy()

        if filter_type == "灰度":
            processed_image = processed_image.convert("L").convert("RGB")
        elif filter_type == "反色":
            processed_image = Image.eval(processed_image, lambda x: 255 - x)
        elif filter_type == "浮雕":
            processed_image = processed_image.filter(ImageFilter.EMBOSS)
        elif filter_type == "边缘检测":
            processed_image = processed_image.filter(ImageFilter.FIND_EDGES)
        elif filter_type == "锐化":
            processed_image = processed_image.filter(ImageFilter.SHARPEN)

        # 调整亮度
        if brightness != 1.0:
            enhancer = ImageEnhance.Brightness(processed_image)
            processed_image = enhancer.enhance(brightness)

        # 调整对比度
        if contrast != 1.0:
            enhancer = ImageEnhance.Contrast(processed_image)
            processed_image = enhancer.enhance(contrast)

        # 应用模糊
        if blur_radius > 0:
            processed_image = processed_image.filter(
                ImageFilter.GaussianBlur(radius=blur_radius)
            )

        # 生成处理信息
        info = f"""
✅ 图像处理完成！

📊 处理参数：
- 滤镜类型：{filter_type}
- 亮度调整：{brightness:.1f}
- 对比度调整：{contrast:.1f}
- 模糊半径：{blur_radius}

📏 图像信息：
- 尺寸：{processed_image.size[0]} × {processed_image.size[1]}
- 模式：{processed_image.mode}
"""

        return processed_image, info

    except Exception as e:
        return None, f"❌ 处理错误：{str(e)}"


def reset_parameters():
    """重置所有参数到默认值"""
    return "原图", 1.0, 1.0, 0


# 创建图像处理界面
demo = gr.Interface(
    fn=process_image,
    inputs=[
        gr.Image(label="📷 上传图像", type="pil", info="支持 JPG、PNG、GIF 等格式"),
        gr.Dropdown(
            label="🎨 选择滤镜",
            choices=["原图", "灰度", "反色", "浮雕", "边缘检测", "锐化"],
            value="原图",
            info="选择要应用的图像滤镜",
        ),
        gr.Slider(
            label="☀️ 亮度调整",
            minimum=0.1,
            maximum=2.0,
            value=1.0,
            step=0.1,
            info="调整图像亮度（1.0为原始亮度）",
        ),
        gr.Slider(
            label="🌈 对比度调整",
            minimum=0.1,
            maximum=2.0,
            value=1.0,
            step=0.1,
            info="调整图像对比度（1.0为原始对比度）",
        ),
        gr.Slider(
            label="🌫️ 模糊程度",
            minimum=0,
            maximum=10,
            value=0,
            step=0.5,
            info="应用高斯模糊（0为无模糊）",
        ),
    ],
    outputs=[
        gr.Image(label="🖼️ 处理结果", type="pil"),
        gr.Textbox(label="📋 处理信息", lines=10, interactive=False),
    ],
    title="🎨 图像处理工具",
    description="上传图像并应用各种滤镜和调整效果",
    article="""
## 🔧 功能说明

### 🎨 滤镜效果
- **灰度**：将彩色图像转换为灰度图像
- **反色**：反转图像颜色（负片效果）
- **浮雕**：创建浮雕艺术效果
- **边缘检测**：突出显示图像边缘
- **锐化**：增强图像细节和清晰度

### 🎛️ 参数调整
- **亮度**：控制图像整体明暗程度
- **对比度**：调整明暗对比强度
- **模糊**：应用高斯模糊效果

### 💡 使用技巧
1. 先选择滤镜，再调整参数
2. 可以组合多种效果
3. 实时预览处理结果
4. 支持多种图像格式
""",
    examples=[
        ["/placeholder.svg?height=300&width=400", "灰度", 1.0, 1.0, 0],
        ["/placeholder.svg?height=300&width=400", "浮雕", 1.2, 1.3, 0],
        ["/placeholder.svg?height=300&width=400", "边缘检测", 0.8, 1.5, 1],
    ],
)

if __name__ == "__main__":
    demo.launch()
