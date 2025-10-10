# YanYu Cloud Cube Integration Center - 项目结构规范

## 1. 项目概述
YanYu Cloud Cube Integration Center是一个集成AI功能和API服务的综合应用平台，采用前后端分离架构，前端基于Next.js，后端提供Gradio接口和REST API。

## 2. 目录结构规范

### 2.1 核心目录结构
```
/Users/my/YYC-gradio_demo/
├── app/             # Next.js前端应用 (主要入口)
├── src/             # 核心后端代码
│   ├── app.py       # 后端主入口
│   └── modules/     # 功能模块
├── lib/             # 公共工具库
├── components/      # React UI组件
├── public/          # 静态资源
├── tests/           # 测试代码
├── scripts/         # 辅助脚本
├── .env.example     # 环境变量示例
├── package.json     # 前端依赖配置
└── requirements.txt # 后端依赖配置
```

### 2.2 模块职责划分

| 模块名称 | 主要职责 | 文件位置 | 说明 |
|---------|---------|---------|------|
| 主应用入口 | 前端页面渲染和路由 | app/ | Next.js应用，包含主要UI界面 |
| 后端服务 | API服务和业务逻辑 | src/app.py | 统一的后端入口，管理所有服务模块 |
| API服务 | 外部API集成 | src/modules/api/ | 封装各类第三方API调用 |
| 缓存管理 | 缓存机制实现 | src/modules/cache/ | 提供内存缓存和文件缓存功能 |
| 工具库 | 通用工具函数 | lib/ | 前后端共用的工具函数 |
| UI组件 | 可复用组件 | components/ | React UI组件库 |

## 3. 版本控制策略

### 3.1 分支管理
- **main**: 主分支，保持稳定可发布状态
- **develop**: 开发分支，集成新功能
- **feature/xxx**: 特性分支，开发具体功能
- **bugfix/xxx**: Bug修复分支

### 3.2 版本命名规范
采用语义化版本号：`X.Y.Z`
- X: 重大版本更新，不兼容的API变更
- Y: 功能性更新，向后兼容
- Z: 补丁更新，修复错误

## 4. 环境配置规范

### 4.1 环境变量管理
- 所有敏感信息（如API密钥）必须从环境变量读取
- 开发环境使用`.env.local`文件，该文件已加入.gitignore
- 生产环境通过CI/CD工具注入环境变量

### 4.2 配置优先级
1. 环境变量
2. 配置文件
3. 默认值

## 5. 废弃文件处理
以下文件已被废弃，不再作为项目入口使用：
- app_simple.py
- app_with_apis.py
- app_compatible.py
- app_extended.py
- app_optimized.py

新项目开发请使用统一的入口：`app/` (前端) 和 `src/app.py` (后端)

---
更新时间：2025年4月10日