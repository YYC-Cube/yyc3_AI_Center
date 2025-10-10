"""
缓存管理器单元测试
"""

import os
import sys
import time
import json
from unittest import TestCase, mock

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.modules.cache.cache_manager import CacheManager, cache_result

class TestCacheManager(TestCase):
    
    def setUp(self):
        """每个测试方法执行前的设置"""
        # 创建一个临时缓存目录用于测试
        self.test_cache_dir = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            "test_cache"
        )
        os.makedirs(self.test_cache_dir, exist_ok=True)
        
        # 创建缓存管理器实例
        self.cache_manager = CacheManager(cache_dir=self.test_cache_dir)
        
    def tearDown(self):
        """每个测试方法执行后的清理"""
        # 清除内存缓存
        self.cache_manager.clear()
        
        # 删除测试缓存文件
        for file in os.listdir(self.test_cache_dir):
            os.remove(os.path.join(self.test_cache_dir, file))
        if os.path.exists(self.test_cache_dir):
            os.rmdir(self.test_cache_dir)
    
    def test_set_and_get(self):
        """测试基本的设置和获取缓存功能"""
        # 设置缓存
        self.cache_manager.set("test_key", "test_value")
        
        # 获取缓存
        result = self.cache_manager.get("test_key")
        
        # 验证结果
        self.assertEqual(result, "test_value")
    
    def test_get_nonexistent_key(self):
        """测试获取不存在的缓存键"""
        # 获取不存在的键，应该返回None或默认值
        result1 = self.cache_manager.get("nonexistent_key")
        result2 = self.cache_manager.get("nonexistent_key", default="default_value")
        
        # 验证结果
        self.assertIsNone(result1)
        self.assertEqual(result2, "default_value")
    
    def test_cache_expiry(self):
        """测试缓存过期功能"""
        # 设置一个过期时间为1秒的缓存
        self.cache_manager.set("expiring_key", "expiring_value", ttl=1)
        
        # 立即获取，应该能获取到
        result1 = self.cache_manager.get("expiring_key")
        self.assertEqual(result1, "expiring_value")
        
        # 等待1.5秒后再次获取，应该过期
        time.sleep(1.5)
        result2 = self.cache_manager.get("expiring_key")
        self.assertIsNone(result2)
    
    def test_delete(self):
        """测试删除缓存功能"""
        # 设置缓存
        self.cache_manager.set("delete_key", "delete_value")
        
        # 删除缓存
        self.cache_manager.delete("delete_key")
        
        # 验证缓存已删除
        result = self.cache_manager.get("delete_key")
        self.assertIsNone(result)
    
    def test_clear(self):
        """测试清除所有缓存功能"""
        # 设置多个缓存
        self.cache_manager.set("key1", "value1")
        self.cache_manager.set("key2", "value2")
        
        # 清除所有缓存
        self.cache_manager.clear()
        
        # 验证所有缓存已清除
        self.assertIsNone(self.cache_manager.get("key1"))
        self.assertIsNone(self.cache_manager.get("key2"))
    
    def test_cache_to_file_and_get_from_file(self):
        """测试文件缓存功能"""
        # 准备测试数据
        test_data = {
            "name": "test_name",
            "value": 42,
            "items": ["item1", "item2", "item3"]
        }
        
        # 缓存到文件
        self.cache_manager.cache_to_file("file_cache_key", test_data)
        
        # 验证文件存在
        expected_file_path = os.path.join(self.test_cache_dir, "file_cache_key.json")
        self.assertTrue(os.path.exists(expected_file_path))
        
        # 从文件读取缓存
        result = self.cache_manager.get_from_file("file_cache_key")
        
        # 验证结果
        self.assertEqual(result, test_data)
    
    def test_cache_decorator(self):
        """测试缓存装饰器功能"""
        # 模拟一个耗时函数
        call_count = {"count": 0}
        
        @cache_result
        def slow_function(param1, param2):
            call_count["count"] += 1
            return f"result_{param1}_{param2}"
        
        # 第一次调用，应该执行函数
        result1 = slow_function(1, 2)
        self.assertEqual(result1, "result_1_2")
        self.assertEqual(call_count["count"], 1)
        
        # 第二次调用相同参数，应该从缓存返回
        result2 = slow_function(1, 2)
        self.assertEqual(result2, "result_1_2")
        self.assertEqual(call_count["count"], 1)  # 调用次数不变
        
        # 调用不同参数，应该执行函数
        result3 = slow_function(2, 3)
        self.assertEqual(result3, "result_2_3")
        self.assertEqual(call_count["count"], 2)

if __name__ == "__main__":
    import unittest
    unittest.main()