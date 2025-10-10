"""
统一 Interface 演示
展示在一个界面中集成多种 Interface 模式
"""

import gradio as gr
import random
import datetime
import matplotlib.pyplot as plt
import numpy as np

# 数据存储
user_data = []
generated_content = []


def process_text_input(text, operation):
    """处理文本输入并返回结果（标准模式）"""
    if not text:
        return "请输入文本"

    if operation == "字符统计":
        result = f"字符数：{len(text)}，单词数：{len(text.split())}"
    elif operation == "反转文本":
        result = text[::-1]
    elif operation == "大写转换":
        result = text.upper()
    elif operation == "小写转换":
        result = text.lower()
    else:
        result = text

    return result


def generate_random_content():
    """生成随机内容（仅输出模式）"""
    content_types = ["励志名言", "技术提示", "生活建议", "创意想法"]
    content_type = random.choice(content_types)

    contents = {
        "励志名言": [
            "成功不是终点，失败不是致命的，重要的是继续前进的勇气。",
            "创新区别于领导者和跟随者。",
            "你的时间有限，不要浪费在重复别人的生活上。",
        ],
        "技术提示": [
            "编写代码时，清晰比聪明更重要。",
            "好的代码是自文档化的。",
            "测试不是为了证明代码正确，而是为了发现错误。",
        ],
        "生活建议": [
            "每天学习一点新东西，积少成多。",
            "保持好奇心，世界充满惊喜。",
            "善待他人，也善待自己。",
        ],
        "创意想法": [
            "尝试用不同的方式解决同一个问题。",
            "将两个不相关的概念结合起来。",
            "从失败中寻找新的机会。",
        ],
    }

    selected_content = random.choice(contents[content_type])
    timestamp = datetime.datetime.now().strftime("%H:%M:%S")

    # 存储生成的内容
    generated_item = {
        "type": content_type,
        "content": selected_content,
        "timestamp": timestamp,
    }
    generated_content.append(generated_item)

    return f"""
## 🎲 {content_type}

> {selected_content}

---
⏰ 生成时间：{timestamp}
🎯 类型：{content_type}
"""


def collect_user_info(name, email, age, interests, feedback):
    """收集用户信息（仅输入模式）"""
    user_info = {
        "name": name,
        "email": email,
        "age": age,
        "interests": interests,
        "feedback": feedback,
        "timestamp": datetime.datetime.now().isoformat(),
        "id": len(user_data) + 1,
    }

    user_data.append(user_info)
    print(f"收集用户信息：{user_info}")

    # 仅输入模式：不返回任何内容给用户界面
    return None


def get_statistics():
    """获取统计信息"""
    stats = f"""
📊 系统统计信息

👥 用户数据：{len(user_data)} 条记录
📝 生成内容：{len(generated_content)} 条记录
⏰ 最后更新：{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

📈 内容类型分布：
"""

    # 统计内容类型
    if generated_content:
        content_types = {}
        for item in generated_content:
            content_type = item["type"]
            content_types[content_type] = content_types.get(content_type, 0) + 1

        for content_type, count in content_types.items():
            stats += f"• {content_type}：{count} 条\n"
    else:
        stats += "• 暂无生成内容"

    return stats


def create_data_visualization():
    """创建数据可视化"""
    if not generated_content:
        # 创建示例数据
        categories = ["励志名言", "技术提示", "生活建议", "创意想法"]
        values = [random.randint(1, 10) for _ in categories]
    else:
        # 使用实际数据
        content_types = {}
        for item in generated_content:
            content_type = item["type"]
            content_types[content_type] = content_types.get(content_type, 0) + 1

        categories = list(content_types.keys())
        values = list(content_types.values())

    # 创建图表
    plt.figure(figsize=(10, 6))
    colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4"]
    bars = plt.bar(categories, values, color=colors[: len(categories)])

    # 添加数值标签
    for bar, value in zip(bars, values):
        plt.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + 0.1,
            str(value),
            ha="center",
            va="bottom",
            fontweight="bold",
        )

    plt.title("📊 内容生成统计", fontsize=16, fontweight="bold", pad=20)
    plt.xlabel("内容类型", fontsize=12)
    plt.ylabel("生成数量", fontsize=12)
    plt.ylim(0, max(values) + 2 if values else 10)

    plt.grid(axis="y", alpha=0.3, linestyle="--")
    plt.tight_layout()

    return plt


# 创建统一演示界面
with gr.Blocks(title="🔄 统一 Interface 演示", theme=gr.themes.Soft()) as demo:
    gr.Markdown(
        """
    # 🔄 统一 Interface 演示
    
    这个演示展示了如何在一个应用中集成三种不同的 Interface 模式：
    - 📝 **标准模式**：输入 → 处理 → 输出
    - 🎲 **仅输出模式**：生成内容
    - 📋 **仅输入模式**：收集数据
    """
    )

    with gr.Tabs():
        # 标准处理模式
        with gr.TabItem("📝 文本处理"):
            gr.Markdown("### 🔧 标准输入输出模式")

            with gr.Row():
                with gr.Column():
                    text_input = gr.Textbox(
                        label="📝 输入文本", placeholder="输入要处理的文本...", lines=3
                    )

                    operation = gr.Radio(
                        label="🛠️ 处理操作",
                        choices=["字符统计", "反转文本", "大写转换", "小写转换"],
                        value="字符统计",
                    )

                    process_btn = gr.Button("🔄 处理文本", variant="primary")

                with gr.Column():
                    text_output = gr.Textbox(
                        label="📊 处理结果", lines=3, interactive=False
                    )

            process_btn.click(
                process_text_input, inputs=[text_input, operation], outputs=text_output
            )

        # 内容生成模式
        with gr.TabItem("🎲 内容生成"):
            gr.Markdown("### 🎨 随机内容生成模式")

            generate_btn = gr.Button("🎲 生成随机内容", variant="primary", size="lg")
            generated_output = gr.Markdown(label="生成的内容")

            generate_btn.click(generate_random_content, outputs=generated_output)

        # 数据收集模式
        with gr.TabItem("📋 信息收集"):
            gr.Markdown("### 📝 用户信息收集模式")

            with gr.Row():
                with gr.Column():
                    user_name = gr.Textbox(
                        label="👤 姓名", placeholder="请输入您的姓名"
                    )

                    user_email = gr.Textbox(
                        label="📧 邮箱", placeholder="your@email.com"
                    )

                with gr.Column():
                    user_age = gr.Number(
                        label="🎂 年龄", minimum=10, maximum=100, value=25
                    )

                    user_interests = gr.CheckboxGroup(
                        label="🎯 兴趣爱好",
                        choices=["技术", "艺术", "运动", "音乐", "阅读", "旅行"],
                        value=["技术"],
                    )

            user_feedback = gr.Textbox(
                label="💭 反馈建议", placeholder="请分享您的想法和建议...", lines=4
            )

            submit_btn = gr.Button("📤 提交信息", variant="primary")

            # 仅输入：不显示输出
            submit_btn.click(
                collect_user_info,
                inputs=[user_name, user_email, user_age, user_interests, user_feedback],
                outputs=None,
            )

        # 统计和可视化
        with gr.TabItem("📊 数据统计"):
            gr.Markdown("### 📈 系统数据统计和可视化")

            with gr.Row():
                stats_btn = gr.Button("📊 获取统计", variant="secondary")
                chart_btn = gr.Button("📈 生成图表", variant="secondary")

            with gr.Row():
                with gr.Column():
                    stats_output = gr.Textbox(
                        label="📊 统计信息", lines=10, interactive=False
                    )

                with gr.Column():
                    chart_output = gr.Plot(label="📈 数据图表")

            stats_btn.click(get_statistics, outputs=stats_output)
            chart_btn.click(create_data_visualization, outputs=chart_output)

    gr.Markdown(
        """
    ## 🎯 统一模式的优势
    
    ### 🔄 模式集成
    - **功能完整**：涵盖所有常见的交互模式
    - **用户体验**：在一个应用中满足不同需求
    - **数据流转**：不同模式间可以共享数据
    - **统一管理**：集中的数据存储和处理
    
    ### 💡 应用场景
    - **综合平台**：集成多种功能的应用
    - **数据分析**：收集、处理、展示数据
    - **内容管理**：生成、编辑、存储内容
    - **用户服务**：提供多样化的用户服务
    
    ### 🔧 技术特点
    - **模块化设计**：每种模式独立实现
    - **数据共享**：全局数据存储和访问
    - **状态管理**：跨标签页的状态保持
    - **扩展性强**：易于添加新功能模块
    """
    )

if __name__ == "__main__":
    demo.launch()
