"""
仅输出 Interface 演示
展示无需用户输入，仅生成输出的 Interface 模式
"""

import gradio as gr
import random
import datetime
import matplotlib.pyplot as plt
import numpy as np


def generate_random_quote():
    """生成随机励志名言"""
    quotes = [
        "成功不是终点，失败不是致命的，重要的是继续前进的勇气。",
        "创新区别于领导者和跟随者。",
        "你的时间有限，不要浪费在重复别人的生活上。",
        "保持饥饿，保持愚蠢。",
        "唯一不可能的旅程是你从未开始的那一个。",
        "生活就像骑自行车，要保持平衡就得不断前进。",
        "想象力比知识更重要。",
        "不要害怕放弃好的去追求伟大的。",
        "成功的秘诀就是每天都比昨天更好一点点。",
        "机会总是留给有准备的人。",
    ]

    selected_quote = random.choice(quotes)
    author_info = "—— 智慧格言"
    timestamp = datetime.datetime.now().strftime("%Y年%m月%d日 %H:%M")

    return f"""
## 💡 今日励志

> {selected_quote}

{author_info}

---
📅 生成时间：{timestamp}
🎲 随机编号：#{random.randint(1000, 9999)}
"""


def generate_random_data():
    """生成随机数据图表"""
    # 生成随机数据
    categories = ["产品A", "产品B", "产品C", "产品D", "产品E"]
    values = [random.randint(20, 100) for _ in categories]

    # 创建图表
    plt.figure(figsize=(10, 6))
    bars = plt.bar(
        categories,
        values,
        color=["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"],
    )

    # 添加数值标签
    for bar, value in zip(bars, values):
        plt.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + 1,
            str(value),
            ha="center",
            va="bottom",
            fontweight="bold",
        )

    plt.title("📊 随机销售数据", fontsize=16, fontweight="bold", pad=20)
    plt.xlabel("产品类别", fontsize=12)
    plt.ylabel("销售量", fontsize=12)
    plt.ylim(0, max(values) + 20)

    # 添加网格
    plt.grid(axis="y", alpha=0.3, linestyle="--")

    # 美化图表
    plt.tight_layout()

    return plt


def generate_random_number():
    """生成随机数字和统计信息"""
    # 生成随机数据
    numbers = [random.randint(1, 100) for _ in range(10)]

    # 计算统计信息
    avg = sum(numbers) / len(numbers)
    max_num = max(numbers)
    min_num = min(numbers)

    result = f"""
🎲 随机数字序列：{', '.join(map(str, numbers))}

📊 统计信息：
• 平均值：{avg:.2f}
• 最大值：{max_num}
• 最小值：{min_num}
• 总和：{sum(numbers)}
• 数量：{len(numbers)}
"""

    return result


def generate_current_time():
    """生成当前时间信息"""
    now = datetime.datetime.now()

    time_info = f"""
⏰ 当前时间信息

📅 日期：{now.strftime('%Y年%m月%d日')}
🕐 时间：{now.strftime('%H:%M:%S')}
📆 星期：{now.strftime('%A')}
🗓️ 第{now.strftime('%j')}天（今年）
📊 第{now.strftime('%U')}周（今年）

🌍 时区信息：
• UTC 时间：{datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}
• 时间戳：{int(now.timestamp())}
"""

    return time_info


# 创建仅输出演示界面
with gr.Blocks(title="🎲 仅输出演示") as demo:
    gr.Markdown(
        """
    # 🎲 仅输出 Interface 演示
    
    这些演示展示了无需用户输入的 Interface 模式，每次点击按钮都会生成新的内容。
    """
    )

    with gr.Tabs():
        # 励志名言生成器
        with gr.TabItem("💡 励志名言"):
            gr.Markdown("点击按钮获取随机励志名言")

            quote_btn = gr.Button("🎲 获取励志名言", variant="primary", size="lg")
            quote_output = gr.Markdown()

            quote_btn.click(generate_random_quote, outputs=quote_output)

        # 随机数据图表
        with gr.TabItem("📊 数据图表"):
            gr.Markdown("点击按钮生成随机销售数据图表")

            chart_btn = gr.Button("📈 生成数据图表", variant="primary", size="lg")
            chart_output = gr.Plot()

            chart_btn.click(generate_random_data, outputs=chart_output)

        # 随机数字生成器
        with gr.TabItem("🔢 随机数字"):
            gr.Markdown("点击按钮生成随机数字序列和统计信息")

            number_btn = gr.Button("🎲 生成随机数字", variant="primary", size="lg")
            number_output = gr.Textbox(label="随机数字统计", lines=8, interactive=False)

            number_btn.click(generate_random_number, outputs=number_output)

        # 时间信息
        with gr.TabItem("⏰ 时间信息"):
            gr.Markdown("点击按钮获取当前时间的详细信息")

            time_btn = gr.Button("🕐 获取当前时间", variant="primary", size="lg")
            time_output = gr.Textbox(label="时间信息", lines=10, interactive=False)

            time_btn.click(generate_current_time, outputs=time_output)

    gr.Markdown(
        """
    ## 🔧 仅输出模式特点
    
    ### 📋 应用场景
    - **内容生成**：随机名言、文章、创意内容
    - **数据展示**：实时数据、统计图表、报告
    - **工具功能**：时间查询、随机数生成、系统信息
    - **娱乐应用**：随机笑话、占卜、游戏
    
    ### 💡 设计优势
    - **简单易用**：无需复杂输入，一键获取结果
    - **即时反馈**：点击即可获得新内容
    - **内容丰富**：每次生成不同的结果
    - **用户友好**：降低使用门槛
    
    ### 🎯 技术要点
    - 函数无需参数或使用默认参数
    - 输出内容具有随机性或时效性
    - 适合展示动态内容和实时信息
    """
    )

if __name__ == "__main__":
    demo.launch()
