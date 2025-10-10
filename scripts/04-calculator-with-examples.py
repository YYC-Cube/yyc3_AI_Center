"""
带示例的计算器演示
展示如何添加预设示例和更丰富的功能
"""

import gradio as gr
import math


def advanced_calculator(num1, num2, operation):
    """高级计算器函数"""
    try:
        num1 = float(num1)
        num2 = float(num2)

        if operation == "加法 ➕":
            result = num1 + num2
            formula = f"{num1} + {num2} = {result}"
        elif operation == "减法 ➖":
            result = num1 - num2
            formula = f"{num1} - {num2} = {result}"
        elif operation == "乘法 ✖️":
            result = num1 * num2
            formula = f"{num1} × {num2} = {result}"
        elif operation == "除法 ➗":
            if num2 == 0:
                return "❌ 错误：除数不能为零！", "无法计算", "请检查输入"
            result = num1 / num2
            formula = f"{num1} ÷ {num2} = {result}"
        elif operation == "幂运算 🔢":
            result = num1**num2
            formula = f"{num1}^{num2} = {result}"
        elif operation == "取模 📐":
            if num2 == 0:
                return "❌ 错误：模数不能为零！", "无法计算", "请检查输入"
            result = num1 % num2
            formula = f"{num1} mod {num2} = {result}"
        else:
            return "❌ 未知运算", "无法计算", "请选择有效的运算"

        # 生成详细说明
        if abs(result) > 1000000:
            explanation = "结果是一个很大的数！"
        elif abs(result) < 0.001:
            explanation = "结果是一个很小的数！"
        elif result == int(result):
            explanation = "结果是一个整数"
        else:
            explanation = f"结果保留3位小数：{result:.3f}"

        # 格式化最终结果
        if result == int(result):
            formatted_result = str(int(result))
        else:
            formatted_result = f"{result:.6f}".rstrip("0").rstrip(".")

        return f"✅ {formula}", formatted_result, explanation

    except ValueError:
        return "❌ 输入错误：请输入有效数字", "无法计算", "请检查输入格式"
    except Exception as e:
        return f"❌ 计算错误：{str(e)}", "无法计算", "发生未知错误"


# 创建计算器界面
demo = gr.Interface(
    fn=advanced_calculator,
    inputs=[
        gr.Number(label="🔢 第一个数字", value=10, info="输入第一个操作数"),
        gr.Number(label="🔢 第二个数字", value=5, info="输入第二个操作数"),
        gr.Dropdown(
            label="🧮 选择运算",
            choices=["加法 ➕", "减法 ➖", "乘法 ✖️", "除法 ➗", "幂运算 🔢", "取模 📐"],
            value="加法 ➕",
            info="选择要执行的数学运算",
        ),
    ],
    outputs=[
        gr.Textbox(label="📝 计算公式", interactive=False),
        gr.Textbox(label="🎯 计算结果", interactive=False),
        gr.Textbox(label="💡 结果说明", interactive=False),
    ],
    title="🧮 高级计算器",
    description="支持多种数学运算的智能计算器，包含详细的计算过程和结果说明",
    article="""
## 🔧 支持的运算类型

- **基础运算**：加法、减法、乘法、除法
- **高级运算**：幂运算、取模运算
- **智能提示**：自动检测结果特征并提供说明
- **错误处理**：友好的错误提示和异常处理

## 💡 使用技巧

1. **除法运算**：注意除数不能为零
2. **幂运算**：支持小数指数和负数指数
3. **取模运算**：计算两数相除的余数
4. **大数处理**：自动识别和处理大数结果
""",
    examples=[
        [10, 5, "加法 ➕"],
        [20, 3, "除法 ➗"],
        [2, 8, "幂运算 🔢"],
        [17, 5, "取模 📐"],
        [100, 7, "乘法 ✖️"],
        [50, 12, "减法 ➖"],
    ],
    cache_examples=True,  # 缓存示例结果以提高性能
)

if __name__ == "__main__":
    demo.launch()
