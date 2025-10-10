"""
综合功能演示
展示 Gradio Interface 的完整功能集合
"""

import gradio as gr
import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
from PIL import Image, ImageFilter
import io
import base64


def comprehensive_processor(
    text_input,
    number_input,
    slider_value,
    checkbox_value,
    radio_choice,
    dropdown_choice,
    image_input,
    file_input,
    dataframe_input,
):
    """综合处理函数 - 处理所有类型的输入"""

    results = {}

    # 1. 文本处理
    if text_input:
        text_stats = {
            "字符数": len(text_input),
            "单词数": len(text_input.split()),
            "行数": len(text_input.split("\n")),
        }
        results["text"] = text_stats

    # 2. 数值计算
    calculation_result = number_input * slider_value
    if checkbox_value:
        calculation_result *= 2
    results["calculation"] = calculation_result

    # 3. 选择处理
    choice_summary = f"单选：{radio_choice}，下拉：{dropdown_choice}"
    results["choices"] = choice_summary

    # 4. 图像处理
    processed_image = None
    if image_input is not None:
        try:
            if isinstance(image_input, np.ndarray):
                image_input = Image.fromarray(image_input)

            # 应用简单滤镜
            if radio_choice == "模糊":
                processed_image = image_input.filter(ImageFilter.BLUR)
            elif radio_choice == "锐化":
                processed_image = image_input.filter(ImageFilter.SHARPEN)
            else:
                processed_image = image_input

            results["image_processed"] = True
        except:
            results["image_processed"] = False

    # 5. 文件处理
    file_info = "未上传文件"
    if file_input is not None:
        try:
            file_info = f"文件名：{file_input.name}"
        except:
            file_info = "文件处理错误"
    results["file"] = file_info

    # 6. 数据框处理
    df_summary = "无数据"
    if dataframe_input is not None and len(dataframe_input) > 0:
        df_summary = (
            f"数据行数：{len(dataframe_input)}，列数：{len(dataframe_input.columns)}"
        )
    results["dataframe"] = df_summary

    # 7. 生成图表
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

    # 数值趋势图
    x = np.linspace(0, 10, 100)
    y = np.sin(x * slider_value) * number_input
    ax1.plot(x, y, "b-", linewidth=2)
    ax1.set_title(f"数值趋势图 (系数: {slider_value})")
    ax1.set_xlabel("X")
    ax1.set_ylabel("Y")
    ax1.grid(True, alpha=0.3)

    # 统计柱状图
    categories = ["文本", "数值", "图像", "文件", "数据框"]
    values = [
        len(text_input) if text_input else 0,
        number_input,
        1 if image_input is not None else 0,
        1 if file_input is not None else 0,
        (
            len(dataframe_input)
            if dataframe_input is not None and len(dataframe_input) > 0
            else 0
        ),
    ]

    ax2.bar(
        categories,
        values,
        color=["skyblue", "lightgreen", "lightcoral", "gold", "plum"],
    )
    ax2.set_title("输入数据统计")
    ax2.set_ylabel("数值")
    plt.xticks(rotation=45)

    plt.tight_layout()

    # 8. 生成综合报告
    report = f"""
# 📊 综合处理报告

## 📝 文本分析
{f"字符数：{results['text']['字符数']}，单词数：{results['text']['单词数']}" if 'text' in results else "未提供文本"}

## 🔢 数值计算
基础计算：{number_input} × {slider_value} = {number_input * slider_value}
{f"复选框加倍：{calculation_result}" if checkbox_value else ""}

## 🎛️ 选择结果
{choice_summary}

## 🖼️ 图像处理
{"✅ 图像处理完成" if processed_image else "❌ 无图像或处理失败"}

## 📁 文件信息
{file_info}

## 📊 数据框信息
{df_summary}

## 📈 处理状态
✅ 所有组件已处理完成
⏰ 处理时间：{pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}
"""

    return (
        report,  # Markdown 报告
        processed_image,  # 处理后的图像
        fig,  # 图表
        f"计算结果：{calculation_result}",  # 计算结果
        results,  # JSON 结果
    )


# 创建综合演示界面
demo = gr.Interface(
    fn=comprehensive_processor,
    inputs=[
        gr.Textbox(
            label="📝 文本输入",
            placeholder="输入要分析的文本...",
            lines=3,
            info="文本将被分析字符数、单词数等",
        ),
        gr.Number(
            label="🔢 数值输入",
            value=10,
            minimum=1,
            maximum=100,
            info="用于数值计算的基础数字",
        ),
        gr.Slider(
            label="🎚️ 滑块系数",
            minimum=0.1,
            maximum=5.0,
            value=1.0,
            step=0.1,
            info="数值计算的乘数系数",
        ),
        gr.Checkbox(label="☑️ 结果加倍", value=False, info="是否将计算结果加倍"),
        gr.Radio(
            label="🔘 处理模式",
            choices=["标准", "模糊", "锐化"],
            value="标准",
            info="选择图像处理模式",
        ),
        gr.Dropdown(
            label="📋 输出格式",
            choices=["简洁", "详细", "完整"],
            value="详细",
            info="选择报告输出格式",
        ),
        gr.Image(label="🖼️ 图像输入", type="pil", info="上传图像进行处理"),
        gr.File(label="📁 文件上传", info="上传任意文件"),
        gr.Dataframe(
            label="📊 数据表格",
            headers=["项目", "数值", "类别"],
            datatype=["str", "number", "str"],
            row_count=2,
            col_count=3,
            info="输入表格数据",
        ),
    ],
    outputs=[
        gr.Markdown(label="📊 综合报告"),
        gr.Image(label="🖼️ 处理后图像", type="pil"),
        gr.Plot(label="📈 数据图表"),
        gr.Textbox(label="🔢 计算结果"),
        gr.JSON(label="📋 详细结果"),
    ],
    title="🚀 Gradio 综合功能演示",
    description="展示 Gradio Interface 的完整功能集合，包括多种输入输出组件的综合使用",
    article="""
## 🎯 功能亮点

### 📊 多类型数据处理
- **文本分析**：字符统计、单词计数
- **数值计算**：基础运算、条件处理
- **图像处理**：滤镜应用、格式转换
- **文件处理**：文件信息提取
- **数据分析**：表格数据统计

### 🎨 可视化输出
- **Markdown 报告**：结构化的处理结果
- **图像输出**：处理后的图像展示
- **图表生成**：动态数据可视化
- **JSON 数据**：结构化的详细结果

### 🔧 交互特性
- **实时处理**：输入变化时自动更新
- **多组件联动**：组件间相互影响
- **条件逻辑**：基于用户选择的不同处理
- **错误处理**：友好的错误提示

### 💡 应用场景
- **数据分析工具**：多维度数据处理
- **内容处理平台**：文本、图像、文件处理
- **原型开发**：快速构建功能原型
- **教学演示**：交互式学习工具
""",
    examples=[
        [
            "这是一个测试文本，用于演示 Gradio 的强大功能。",
            15,
            2.5,
            True,
            "模糊",
            "详细",
            "/placeholder.svg?height=200&width=300",
            None,
            [["项目A", 100, "类型1"], ["项目B", 200, "类型2"]],
        ]
    ],
    cache_examples=True,
)

if __name__ == "__main__":
    demo.launch()
