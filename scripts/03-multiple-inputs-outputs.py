"""
多输入输出演示
展示如何处理多个输入和生成多个输出
"""

import gradio as gr
import random


def comprehensive_analysis(text, number, operation):
    """综合分析函数 - 多输入多输出"""

    # 文本分析
    if text:
        text_length = len(text)
        word_count = len(text.split())
        text_analysis = f"文本长度：{text_length} 字符，{word_count} 个单词"
    else:
        text_analysis = "未提供文本"

    # 数字处理
    if operation == "平方":
        number_result = number**2
        math_operation = f"{number}² = {number_result}"
    elif operation == "立方":
        number_result = number**3
        math_operation = f"{number}³ = {number_result}"
    elif operation == "平方根":
        number_result = number**0.5
        math_operation = f"√{number} = {number_result:.2f}"
    else:
        number_result = number * 2
        math_operation = f"{number} × 2 = {number_result}"

    # 生成随机建议
    suggestions = [
        "尝试输入更长的文本进行分析",
        "可以尝试不同的数学运算",
        "试试修改输入参数看看效果",
        "这个组合很有趣！",
        "继续探索不同的输入组合",
    ]
    random_suggestion = random.choice(suggestions)

    # 综合报告
    comprehensive_report = f"""
# 📊 综合分析报告

## 📝 文本分析
{text_analysis}

## 🔢 数学运算
{math_operation}

## 💡 建议
{random_suggestion}

## 📈 评分
处理质量：{random.randint(85, 100)}/100
"""

    return text_analysis, math_operation, random_suggestion, comprehensive_report


# 创建多输入多输出界面
demo = gr.Interface(
    fn=comprehensive_analysis,
    inputs=[
        gr.Textbox(label="📝 文本输入", placeholder="输入要分析的文本...", lines=3),
        gr.Number(label="🔢 数字输入", value=10, minimum=-100, maximum=100),
        gr.Radio(
            label="🧮 数学运算",
            choices=["平方", "立方", "平方根", "双倍"],
            value="平方",
        ),
    ],
    outputs=[
        gr.Textbox(label="📝 文本分析结果"),
        gr.Textbox(label="🔢 数学运算结果"),
        gr.Textbox(label="💡 随机建议"),
        gr.Markdown(label="📊 综合报告"),
    ],
    title="🎯 多输入输出演示",
    description="展示如何处理多个输入并生成多个不同类型的输出",
    article="""
## 🔧 技术要点

### 多输入处理
- 函数参数顺序必须与 `inputs` 列表顺序一致
- 每个参数对应一个输入组件
- 可以处理不同类型的输入数据

### 多输出生成
- 函数返回值数量必须与 `outputs` 列表长度匹配
- 返回值类型应与输出组件兼容
- 可以返回不同格式的数据（文本、Markdown、图像等）

### 最佳实践
1. **参数验证**：检查输入参数的有效性
2. **错误处理**：处理可能的异常情况
3. **类型匹配**：确保返回值类型正确
4. **用户体验**：提供有意义的输出信息
""",
    examples=[
        ["人工智能正在改变世界", 5, "平方"],
        ["Gradio 是一个很棒的工具", 8, "立方"],
        ["机器学习让一切变得可能", 12, "平方根"],
    ],
)

if __name__ == "__main__":
    demo.launch()
