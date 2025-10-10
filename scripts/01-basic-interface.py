"""
Gradio 基础 Interface 演示
展示最简单的 Gradio 应用创建方法
"""

import gradio as gr


def greet(name):
    """简单的问候函数"""
    if not name:
        return "你好，陌生人！👋"
    return f"你好，{name}！很高兴见到你！😊"


def calculate_square(number):
    """计算平方数"""
    try:
        result = float(number) ** 2
        return f"{number} 的平方是 {result}"
    except:
        return "请输入有效的数字"


def text_length(text):
    """计算文本长度"""
    if not text:
        return "请输入文本"

    char_count = len(text)
    word_count = len(text.split())

    return f"字符数：{char_count}，单词数：{word_count}"


# 创建基础 Interface
demo1 = gr.Interface(
    fn=greet,
    inputs=gr.Textbox(label="请输入你的名字", placeholder="在这里输入..."),
    outputs=gr.Textbox(label="问候语"),
    title="🤝 简单问候应用",
    description="输入你的名字，获得个性化问候！",
)

demo2 = gr.Interface(
    fn=calculate_square,
    inputs=gr.Number(label="输入数字"),
    outputs=gr.Textbox(label="计算结果"),
    title="🔢 平方计算器",
    description="输入一个数字，计算它的平方值",
)

demo3 = gr.Interface(
    fn=text_length,
    inputs=gr.Textbox(label="输入文本", lines=3),
    outputs=gr.Textbox(label="统计结果"),
    title="📝 文本统计工具",
    description="统计文本的字符数和单词数",
)

# 组合多个演示
demo = gr.TabbedInterface(
    [demo1, demo2, demo3],
    ["问候应用", "平方计算", "文本统计"],
    title="🚀 Gradio 基础 Interface 演示",
)

if __name__ == "__main__":
    demo.launch()
