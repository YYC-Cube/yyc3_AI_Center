"""
缓存管理模块
提供统一的缓存机制，优化应用性能
"""

import os
import json
import time
from typing import Dict, Any, Optional, Union, Callable
import threading
import functools

class CacheManager:
    """缓存管理器类，提供内存缓存和文件缓存功能"""
    
    def __init__(self, cache_dir: str = "cache"):
        """
        初始化缓存管理器
        
        Args:
            cache_dir (str): 缓存文件存储目录
        """
        # 内存缓存字典
        self._cache: Dict[str, Dict[str, Any]] = {}
        
        # 缓存过期时间（秒）
        self._default_ttl = int(os.getenv('CACHE_DEFAULT_TTL', '3600'))  # 默认1小时
        
        # 缓存目录
        self._cache_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 
            cache_dir
        )
        os.makedirs(self._cache_dir, exist_ok=True)
        
        # 线程锁，保证线程安全
        self._lock = threading.RLock()
        
        # 启动缓存清理线程
        self._stop_cleanup = False
        self._cleanup_thread = threading.Thread(target=self._periodic_cleanup, daemon=True)
        self._cleanup_thread.start()
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """
        设置缓存
        
        Args:
            key (str): 缓存键
            value (Any): 缓存值
            ttl (int, optional): 缓存过期时间（秒），默认使用全局配置
        """
        with self._lock:
            expiry = time.time() + (ttl or self._default_ttl)
            self._cache[key] = {
                'value': value,
                'expiry': expiry
            }
    
    def get(self, key: str, default: Any = None) -> Any:
        """
        获取缓存
        
        Args:
            key (str): 缓存键
            default (Any, optional): 缓存不存在时的默认值
        
        Returns:
            Any: 缓存值或默认值
        """
        with self._lock:
            if key not in self._cache:
                return default
            
            item = self._cache[key]
            # 检查是否过期
            if time.time() > item['expiry']:
                del self._cache[key]
                return default
            
            return item['value']
    
    def delete(self, key: str) -> None:
        """
        删除缓存
        
        Args:
            key (str): 缓存键
        """
        with self._lock:
            if key in self._cache:
                del self._cache[key]
    
    def clear(self) -> None:
        """\清除所有缓存"""
        with self._lock:
            self._cache.clear()
    
    def _periodic_cleanup(self) -> None:
        """定期清理过期缓存"""
        while not self._stop_cleanup:
            self._cleanup_expired()
            # 每5分钟清理一次
            time.sleep(300)
    
    def _cleanup_expired(self) -> None:
        """清理过期的缓存项"""
        with self._lock:
            current_time = time.time()
            expired_keys = [k for k, v in self._cache.items() if current_time > v['expiry']]
            for key in expired_keys:
                del self._cache[key]
    
    def cache_to_file(self, key: str, data: Any) -> None:
        """
        将数据缓存到文件
        
        Args:
            key (str): 缓存键
            data (Any): 要缓存的数据
        """
        try:
            file_path = os.path.join(self._cache_dir, f"{key}.json")
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            # 在实际应用中应该记录日志
            print(f"缓存到文件失败: {str(e)}")
    
    def get_from_file(self, key: str) -> Optional[Any]:
        """
        从文件获取缓存
        
        Args:
            key (str): 缓存键
        
        Returns:
            Any: 缓存的数据或None
        """
        try:
            file_path = os.path.join(self._cache_dir, f"{key}.json")
            if not os.path.exists(file_path):
                return None
            
            # 检查文件是否过期（24小时）
            if time.time() - os.path.getmtime(file_path) > 86400:
                os.remove(file_path)
                return None
            
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            # 在实际应用中应该记录日志
            print(f"从文件读取缓存失败: {str(e)}")
            return None
    
    def __del__(self):
        """析构函数，停止清理线程"""
        self._stop_cleanup = True

# 创建全局缓存管理器实例
cache_manager = CacheManager()

# 缓存装饰器
def cache_result(func: Callable) -> Callable:
    """
    函数结果缓存装饰器
    
    Args:
        func (Callable): 要缓存结果的函数
    
    Returns:
        Callable: 包装后的函数
    """
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        # 创建缓存键
        key_parts = [func.__name__]
        key_parts.extend(str(arg) for arg in args)
        key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
        cache_key = "|" + ",".join(key_parts)
        
        # 尝试从缓存获取结果
        result = cache_manager.get(cache_key)
        if result is not None:
            return result
        
        # 调用原函数
        result = func(*args, **kwargs)
        
        # 缓存结果
        cache_manager.set(cache_key, result)
        
        return result
    
    return wrapper