"""
API配置模块
集中管理所有外部API的配置信息
"""

import os
from typing import Dict, Any

class APIConfig:
    """API配置类，负责从环境变量读取和管理API配置"""
    
    def __init__(self):
        """初始化API配置"""
        # 初始化API配置字典
        self._config = self._load_config()
    
    def _load_config(self) -> Dict[str, Dict[str, Any]]:
        """从环境变量加载API配置"""
        return {
            "weather": {
                "api_key": os.getenv("WEATHER_API_KEY", ""),
                "base_url": "https://api.openweathermap.org/data/2.5/weather",
                "enabled": os.getenv("WEATHER_API_ENABLED", "false").lower() == "true",
            },
            "translation": {
                "api_key": os.getenv("TRANSLATION_API_KEY", ""),
                "base_url": "https://translation.googleapis.com/language/translate/v2",
                "enabled": os.getenv("TRANSLATION_API_ENABLED", "false").lower() == "true",
            },
            "news": {
                "api_key": os.getenv("NEWS_API_KEY", ""),
                "base_url": "https://newsapi.org/v2/top-headlines",
                "enabled": os.getenv("NEWS_API_ENABLED", "false").lower() == "true",
            },
            "currency": {
                "api_key": os.getenv("CURRENCY_API_KEY", ""),
                "base_url": "https://api.exchangerate-api.com/v4/latest",
                "enabled": os.getenv("CURRENCY_API_ENABLED", "false").lower() == "true",
            },
            "ipinfo": {
                "api_key": os.getenv("IPINFO_API_KEY", ""),
                "base_url": "https://ipinfo.io",
                "enabled": os.getenv("IPINFO_API_ENABLED", "false").lower() == "true",
            },
            "stocks": {
                "api_key": os.getenv("STOCKS_API_KEY", ""),
                "base_url": "https://www.alphavantage.co/query",
                "enabled": os.getenv("STOCKS_API_ENABLED", "false").lower() == "true",
            },
        }
    
    @property
    def config(self) -> Dict[str, Dict[str, Any]]:
        """获取完整的API配置"""
        return self._config
    
    def get_api(self, api_name: str) -> Dict[str, Any]:
        """
        获取指定API的配置
        
        Args:
            api_name (str): API名称
        
        Returns:
            Dict[str, Any]: API配置
        """
        return self._config.get(api_name, {})
    
    def is_api_enabled(self, api_name: str) -> bool:
        """
        检查指定API是否启用
        
        Args:
            api_name (str): API名称
        
        Returns:
            bool: 是否启用
        """
        api_config = self.get_api(api_name)
        return api_config.get('enabled', False) and bool(api_config.get('api_key', ''))
    
    def get_api_key(self, api_name: str) -> str:
        """
        获取指定API的密钥
        
        Args:
            api_name (str): API名称
        
        Returns:
            str: API密钥
        """
        return self.get_api(api_name).get('api_key', '')
    
    def get_base_url(self, api_name: str) -> str:
        """
        获取指定API的基础URL
        
        Args:
            api_name (str): API名称
        
        Returns:
            str: 基础URL
        """
        return self.get_api(api_name).get('base_url', '')

# 创建全局API配置实例
api_config = APIConfig()