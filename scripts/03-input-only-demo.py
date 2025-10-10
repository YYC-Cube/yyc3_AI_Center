"""
仅输入 Interface 演示
展示收集用户输入但不返回结果的 Interface 模式
"""

import gradio as gr
import json
import datetime
import os

# 全局存储（实际应用中应使用数据库）
feedback_storage = []
survey_storage = []
contact_storage = []


def collect_feedback(rating, feedback_text, email, category):
    """收集用户反馈"""
    feedback_data = {
        "timestamp": datetime.datetime.now().isoformat(),
        "rating": rating,
        "feedback": feedback_text,
        "email": email,
        "category": category,
        "id": len(feedback_storage) + 1,
    }

    feedback_storage.append(feedback_data)

    # 这里可以保存到文件或数据库
    # 返回 None 表示不显示输出
    print(f"收到反馈：{feedback_data}")  # 服务器端日志
    return None


def collect_survey(name, age, occupation, experience, recommendation, suggestions):
    """收集调查问卷"""
    survey_data = {
        "timestamp": datetime.datetime.now().isoformat(),
        "name": name,
        "age": age,
        "occupation": occupation,
        "experience": experience,
        "recommendation": recommendation,
        "suggestions": suggestions,
        "id": len(survey_storage) + 1,
    }

    survey_storage.append(survey_data)

    print(f"收到调查：{survey_data}")  # 服务器端日志
    return None


def collect_contact(name, email, phone, subject, message, urgent):
    """收集联系信息"""
    contact_data = {
        "timestamp": datetime.datetime.now().isoformat(),
        "name": name,
        "email": email,
        "phone": phone,
        "subject": subject,
        "message": message,
        "urgent": urgent,
        "id": len(contact_storage) + 1,
    }

    contact_storage.append(contact_data)

    print(f"收到联系：{contact_data}")  # 服务器端日志
    return None


def show_statistics():
    """显示收集的统计信息（管理员功能）"""
    stats = f"""
📊 数据收集统计

📝 反馈数量：{len(feedback_storage)}
📋 调查数量：{len(survey_storage)}
📞 联系数量：{len(contact_storage)}

⏰ 最后更新：{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""
    return stats


# 创建仅输入演示界面
with gr.Blocks(title="📝 仅输入演示") as demo:
    gr.Markdown(
        """
    # 📝 仅输入 Interface 演示
    
    这些演示展示了收集用户输入但不返回结果的 Interface 模式，适用于数据收集、反馈提交等场景。
    """
    )

    with gr.Tabs():
        # 用户反馈收集
        with gr.TabItem("💬 用户反馈"):
            gr.Markdown(
                """
            ### 📝 用户反馈表单
            请分享您的使用体验和建议，帮助我们改进产品。
            """
            )

            with gr.Row():
                with gr.Column():
                    rating = gr.Slider(
                        label="⭐ 满意度评分",
                        minimum=1,
                        maximum=5,
                        value=5,
                        step=1,
                        info="1=非常不满意，5=非常满意",
                    )

                    category = gr.Dropdown(
                        label="📂 反馈类别",
                        choices=["功能建议", "Bug报告", "用户体验", "性能问题", "其他"],
                        value="功能建议",
                    )

                with gr.Column():
                    email = gr.Textbox(
                        label="📧 邮箱地址（可选）",
                        placeholder="your@email.com",
                        info="如需回复请提供邮箱",
                    )

            feedback_text = gr.Textbox(
                label="💭 详细反馈",
                placeholder="请详细描述您的反馈或建议...",
                lines=5,
                info="您的反馈对我们很重要",
            )

            submit_feedback_btn = gr.Button("📤 提交反馈", variant="primary")

            # 提交反馈（无输出）
            submit_feedback_btn.click(
                collect_feedback,
                inputs=[rating, feedback_text, email, category],
                outputs=None,
            )

        # 调查问卷
        with gr.TabItem("📋 调查问卷"):
            gr.Markdown(
                """
            ### 📊 用户调查问卷
            帮助我们了解用户群体和使用情况。
            """
            )

            with gr.Row():
                with gr.Column():
                    name = gr.Textbox(label="👤 姓名", placeholder="请输入您的姓名")

                    age = gr.Number(label="🎂 年龄", minimum=10, maximum=100, value=25)

                with gr.Column():
                    occupation = gr.Textbox(
                        label="💼 职业", placeholder="请输入您的职业"
                    )

                    experience = gr.Radio(
                        label="🎯 使用经验",
                        choices=["新手", "初级", "中级", "高级", "专家"],
                        value="初级",
                    )

            recommendation = gr.Slider(
                label="📢 推荐指数",
                minimum=0,
                maximum=10,
                value=8,
                step=1,
                info="您向朋友推荐我们产品的可能性（0-10分）",
            )

            suggestions = gr.Textbox(
                label="💡 改进建议", placeholder="您希望我们在哪些方面改进？", lines=4
            )

            submit_survey_btn = gr.Button("📋 提交问卷", variant="primary")

            # 提交问卷（无输出）
            submit_survey_btn.click(
                collect_survey,
                inputs=[name, age, occupation, experience, recommendation, suggestions],
                outputs=None,
            )

        # 联系我们
        with gr.TabItem("📞 联系我们"):
            gr.Markdown(
                """
            ### 📬 联系表单
            有任何问题或需要帮助？请通过此表单联系我们。
            """
            )

            with gr.Row():
                with gr.Column():
                    contact_name = gr.Textbox(
                        label="👤 姓名", placeholder="请输入您的姓名"
                    )

                    contact_email = gr.Textbox(
                        label="📧 邮箱", placeholder="your@email.com"
                    )

                with gr.Column():
                    phone = gr.Textbox(
                        label="📱 电话（可选）", placeholder="请输入联系电话"
                    )

                    urgent = gr.Checkbox(
                        label="🚨 紧急事务", value=False, info="勾选此项我们将优先处理"
                    )

            subject = gr.Textbox(
                label="📋 主题", placeholder="请简要描述您的问题或需求"
            )

            message = gr.Textbox(
                label="💬 详细信息",
                placeholder="请详细描述您的问题、需求或建议...",
                lines=6,
            )

            submit_contact_btn = gr.Button("📤 发送消息", variant="primary")

            # 提交联系信息（无输出）
            submit_contact_btn.click(
                collect_contact,
                inputs=[contact_name, contact_email, phone, subject, message, urgent],
                outputs=None,
            )

        # 管理员统计（仅用于演示）
        with gr.TabItem("📊 统计信息"):
            gr.Markdown(
                """
            ### 📈 数据收集统计
            （仅用于演示目的）
            """
            )

            stats_btn = gr.Button("🔄 刷新统计", variant="secondary")
            stats_output = gr.Textbox(label="统计信息", lines=8, interactive=False)

            stats_btn.click(show_statistics, outputs=stats_output)

    gr.Markdown(
        """
    ## 🔧 仅输入模式特点
    
    ### 📋 应用场景
    - **数据收集**：用户反馈、调查问卷、注册信息
    - **表单提交**：联系表单、申请表、订单表
    - **内容投稿**：文章投稿、图片上传、评论提交
    - **配置设置**：用户偏好、系统配置、个人资料
    
    ### 💡 设计优势
    - **专注收集**：不分散用户注意力
    - **数据完整性**：确保所有必要信息都被收集
    - **用户体验**：简洁的提交流程
    - **后台处理**：数据可以异步处理和存储
    
    ### 🎯 技术要点
    - 函数返回 `None` 或不返回值
    - 数据通常保存到数据库或文件
    - 可以添加客户端验证
    - 适合与后端系统集成
    
    ### 🔒 注意事项
    - 确保数据安全和隐私保护
    - 添加适当的输入验证
    - 提供用户提交确认
    - 考虑数据存储和备份策略
    """
    )

if __name__ == "__main__":
    demo.launch()
