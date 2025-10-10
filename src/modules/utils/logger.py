"""
日志工具模块
提供应用的日志记录功能
"""

import os
import logging
import datetime
from logging.handlers import TimedRotatingFileHandler

def setup_logger(name, log_level=None):
    """
    设置日志记录器
    
    Args:
        name (str): 日志记录器名称
        log_level (str, optional): 日志级别，默认从环境变量获取
    
    Returns:
        logging.Logger: 配置好的日志记录器
    """
    # 创建日志记录器
    logger = logging.getLogger(name)
    
    # 从环境变量获取日志级别，默认为INFO
    if log_level is None:
        log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
    
    # 设置日志级别
    logger.setLevel(getattr(logging, log_level))
    
    # 避免重复添加处理器
    if not logger.handlers:
        # 创建格式化器
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        
        # 创建控制台处理器
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
        
        # 创建文件处理器（每天一个新文件，保留7天）
        log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'logs')
        os.makedirs(log_dir, exist_ok=True)
        
        log_file = os.path.join(log_dir, f'app_{datetime.date.today().strftime('%Y-%m-%d')}.log')
        file_handler = TimedRotatingFileHandler(
            log_file,
            when='midnight',
            interval=1,
            backupCount=7,
            encoding='utf-8'
        )
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    
    return logger