"""
附加输入组件演示
展示 Gradio 的高级输入组件
"""

import gradio as gr
import json
from datetime import datetime


def process_advanced_inputs(file, audio, video, dataframe, json_data, date, color):
    """处理各种高级输入组件"""
    results = []

    # 文件处理
    if file is not None:
        file_info = f"📁 文件信息：\n- 文件名：{file.name}\n- 大小：{len(file.read()) if hasattr(file, 'read') else 'N/A'} 字节"
        results.append(file_info)
    else:
        results.append("📁 未上传文件")

    # 音频处理
    if audio is not None:
        if isinstance(audio, tuple):
            sample_rate, audio_data = audio
            audio_info = f"🎵 音频信息：\n- 采样率：{sample_rate} Hz\n- 数据形状：{audio_data.shape if hasattr(audio_data, 'shape') else 'N/A'}"
        else:
            audio_info = "🎵 音频文件已上传"
        results.append(audio_info)
    else:
        results.append("🎵 未上传音频")

    # 视频处理
    if video is not None:
        video_info = f"🎬 视频信息：\n- 文件路径：{video if isinstance(video, str) else '已上传'}"
        results.append(video_info)
    else:
        results.append("🎬 未上传视频")

    # 数据框处理
    if dataframe is not None and len(dataframe) > 0:
        df_info = f"📊 数据框信息：\n- 行数：{len(dataframe)}\n- 列数：{len(dataframe.columns)}\n- 列名：{', '.join(dataframe.columns)}"
        results.append(df_info)
    else:
        results.append("📊 数据框为空")

    # JSON 数据处理
    if json_data:
        try:
            parsed_json = (
                json.loads(json_data) if isinstance(json_data, str) else json_data
            )
            json_info = f"📋 JSON 数据：\n- 类型：{type(parsed_json).__name__}\n- 键数量：{len(parsed_json) if isinstance(parsed_json, dict) else 'N/A'}"
            results.append(json_info)
        except:
            results.append("📋 JSON 数据格式错误")
    else:
        results.append("📋 未提供 JSON 数据")

    # 日期处理
    if date:
        date_info = f"📅 选择的日期：{date}\n- 格式化：{datetime.strptime(date, '%Y-%m-%d').strftime('%Y年%m月%d日')}"
        results.append(date_info)
    else:
        results.append("📅 未选择日期")

    # 颜色处理
    if color:
        color_info = f"🎨 选择的颜色：{color}\n- RGB 值：{color}"
        results.append(color_info)
    else:
        results.append("🎨 未选择颜色")

    # 生成综合报告
    report = f"""
# 📊 高级输入组件处理报告

## 📋 处理结果

{chr(10).join(f"{i+1}. {result}" for i, result in enumerate(results))}

## ⏰ 处理时间
{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## 📈 处理状态
✅ 所有输入组件已成功处理
"""

    return report


# 创建高级输入演示界面
demo = gr.Interface(
    fn=process_advanced_inputs,
    inputs=[
        gr.File(
            label="📁 文件上传",
            file_types=[".txt", ".pdf", ".doc", ".csv"],
            info="支持多种文件格式",
        ),
        gr.Audio(label="🎵 音频输入", type="numpy", info="可以录音或上传音频文件"),
        gr.Video(label="🎬 视频输入", info="上传视频文件进行处理"),
        gr.Dataframe(
            label="📊 数据表格",
            headers=["姓名", "年龄", "城市"],
            datatype=["str", "number", "str"],
            row_count=3,
            col_count=3,
            info="输入表格数据",
        ),
        gr.JSON(label="📋 JSON 数据", info="输入 JSON 格式的数据"),
        gr.DateTime(label="📅 日期选择", info="选择日期和时间"),
        gr.ColorPicker(label="🎨 颜色选择器", value="#FF0000", info="选择颜色值"),
    ],
    outputs=gr.Markdown(label="📊 处理结果报告"),
    title="🚀 高级输入组件演示",
    description="展示 Gradio 的各种高级输入组件功能",
    article="""
## 🔧 组件功能说明

### 📁 File 组件
- 支持多种文件格式
- 可以限制文件类型
- 自动处理文件上传

### 🎵 Audio 组件
- 支持录音和文件上传
- 多种音频格式支持
- 返回音频数据和采样率

### 🎬 Video 组件
- 视频文件上传
- 支持常见视频格式
- 可以设置最大文件大小

### 📊 Dataframe 组件
- 表格数据输入
- 可设置列类型和数量
- 支持数据验证

### 📋 JSON 组件
- 结构化数据输入
- 自动 JSON 格式验证
- 支持复杂数据结构

### 📅 DateTime 组件
- 日期时间选择
- 多种日期格式
- 时区支持

### 🎨 ColorPicker 组件
- 颜色选择器
- 支持多种颜色格式
- 实时颜色预览
""",
    examples=[
        [
            None,
            None,
            None,
            [["张三", 25, "北京"], ["李四", 30, "上海"]],
            '{"name": "示例", "value": 100}',
            "2024-01-01",
            "#FF5733",
        ]
    ],
)

if __name__ == "__main__":
    demo.launch()
