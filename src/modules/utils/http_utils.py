"""
HTTP请求工具模块
提供安全的HTTP请求功能，支持HTTPS、请求重试、错误处理等
"""

import os
import time
import logging
import requests
from typing import Dict, Any, Optional, Union, Tuple
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# 导入日志工具
from src.modules.utils.logger import setup_logger

# 设置模块日志
logger = setup_logger(__name__)

class HTTPRequestError(Exception):
    """HTTP请求异常"""
    pass

class RetryConfig:
    """重试配置类"""
    def __init__(
        self,
        total: int = 3,
        backoff_factor: float = 0.3,
        status_forcelist: Tuple[int, ...] = (500, 502, 503, 504),
        allowed_methods: Optional[Union[Tuple[str, ...], None]] = None
    ):
        """
        初始化重试配置
        
        Args:
            total: 最大重试次数
            backoff_factor: 退避因子，用于计算重试间隔时间
            status_forcelist: 触发重试的HTTP状态码列表
            allowed_methods: 允许重试的HTTP方法，None表示全部允许
        """
        self.total = total
        self.backoff_factor = backoff_factor
        self.status_forcelist = status_forcelist
        self.allowed_methods = allowed_methods

class HTTPUtils:
    """HTTP工具类"""
    
    def __init__(self):
        """初始化HTTP工具"""
        self.session = self._create_session()
    
    def _create_session(self) -> requests.Session:
        """创建带有重试机制的请求会话"""
        # 默认重试配置
        retry_config = RetryConfig()
        
        # 创建重试策略
        retry = Retry(
            total=retry_config.total,
            read=retry_config.total,
            connect=retry_config.total,
            backoff_factor=retry_config.backoff_factor,
            status_forcelist=retry_config.status_forcelist,
            allowed_methods=retry_config.allowed_methods
        )
        
        # 创建适配器
        adapter = HTTPAdapter(max_retries=retry)
        
        # 创建会话并配置适配器
        session = requests.Session()
        session.mount('http://', adapter)
        session.mount('https://', adapter)
        
        # 设置默认超时时间
        session.timeout = 30
        
        return session
    
    def request(
        self,
        method: str,
        url: str,
        headers: Optional[Dict[str, str]] = None,
        params: Optional[Dict[str, Any]] = None,
        data: Optional[Union[Dict[str, Any], str]] = None,
        json: Optional[Dict[str, Any]] = None,
        timeout: Optional[Union[float, Tuple[float, float]]] = None,
        verify: bool = True,
        retry_config: Optional[RetryConfig] = None,
        **kwargs
    ) -> requests.Response:
        """
        发送HTTP请求，支持重试机制和安全配置
        
        Args:
            method: HTTP方法（GET, POST, PUT, DELETE等）
            url: 请求URL
            headers: 请求头
            params: URL参数
            data: 请求体数据
            json: JSON请求体
            timeout: 超时时间
            verify: 是否验证SSL证书
            retry_config: 自定义重试配置
            **kwargs: 其他requests库支持的参数
        
        Returns:
            requests.Response: 请求响应对象
        
        Raises:
            HTTPRequestError: 当请求失败时抛出
        """
        # 确保使用HTTPS
        if not url.startswith('https://'):
            logger.warning(f"不安全的HTTP请求，建议使用HTTPS: {url}")
        
        # 记录请求信息
        logger.debug(f"发送{method}请求到{url}")
        
        # 如果提供了自定义重试配置，创建新的会话
        session = self.session
        if retry_config:
            # 创建带有自定义重试配置的新会话
            retry = Retry(
                total=retry_config.total,
                read=retry_config.total,
                connect=retry_config.total,
                backoff_factor=retry_config.backoff_factor,
                status_forcelist=retry_config.status_forcelist,
                allowed_methods=retry_config.allowed_methods
            )
            adapter = HTTPAdapter(max_retries=retry)
            session = requests.Session()
            session.mount('http://', adapter)
            session.mount('https://', adapter)
            session.timeout = timeout or 30
        
        try:
            # 发送请求
            response = session.request(
                method=method,
                url=url,
                headers=headers,
                params=params,
                data=data,
                json=json,
                timeout=timeout,
                verify=verify,
                **kwargs
            )
            
            # 检查响应状态码
            response.raise_for_status()
            
            logger.debug(f"请求成功，状态码: {response.status_code}")
            return response
            
        except requests.exceptions.RequestException as e:
            error_msg = f"请求失败: {str(e)}"
            logger.error(error_msg)
            raise HTTPRequestError(error_msg) from e
    
    def get(
        self,
        url: str,
        params: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        **kwargs
    ) -> requests.Response:
        """发送GET请求"""
        return self.request('GET', url, params=params, headers=headers, **kwargs)
    
    def post(
        self,
        url: str,
        data: Optional[Union[Dict[str, Any], str]] = None,
        json: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        **kwargs
    ) -> requests.Response:
        """发送POST请求"""
        return self.request('POST', url, data=data, json=json, headers=headers, **kwargs)
    
    def put(
        self,
        url: str,
        data: Optional[Union[Dict[str, Any], str]] = None,
        json: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        **kwargs
    ) -> requests.Response:
        """发送PUT请求"""
        return self.request('PUT', url, data=data, json=json, headers=headers, **kwargs)
    
    def delete(
        self,
        url: str,
        headers: Optional[Dict[str, str]] = None,
        **kwargs
    ) -> requests.Response:
        """发送DELETE请求"""
        return self.request('DELETE', url, headers=headers, **kwargs)
    
    def download_file(
        self,
        url: str,
        save_path: str,
        chunk_size: int = 8192,
        headers: Optional[Dict[str, str]] = None,
        **kwargs
    ) -> bool:
        """
        下载文件
        
        Args:
            url: 文件URL
            save_path: 保存路径
            chunk_size: 下载块大小
            headers: 请求头
            **kwargs: 其他参数
        
        Returns:
            bool: 下载是否成功
        """
        try:
            logger.info(f"开始下载文件: {url} 到 {save_path}")
            
            # 确保保存目录存在
            os.makedirs(os.path.dirname(os.path.abspath(save_path)), exist_ok=True)
            
            with self.session.get(url, stream=True, headers=headers, **kwargs) as response:
                response.raise_for_status()
                with open(save_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=chunk_size):
                        if chunk:
                            f.write(chunk)
            
            logger.info(f"文件下载成功: {save_path}")
            return True
        
        except Exception as e:
            logger.error(f"文件下载失败: {str(e)}")
            # 清理部分下载的文件
            if os.path.exists(save_path):
                os.remove(save_path)
            return False

# 创建全局HTTP工具实例\http_utils = HTTPUtils()

# 导出常用函数
def http_get(url, **kwargs):
    """快捷GET请求"""
    return http_utils.get(url, **kwargs)

def http_post(url, **kwargs):
    """快捷POST请求"""
    return http_utils.post(url, **kwargs)

def http_put(url, **kwargs):
    """快捷PUT请求"""
    return http_utils.put(url, **kwargs)

def http_delete(url, **kwargs):
    """快捷DELETE请求"""
    return http_utils.delete(url, **kwargs)