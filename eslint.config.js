import js from '@eslint/js';

/**
 * 简化版ESLint配置文件
 * 适用于ESLint v9及以上版本
 * 提供基础的JavaScript代码质量检查
 */
export default [
  // 忽略特定文件和目录
  { ignores: ['node_modules/', '.venv/', 'cache/', 'public/', 'dist/', 'build/', '*.py'] },
  // 基础JavaScript规则
  js.configs.recommended,
  // 自定义规则
  {
    rules: {
      'no-unused-vars': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'indent': ['error', 2],
    },
  },
];