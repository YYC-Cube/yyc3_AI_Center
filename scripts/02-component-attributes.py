"""
Gradio 组件属性详解
展示各种组件的属性和配置选项
"""

import gradio as gr


def process_inputs(text, number, slider_val, checkbox, radio, dropdown):
    """处理各种输入组件的值"""
    result = f"""
📊 输入组件值汇总：

📝 文本框：{text}
🔢 数字框：{number}
🎚️ 滑块：{slider_val}
☑️ 复选框：{checkbox}
🔘 单选框：{radio}
📋 下拉框：{dropdown}

✅ 所有输入已成功处理！
"""
    return result


# 创建带有详细属性配置的界面
demo = gr.Interface(
    fn=process_inputs,
    inputs=[
        gr.Textbox(
            label="📝 文本输入框",
            placeholder="请输入文本...",
            lines=2,
            max_lines=5,
            info="这是一个多行文本输入框",
        ),
        gr.Number(
            label="🔢 数字输入框",
            value=42,
            minimum=0,
            maximum=100,
            step=1,
            info="输入范围：0-100",
        ),
        gr.Slider(
            label="🎚️ 滑块控件",
            minimum=0,
            maximum=10,
            value=5,
            step=0.5,
            info="拖动滑块选择数值",
        ),
        gr.Checkbox(label="☑️ 复选框", value=True, info="勾选或取消勾选"),
        gr.Radio(
            label="🔘 单选按钮组",
            choices=["选项A", "选项B", "选项C"],
            value="选项A",
            info="选择其中一个选项",
        ),
        gr.Dropdown(
            label="📋 下拉选择框",
            choices=["苹果🍎", "香蕉🍌", "橙子🍊", "葡萄🍇"],
            value="苹果🍎",
            multiselect=False,
            info="从下拉列表中选择",
        ),
    ],
    outputs=gr.Markdown(label="📊 处理结果"),
    title="🎛️ Gradio 组件属性演示",
    description="展示各种输入组件的属性配置和使用方法",
    article="""
## 🔧 组件属性说明

### 📝 Textbox 属性
- `label`: 组件标签
- `placeholder`: 占位符文本
- `lines`: 显示行数
- `max_lines`: 最大行数
- `info`: 帮助信息

### 🔢 Number 属性
- `value`: 默认值
- `minimum/maximum`: 数值范围
- `step`: 步长
- `precision`: 精度

### 🎚️ Slider 属性
- `minimum/maximum`: 滑块范围
- `step`: 滑动步长
- `value`: 初始值

### ☑️ Checkbox 属性
- `value`: 默认选中状态
- `label`: 标签文本

### 🔘 Radio 属性
- `choices`: 选项列表
- `value`: 默认选中项

### 📋 Dropdown 属性
- `choices`: 选项列表
- `multiselect`: 是否多选
- `value`: 默认值
""",
    examples=[
        ["示例文本", 25, 7.5, True, "选项B", "香蕉🍌"],
        ["另一个示例", 80, 3.0, False, "选项C", "橙子🍊"],
    ],
)

if __name__ == "__main__":
    demo.launch()
