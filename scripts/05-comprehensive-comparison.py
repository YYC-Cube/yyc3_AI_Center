"""
Interface 类型全面对比演示
展示四种 Interface 模式的特点和应用场景
"""

import gradio as gr
import random
import datetime
import matplotlib.pyplot as plt
import numpy as np
import json

# 全局数据存储
comparison_data = {
    "standard_calls": 0,
    "output_only_calls": 0,
    "input_only_calls": 0,
    "unified_calls": 0,
    "user_submissions": [],
    "generated_contents": [],
}


def standard_demo_function(text, number, operation):
    """标准演示：文本和数字处理"""
    comparison_data["standard_calls"] += 1

    if not text:
        return "请输入文本", "无结果"

    # 文本处理
    if operation == "统计":
        text_result = f"'{text}' - 字符数：{len(text)}，单词数：{len(text.split())}"
    elif operation == "反转":
        text_result = f"反转结果：{text[::-1]}"
    elif operation == "大写":
        text_result = f"大写结果：{text.upper()}"
    else:
        text_result = f"原文：{text}"

    # 数字处理
    if operation == "统计":
        number_result = f"数字 {number} 的平方：{number**2}"
    elif operation == "反转":
        number_result = f"数字 {number} 的倒数：{1/number if number != 0 else '无穷大'}"
    elif operation == "大写":
        number_result = f"数字 {number} 的立方：{number**3}"
    else:
        number_result = f"原数字：{number}"

    return text_result, number_result


def output_only_demo():
    """仅输出演示：生成随机内容"""
    comparison_data["output_only_calls"] += 1

    # 生成随机数据
    data_types = ["趋势分析", "用户统计", "性能指标", "市场数据"]
    selected_type = random.choice(data_types)

    # 创建随机图表
    x = np.linspace(0, 10, 50)
    y = np.sin(x) * random.uniform(0.5, 2.0) + np.random.normal(0, 0.1, 50)

    plt.figure(figsize=(10, 6))
    plt.plot(x, y, "b-", linewidth=2, alpha=0.8)
    plt.fill_between(x, y, alpha=0.3)
    plt.title(
        f'📊 {selected_type} - {datetime.datetime.now().strftime("%H:%M:%S")}',
        fontsize=14,
        fontweight="bold",
    )
    plt.xlabel("时间")
    plt.ylabel("数值")
    plt.grid(True, alpha=0.3)
    plt.tight_layout()

    # 生成文本报告
    report = f"""
# 📊 {selected_type}报告

## 📈 数据概览
- **生成时间**：{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- **数据类型**：{selected_type}
- **数据点数**：{len(y)}
- **平均值**：{np.mean(y):.2f}
- **最大值**：{np.max(y):.2f}
- **最小值**：{np.min(y):.2f}

## 🎯 关键洞察
- 数据呈现{random.choice(['上升', '下降', '波动'])}趋势
- 变化幅度为 {(np.max(y) - np.min(y)):.2f}
- 标准差：{np.std(y):.2f}

## 💡 建议
{random.choice([
    '建议继续监控数据变化趋势',
    '数据表现良好，保持当前策略',
    '建议优化相关指标以提升表现',
    '数据波动正常，符合预期范围'
])}
"""

    # 存储生成的内容
    comparison_data["generated_contents"].append(
        {
            "type": selected_type,
            "timestamp": datetime.datetime.now().isoformat(),
            "summary": f"生成了{selected_type}报告",
        }
    )

    return report, plt


def input_only_demo(name, email, rating, category, feedback):
    """仅输入演示：收集用户数据"""
    comparison_data["input_only_calls"] += 1

    # 存储用户提交的数据
    submission = {
        "name": name,
        "email": email,
        "rating": rating,
        "category": category,
        "feedback": feedback,
        "timestamp": datetime.datetime.now().isoformat(),
        "id": len(comparison_data["user_submissions"]) + 1,
    }

    comparison_data["user_submissions"].append(submission)

    # 打印到服务器日志（实际应用中会保存到数据库）
    print(f"收到用户提交：{json.dumps(submission, ensure_ascii=False, indent=2)}")

    # 仅输入模式：不返回任何内容
    return None


def unified_demo(input_text, generate_content, collect_data, show_stats):
    """统一演示：根据选项执行不同操作"""
    comparison_data["unified_calls"] += 1

    results = []

    # 处理输入文本
    if input_text and input_text.strip():
        processed = f"处理文本：'{input_text}' (长度：{len(input_text)})"
        results.append(processed)

    # 生成内容
    if generate_content:
        content_types = ["创意想法", "技术建议", "生活贴士"]
        content = random.choice(
            [
                "保持学习的热情，每天进步一点点",
                "代码质量比数量更重要",
                "用户体验是产品成功的关键",
                "团队协作胜过个人英雄主义",
            ]
        )
        results.append(f"生成内容：{content}")

    # 收集数据标记
    if collect_data:
        results.append("✅ 数据收集模式已激活（实际应用中会收集用户数据）")

    # 显示统计
    if show_stats:
        stats = f"""
📊 调用统计：
- 标准模式：{comparison_data['standard_calls']} 次
- 仅输出模式：{comparison_data['output_only_calls']} 次  
- 仅输入模式：{comparison_data['input_only_calls']} 次
- 统一模式：{comparison_data['unified_calls']} 次
- 用户提交：{len(comparison_data['user_submissions'])} 条
- 生成内容：{len(comparison_data['generated_contents'])} 条
"""
        results.append(stats)

    return "\n\n".join(results) if results else "请选择至少一个操作"


def get_comparison_chart():
    """生成对比图表"""
    modes = ["标准模式", "仅输出模式", "仅输入模式", "统一模式"]
    calls = [
        comparison_data["standard_calls"],
        comparison_data["output_only_calls"],
        comparison_data["input_only_calls"],
        comparison_data["unified_calls"],
    ]

    plt.figure(figsize=(12, 8))

    # 创建子图
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))

    # 柱状图
    colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4"]
    bars = ax1.bar(modes, calls, color=colors)
    ax1.set_title("📊 Interface 模式使用统计", fontsize=14, fontweight="bold")
    ax1.set_ylabel("调用次数")

    # 添加数值标签
    for bar, call in zip(bars, calls):
        ax1.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + 0.1,
            str(call),
            ha="center",
            va="bottom",
            fontweight="bold",
        )

    # 饼图
    if sum(calls) > 0:
        wedges, texts, autotexts = ax2.pie(
            calls,
            labels=modes,
            autopct="%1.1f%%",
            startangle=90,
            colors=["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4"],
        )
        ax2.set_title("📈 使用比例分布", fontsize=14, fontweight="bold")
    else:
        ax2.text(
            0.5, 0.5, "暂无数据", ha="center", va="center", transform=ax2.transAxes
        )
        ax2.set_title("📈 使用比例分布", fontsize=14, fontweight="bold")

    plt.tight_layout()
    return fig


# 创建对比演示界面
with gr.Blocks(title="🔍 Interface 类型全面对比", theme=gr.themes.Base()) as demo:
    gr.Markdown(
        """
    # 🔍 Gradio Interface 类型全面对比演示
    
    这个演示展示了四种不同的 Interface 模式，帮助您理解它们的特点和适用场景。
    """
    )

    with gr.Tabs():
        # 标准模式演示
        with gr.TabItem("📝 标准模式"):
            gr.Markdown(
                """
            ### 🎯 标准 Interface 模式
            **特点**：用户输入 → 系统处理 → 返回结果
            **适用**：数据处理、计算工具、转换器等
            """
            )

            with gr.Row():
                with gr.Column():
                    std_text = gr.Textbox(
                        label="📝 文本输入", placeholder="输入文本..."
                    )
                    std_number = gr.Number(label="🔢 数字输入", value=10)
                    std_operation = gr.Radio(
                        label="🔘 操作类型",
                        choices=["统计", "反转", "大写", "保持"],
                        value="统计",
                    )
                    std_btn = gr.Button("🔄 处理", variant="primary")

                with gr.Column():
                    std_text_output = gr.Textbox(label="📊 文本结果", interactive=False)
                    std_number_output = gr.Textbox(
                        label="🔢 数字结果", interactive=False
                    )

            std_btn.click(
                standard_demo_function,
                inputs=[std_text, std_number, std_operation],
                outputs=[std_text_output, std_number_output],
            )

        # 仅输出模式演示
        with gr.TabItem("🎲 仅输出模式"):
            gr.Markdown(
                """
            ### 🎯 仅输出 Interface 模式
            **特点**：无需输入 → 系统生成 → 返回内容
            **适用**：内容生成、报告生成、随机工具等
            """
            )

            output_btn = gr.Button("🎲 生成随机报告", variant="primary", size="lg")

            with gr.Row():
                with gr.Column():
                    output_report = gr.Markdown(label="📊 生成报告")

                with gr.Column():
                    output_chart = gr.Plot(label="📈 数据图表")

            output_btn.click(output_only_demo, outputs=[output_report, output_chart])

        # 仅输入模式演示
        with gr.TabItem("📋 仅输入模式"):
            gr.Markdown(
                """
            ### 🎯 仅输入 Interface 模式
            **特点**：用户输入 → 系统收集 → 无界面输出
            **适用**：数据收集、反馈提交、表单填写等
            """
            )

            with gr.Row():
                with gr.Column():
                    input_name = gr.Textbox(label="👤 姓名", placeholder="请输入姓名")
                    input_email = gr.Textbox(
                        label="📧 邮箱", placeholder="your@email.com"
                    )

                with gr.Column():
                    input_rating = gr.Slider(
                        label="⭐ 评分", minimum=1, maximum=5, value=5
                    )
                    input_category = gr.Dropdown(
                        label="📂 类别",
                        choices=["功能建议", "Bug报告", "用户体验", "其他"],
                        value="功能建议",
                    )

            input_feedback = gr.Textbox(
                label="💭 反馈内容", placeholder="请输入您的反馈...", lines=4
            )

            input_btn = gr.Button("📤 提交反馈", variant="primary")

            # 仅输入：无输出组件
            input_btn.click(
                input_only_demo,
                inputs=[
                    input_name,
                    input_email,
                    input_rating,
                    input_category,
                    input_feedback,
                ],
                outputs=None,
            )

        # 统一模式演示
        with gr.TabItem("🔄 统一模式"):
            gr.Markdown(
                """
            ### 🎯 统一 Interface 模式
            **特点**：集成多种模式 → 灵活处理 → 多样输出
            **适用**：综合平台、多功能工具、复杂应用等
            """
            )

            with gr.Row():
                with gr.Column():
                    unified_text = gr.Textbox(
                        label="📝 输入文本", placeholder="可选：输入文本"
                    )

                    unified_options = gr.CheckboxGroup(
                        label="🎛️ 功能选项",
                        choices=["生成内容", "收集数据", "显示统计"],
                        value=["显示统计"],
                    )

                    unified_btn = gr.Button("🚀 执行操作", variant="primary")

                with gr.Column():
                    unified_output = gr.Textbox(
                        label="📊 执行结果", lines=10, interactive=False
                    )

            def unified_wrapper(text, options):
                return unified_demo(
                    text,
                    "生成内容" in options,
                    "收集数据" in options,
                    "显示统计" in options,
                )

            unified_btn.click(
                unified_wrapper,
                inputs=[unified_text, unified_options],
                outputs=unified_output,
            )

        # 对比分析
        with gr.TabItem("📊 对比分析"):
            gr.Markdown(
                """
            ### 📈 Interface 模式对比分析
            查看不同模式的使用情况和特点对比
            """
            )

            comparison_btn = gr.Button("📊 生成对比图表", variant="secondary")
            comparison_chart = gr.Plot(label="📈 使用统计对比")

            comparison_btn.click(get_comparison_chart, outputs=comparison_chart)

            gr.Markdown(
                """
            ## 🔍 模式特点对比
            
            | 模式 | 输入 | 输出 | 适用场景 | 优势 |
            |------|------|------|----------|------|
            | 📝 **标准模式** | ✅ | ✅ | 数据处理、计算工具 | 直观、实时反馈 |
            | 🎲 **仅输出模式** | ❌ | ✅ | 内容生成、报告展示 | 简单、专注展示 |
            | 📋 **仅输入模式** | ✅ | ❌ | 数据收集、表单提交 | 专注收集、后台处理 |
            | 🔄 **统一模式** | ✅ | ✅ | 综合平台、多功能应用 | 灵活、功能丰富 |
            
            ## 💡 选择建议
            
            ### 🎯 根据应用需求选择
            - **数据处理应用** → 标准模式
            - **内容展示应用** → 仅输出模式  
            - **信息收集应用** → 仅输入模式
            - **综合性应用** → 统一模式
            
            ### 🔧 根据用户体验选择
            - **即时反馈** → 标准模式、统一模式
            - **简化操作** → 仅输出模式、仅输入模式
            - **功能丰富** → 统一模式
            - **专业工具** → 标准模式
            """
            )

if __name__ == "__main__":
    demo.launch()
