"""
Gradio 完整功能演示
展示 Gradio 的核心功能和最佳实践
"""

import gradio as gr
import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
from PIL import Image, ImageFilter, ImageEnhance
import random
import datetime
import json
import io
import base64


def text_analysis(text):
    """文本分析函数"""
    if not text:
        return "请输入文本进行分析"

    word_count = len(text.split())
    char_count = len(text)

    return f"""
📊 文本分析结果：
- 字符数：{char_count}
- 单词数：{word_count}
- 平均单词长度：{char_count/word_count:.2f}
"""


def image_filter(image, filter_type):
    """图像滤镜处理"""
    if image is None:
        return None

    # 简单的图像处理示例
    if filter_type == "灰度":
        # 转换为灰度
        gray = np.dot(image[..., :3], [0.2989, 0.5870, 0.1140])
        return np.stack([gray, gray, gray], axis=-1).astype(np.uint8)
    elif filter_type == "反色":
        return 255 - image
    else:
        return image


def create_plot(data_type, num_points):
    """创建数据可视化图表"""
    x = np.linspace(0, 10, num_points)

    if data_type == "正弦波":
        y = np.sin(x)
        title = "正弦波函数"
    elif data_type == "余弦波":
        y = np.cos(x)
        title = "余弦波函数"
    else:
        y = np.random.randn(num_points)
        title = "随机数据"

    plt.figure(figsize=(10, 6))
    plt.plot(x, y, "b-", linewidth=2)
    plt.title(title)
    plt.xlabel("X 轴")
    plt.ylabel("Y 轴")
    plt.grid(True, alpha=0.3)

    return plt


# 创建 Gradio 界面
with gr.Blocks(title="🚀 Gradio 完整功能演示", theme=gr.themes.Soft()) as demo:
    gr.Markdown(
        """
    # 🚀 Gradio 完整功能演示
    
    这是一个展示 Gradio 核心功能的综合演示，包括：
    - 📝 文本处理
    - 🖼️ 图像处理  
    - 📊 数据可视化
    - 🎛️ 交互式控件
    """
    )

    with gr.Tabs():
        # 文本处理标签页
        with gr.TabItem("📝 文本处理"):
            with gr.Row():
                with gr.Column():
                    text_input = gr.Textbox(
                        label="输入文本",
                        placeholder="在这里输入要分析的文本...",
                        lines=5,
                    )
                    analyze_btn = gr.Button("🔍 分析文本", variant="primary")

                with gr.Column():
                    text_output = gr.Markdown(label="分析结果")

            analyze_btn.click(text_analysis, inputs=text_input, outputs=text_output)

        # 图像处理标签页
        with gr.TabItem("🖼️ 图像处理"):
            with gr.Row():
                with gr.Column():
                    image_input = gr.Image(label="上传图像")
                    filter_choice = gr.Radio(
                        choices=["原图", "灰度", "反色"], label="选择滤镜", value="原图"
                    )
                    process_btn = gr.Button("🎨 应用滤镜", variant="primary")

                with gr.Column():
                    image_output = gr.Image(label="处理结果")

            process_btn.click(
                image_filter, inputs=[image_input, filter_choice], outputs=image_output
            )

        # 数据可视化标签页
        with gr.TabItem("📊 数据可视化"):
            with gr.Row():
                with gr.Column():
                    data_type = gr.Dropdown(
                        choices=["正弦波", "余弦波", "随机数据"],
                        label="数据类型",
                        value="正弦波",
                    )
                    num_points = gr.Slider(
                        minimum=10, maximum=1000, value=100, step=10, label="数据点数量"
                    )
                    plot_btn = gr.Button("📈 生成图表", variant="primary")

                with gr.Column():
                    plot_output = gr.Plot(label="数据图表")

            plot_btn.click(
                create_plot, inputs=[data_type, num_points], outputs=plot_output
            )

    gr.Markdown(
        """
    ## 🎯 功能特点
    
    - **响应式设计**：自适应不同屏幕尺寸
    - **实时交互**：即时反馈用户操作
    - **多媒体支持**：文本、图像、图表等多种数据类型
    - **现代化界面**：使用 Soft 主题提供优雅的用户体验
    """
    )

if __name__ == "__main__":
    demo.launch()
