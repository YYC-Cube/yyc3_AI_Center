#!/usr/bin/env python3
"""
YanYu Cloud Cube Integration Center - 主入口
集成所有功能模块的统一入口点
"""

import os
import sys
from dotenv import load_dotenv

# 加载环境变量
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)

# 添加src目录到Python路径
src_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(src_dir)

# 导入主要模块
from modules.core.app import create_application
from modules.utils.logger import setup_logger

# 设置日志
slogger = setup_logger('main')

def main():
    """主函数，创建并启动应用"""
    try:
        # 配置应用类型（full, simple, with_apis）
        app_type = os.getenv('APP_TYPE', 'full')
        
        # 创建应用
        demo = create_application(app_type)
        
        # 获取启动配置
        share = os.getenv('GRADIO_SHARE', 'false').lower() == 'true'
        server_name = os.getenv('GRADIO_SERVER_NAME', '127.0.0.1')
        server_port = int(os.getenv('GRADIO_SERVER_PORT', '7860'))
        
        # 启动应用
        slogger.info(f"启动 YanYu Cloud Cube Integration Center - 类型: {app_type}")
        slogger.info(f"服务地址: http://{server_name}:{server_port}")
        slogger.info(f"共享模式: {'开启' if share else '关闭'}")
        
        demo.launch(
            share=share,
            server_name=server_name,
            server_port=server_port,
            show_api=False,
            debug=os.getenv('GRADIO_DEBUG', 'false').lower() == 'true'
        )
        
    except Exception as e:
        slogger.error(f"应用启动失败: {str(e)}")
        raise

if __name__ == "__main__":
    main()