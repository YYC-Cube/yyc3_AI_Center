"""
标准 Interface 演示
展示标准的输入输出 Interface 模式
"""

import gradio as gr


def text_processor(input_text, processing_mode, case_option):
    """文本处理函数"""
    if not input_text:
        return "请输入文本进行处理"

    result = input_text

    # 根据处理模式进行处理
    if processing_mode == "清理":
        result = result.strip()
    elif processing_mode == "反转":
        result = result[::-1]
    elif processing_mode == "统计":
        word_count = len(result.split())
        char_count = len(result)
        return f"字符数：{char_count}，单词数：{word_count}"

    # 根据大小写选项处理
    if case_option == "大写":
        result = result.upper()
    elif case_option == "小写":
        result = result.lower()
    elif case_option == "首字母大写":
        result = result.title()

    return result


# 创建标准 Interface
demo = gr.Interface(
    fn=text_processor,
    inputs=[
        gr.Textbox(
            label="📝 输入文本", placeholder="在这里输入要处理的文本...", lines=3
        ),
        gr.Radio(label="🔧 处理模式", choices=["清理", "反转", "统计"], value="清理"),
        gr.Dropdown(
            label="🔤 大小写选项",
            choices=["保持原样", "大写", "小写", "首字母大写"],
            value="保持原样",
        ),
    ],
    outputs=gr.Textbox(label="📊 处理结果", lines=3),
    title="📝 标准文本处理器",
    description="这是一个标准的 Gradio Interface 演示，展示了基本的输入输出模式",
    article="""
## 🔧 功能说明

### 处理模式
- **清理**：去除文本首尾空格
- **反转**：将文本内容反转
- **统计**：统计字符数和单词数

### 大小写选项
- **保持原样**：不改变大小写
- **大写**：转换为大写字母
- **小写**：转换为小写字母
- **首字母大写**：每个单词首字母大写

这是最常见的 Interface 模式：用户提供输入 → 系统处理 → 返回结果
""",
    examples=[
        ["Hello World!", "清理", "大写"],
        ["Gradio 很棒", "反转", "保持原样"],
        ["这是一个测试文本", "统计", "保持原样"],
    ],
)

if __name__ == "__main__":
    demo.launch()
