"""
HTTP工具模块单元测试
"""

import os
import sys
import unittest
from unittest import mock
from unittest.mock import patch, MagicMock

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
from src.modules.utils.http_utils import (
    HTTPUtils, HTTPRequestError, RetryConfig,
    http_get, http_post, http_put, http_delete
)

class TestHTTPUtils(unittest.TestCase):
    
    def setUp(self):
        """每个测试方法执行前的设置"""
        self.http_utils = HTTPUtils()
    
    @patch('src.modules.utils.http_utils.requests.Session')
    def test_create_session(self, mock_session_class):
        """测试创建会话功能"""
        # 配置模拟对象
        mock_session = mock_session_class.return_value
        
        # 调用方法
        session = self.http_utils._create_session()
        
        # 验证结果
        mock_session_class.assert_called_once()
        mock_session.mount.assert_any_call('http://', mock.ANY)
        mock_session.mount.assert_any_call('https://', mock.ANY)
        self.assertEqual(session.timeout, 30)
    
    @patch('src.modules.utils.http_utils.HTTPUtils._create_session')
    def test_request_success(self, mock_create_session):
        """测试成功的HTTP请求"""
        # 配置模拟对象
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.raise_for_status.return_value = None
        
        mock_session = MagicMock()
        mock_session.request.return_value = mock_response
        
        mock_create_session.return_value = mock_session
        
        # 重新初始化HTTPUtils以使用模拟的create_session
        self.http_utils = HTTPUtils()
        
        # 调用方法
        response = self.http_utils.request('GET', 'https://example.com')
        
        # 验证结果
        mock_session.request.assert_called_once_with(
            method='GET',
            url='https://example.com',
            headers=None,
            params=None,
            data=None,
            json=None,
            timeout=None,
            verify=True
        )
        mock_response.raise_for_status.assert_called_once()
        self.assertEqual(response, mock_response)
    
    @patch('src.modules.utils.http_utils.HTTPUtils._create_session')
    def test_request_failure(self, mock_create_session):
        """测试失败的HTTP请求"""
        # 配置模拟对象
        mock_session = MagicMock()
        mock_session.request.side_effect = requests.exceptions.RequestException("Connection error")
        
        mock_create_session.return_value = mock_session
        
        # 重新初始化HTTPUtils以使用模拟的create_session
        self.http_utils = HTTPUtils()
        
        # 调用方法并验证异常
        with self.assertRaises(HTTPRequestError):
            self.http_utils.request('GET', 'https://example.com')
    
    @patch('src.modules.utils.http_utils.HTTPUtils.request')
    def test_get_method(self, mock_request):
        """测试GET方法"""
        # 配置模拟对象
        mock_response = MagicMock()
        mock_request.return_value = mock_response
        
        # 调用方法
        response = self.http_utils.get('https://example.com', params={'key': 'value'})
        
        # 验证结果
        mock_request.assert_called_once_with(
            'GET', 'https://example.com', params={'key': 'value'},
            headers=None
        )
        self.assertEqual(response, mock_response)
    
    @patch('src.modules.utils.http_utils.HTTPUtils.request')
    def test_post_method(self, mock_request):
        """测试POST方法"""
        # 配置模拟对象
        mock_response = MagicMock()
        mock_request.return_value = mock_response
        
        # 调用方法
        response = self.http_utils.post(
            'https://example.com', 
            json={'key': 'value'}
        )
        
        # 验证结果
        mock_request.assert_called_once_with(
            'POST', 'https://example.com', data=None,
            json={'key': 'value'}, headers=None
        )
        self.assertEqual(response, mock_response)
    
    @patch('src.modules.utils.http_utils.HTTPUtils.request')
    def test_put_method(self, mock_request):
        """测试PUT方法"""
        # 配置模拟对象
        mock_response = MagicMock()
        mock_request.return_value = mock_response
        
        # 调用方法
        response = self.http_utils.put(
            'https://example.com', 
            data={'key': 'value'}
        )
        
        # 验证结果
        mock_request.assert_called_once_with(
            'PUT', 'https://example.com', data={'key': 'value'},
            json=None, headers=None
        )
        self.assertEqual(response, mock_response)
    
    @patch('src.modules.utils.http_utils.HTTPUtils.request')
    def test_delete_method(self, mock_request):
        """测试DELETE方法"""
        # 配置模拟对象
        mock_response = MagicMock()
        mock_request.return_value = mock_response
        
        # 调用方法
        response = self.http_utils.delete('https://example.com')
        
        # 验证结果
        mock_request.assert_called_once_with(
            'DELETE', 'https://example.com', headers=None
        )
        self.assertEqual(response, mock_response)
    
    @patch('src.modules.utils.http_utils.os.makedirs')
    @patch('src.modules.utils.http_utils.open')
    @patch('src.modules.utils.http_utils.HTTPUtils._create_session')
    def test_download_file_success(self, mock_create_session, mock_open, mock_makedirs):
        """测试成功下载文件"""
        # 配置模拟对象
        mock_file = mock_open.return_value.__enter__.return_value
        
        mock_response = MagicMock()
        mock_response.raise_for_status.return_value = None
        mock_response.iter_content.return_value = [b'chunk1', b'chunk2']
        
        mock_session = MagicMock()
        mock_session.get.return_value.__enter__.return_value = mock_response
        
        mock_create_session.return_value = mock_session
        
        # 重新初始化HTTPUtils以使用模拟的create_session
        self.http_utils = HTTPUtils()
        
        # 调用方法
        result = self.http_utils.download_file(
            'https://example.com/file.txt',
            '/tmp/test/file.txt'
        )
        
        # 验证结果
        mock_makedirs.assert_called_once()
        mock_session.get.assert_called_once_with(
            'https://example.com/file.txt',
            stream=True,
            headers=None
        )
        mock_response.raise_for_status.assert_called_once()
        mock_response.iter_content.assert_called_once_with(chunk_size=8192)
        self.assertEqual(mock_file.write.call_count, 2)
        self.assertTrue(result)
    
    @patch('src.modules.utils.http_utils.os.makedirs')
    @patch('src.modules.utils.http_utils.open')
    @patch('src.modules.utils.http_utils.HTTPUtils._create_session')
    @patch('src.modules.utils.http_utils.os.path.exists')
    @patch('src.modules.utils.http_utils.os.remove')
    def test_download_file_failure(self, mock_remove, mock_exists, mock_create_session, mock_open, mock_makedirs):
        """测试下载文件失败"""
        # 配置模拟对象
        mock_exists.return_value = True
        
        mock_session = MagicMock()
        mock_session.get.side_effect = Exception("Download failed")
        
        mock_create_session.return_value = mock_session
        
        # 重新初始化HTTPUtils以使用模拟的create_session
        self.http_utils = HTTPUtils()
        
        # 调用方法
        result = self.http_utils.download_file(
            'https://example.com/file.txt',
            '/tmp/test/file.txt'
        )
        
        # 验证结果
        mock_makedirs.assert_called_once()
        mock_exists.assert_called_once_with('/tmp/test/file.txt')
        mock_remove.assert_called_once_with('/tmp/test/file.txt')
        self.assertFalse(result)
    
    @patch('src.modules.utils.http_utils.http_utils')
    def test_shortcut_functions(self, mock_http_utils):
        """测试快捷函数"""
        # 配置模拟对象
        mock_response = MagicMock()
        mock_http_utils.get.return_value = mock_response
        mock_http_utils.post.return_value = mock_response
        mock_http_utils.put.return_value = mock_response
        mock_http_utils.delete.return_value = mock_response
        
        # 调用快捷函数
        response1 = http_get('https://example.com')
        response2 = http_post('https://example.com')
        response3 = http_put('https://example.com')
        response4 = http_delete('https://example.com')
        
        # 验证结果
        mock_http_utils.get.assert_called_once_with('https://example.com')
        mock_http_utils.post.assert_called_once_with('https://example.com')
        mock_http_utils.put.assert_called_once_with('https://example.com')
        mock_http_utils.delete.assert_called_once_with('https://example.com')
        self.assertEqual(response1, mock_response)
        self.assertEqual(response2, mock_response)
        self.assertEqual(response3, mock_response)
        self.assertEqual(response4, mock_response)

class TestRetryConfig(unittest.TestCase):
    
    def test_retry_config_init(self):
        """测试RetryConfig初始化"""
        # 默认参数
        config1 = RetryConfig()
        self.assertEqual(config1.total, 3)
        self.assertEqual(config1.backoff_factor, 0.3)
        self.assertEqual(config1.status_forcelist, (500, 502, 503, 504))
        self.assertIsNone(config1.allowed_methods)
        
        # 自定义参数
        config2 = RetryConfig(
            total=5,
            backoff_factor=0.5,
            status_forcelist=(429, 500),
            allowed_methods=('GET', 'POST')
        )
        self.assertEqual(config2.total, 5)
        self.assertEqual(config2.backoff_factor, 0.5)
        self.assertEqual(config2.status_forcelist, (429, 500))
        self.assertEqual(config2.allowed_methods, ('GET', 'POST'))

if __name__ == "__main__":
    unittest.main()