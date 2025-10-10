<div align="center">
  <img src="public/yanyu-logo.png" alt="YanYu Cloud Logo" width="150" height="150">
  
  <h1>YanYu Cloud Cube Integration Center</h1>
  <h2>YYC³ Integration Center</h2>
  
  <p align="center">
    <a href="#" target="_blank"><img src="https://img.shields.io/badge/version-v3.2.0-blue.svg" alt="Version" /></a>
    <a href="#" target="_blank"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License" /></a>
    <a href="#" target="_blank"><img src="https://img.shields.io/badge/python-3.10%2B-yellow.svg" alt="Python" /></a>
    <a href="#" target="_blank"><img src="https://img.shields.io/badge/node.js-16%2B-orange.svg" alt="Node.js" /></a>
    <a href="#" target="_blank"><img src="https://img.shields.io/badge/react-18%2B-blue.svg" alt="React" /></a>
    <a href="#" target="_blank"><img src="https://img.shields.io/badge/next.js-14%2B-000000.svg" alt="Next.js" /></a>
    <a href="#" target="_blank"><img src="https://img.shields.io/badge/tailwindcss-3%2B-cyan.svg" alt="Tailwind CSS" /></a>
  </p>
</div>

## 📚 项目简介
**YanYu Cloud Cube Integration Center (YYC³ Integration Center)** 是一个集成多种智能功能的现代化Web应用平台，提供文本处理、图像处理、内容生成、数据可视化等全面的智能服务集成解决方案。

本平台采用微服务架构设计，融合了人工智能、云计算和大数据技术，旨在为用户提供一站式、高效、稳定的智能服务集成体验。平台支持多种部署模式，可根据业务需求灵活扩展。

## 🚀 快速开始

### 环境要求
- Python 3.10+ 
- Node.js 16+ 
- npm/pnpm/yarn

### 安装步骤

#### 1. 克隆项目
```bash
# 克隆仓库
git clone https://your-repository-url/YYC3-Integration-Center.git
cd YYC3-Integration-Center

#### 2. 创建虚拟环境并安装Python依赖
```bash
# 创建虚拟环境
python -m venv .venv

# 激活虚拟环境
# Windows
source .venv/Scripts/activate
# MacOS/Linux
source .venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

#### 3. 安装Node.js依赖
```bash
# 使用npm
npm install

# 或使用pnpm
pnpm install

# 或使用yarn
yarn install
```

#### 4. 配置环境变量
```bash
# 复制环境变量示例文件
cp .env.example .env

# 编辑.env文件，填写必要的配置信息
# 特别是API密钥（如果需要使用相关功能）
```

#### 5. 启动应用

##### 启动Python/Gradio应用
```bash
# 启动完整版应用
APP_TYPE=full python src/app.py

# 启动简化版应用
APP_TYPE=simple python src/app.py

# 启动带API功能的应用
APP_TYPE=with_apis python src/app.py
```

##### 启动Next.js应用
```bash
# 开发模式
npm run dev

# 生产模式构建
npm run build
npm run start
```

## 📁 项目结构

<details><summary><strong>详细项目结构</strong></summary>

```
├── src/                  # 主源码目录
│   ├── app.py            # 主入口文件
│   └── modules/          # 功能模块
│       ├── api/          # API相关模块
│       ├── cache/        # 缓存管理模块
│       ├── core/         # 核心应用模块
│       ├── ui/           # 用户界面模块
│       └── utils/        # 工具函数模块
├── app/                  # Next.js应用目录
│   ├── api/              # API路由
│   ├── layout.tsx        # 布局组件
│   ├── page.tsx          # 主页组件
│   ├── fixed-page.tsx    # 固定页面组件
│   └── globals.css       # 全局样式
├── components/           # React组件库
│   └── ui/               # UI组件集合
├── lib/                  # 共享库
├── hooks/                # React Hooks
├── scripts/              # 脚本和示例
├── tests/                # 测试文件
├── public/               # 静态资源
├── requirements.txt      # Python依赖
├── package.json          # Node.js依赖
└── .env.example          # 环境变量示例
```

</details>

## 🔧 核心功能

### YYC³ 平台核心功能模块

<details><summary><strong>Python/Gradio应用功能</strong></summary>

- **智能文本处理**：文本分析、关键词提取、情感分析、大小写转换、字数统计等
- **智能图像处理**：滤镜应用、图像增强、亮度/对比度调整、艺术风格转换等
- **AI内容生成**：基于主题和风格生成文本内容，支持多种创意文案、产品描述、故事创作等
- **数据可视化**：生成各类数据图表，包括柱状图、折线图、饼图、面积图等
- **API集成**：天气查询、翻译、新闻、货币转换、IP地理查询等

</details>

<details><summary><strong>Next.js应用功能</strong></summary>

- **现代化UI界面**：使用React和Tailwind CSS构建的专业级用户界面
- **API监控仪表板**：实时监控API调用和性能指标
- **服务状态管理**：监控和管理各服务组件的运行状态
- **数据分析**：提供系统运行数据的统计和分析功能
- **错误处理**：完善的错误边界和异常管理机制
- **响应式设计**：适配不同设备尺寸的用户体验

</details>

## ⚙️ 配置说明

### 环境变量配置

主要环境变量包括：

<details><summary><strong>基础配置</strong></summary>

- `APP_TYPE`: 应用类型，可选值: full, simple, with_apis
- `LOG_LEVEL`: 日志级别，可选值: DEBUG, INFO, WARNING, ERROR
- `CACHE_DEFAULT_TTL`: 默认缓存过期时间（秒）
- `NODE_ENV`: Node.js环境模式，可选值: development, production

</details>

<details><summary><strong>API配置</strong></summary>

- `WEATHER_API_KEY`: 天气API密钥
- `TRANSLATION_API_KEY`: 翻译API密钥
- `NEWS_API_KEY`: 新闻API密钥
- `IP_GEOLOCATION_API_KEY`: IP地理定位API密钥

</details>

<details><summary><strong>服务配置</strong></summary>

- `GRADIO_SHARE`: 是否启用共享模式
- `GRADIO_SERVER_NAME`: 服务器名称
- `GRADIO_SERVER_PORT`: 服务器端口
- `GRADIO_DEBUG`: 是否启用调试模式
- `NEXT_PUBLIC_API_URL`: 前端API基础URL

</details>

## 👨‍💻 开发指南

### 代码风格规范
- **Python代码**：遵循PEP 8规范
- **TypeScript代码**：遵循ESLint配置
- **提交前检查**：运行`black`格式化Python代码，确保代码风格一致性

### 测试与质量保障
```bash
# 运行Python测试
pytest -v

# 运行Python代码覆盖率检查
pytest --cov=src tests/

# 运行TypeScript类型检查
tsc --noEmit

# 运行ESLint检查
npx eslint . --ext .ts,.tsx

# 运行代码格式化检查
npx prettier --check .
```

### 开发工作流
1. 创建功能分支 (`feature/your-feature-name`)
2. 开发功能并编写测试
3. 运行测试和代码质量检查
4. 提交代码并创建Pull Request
5. 代码审查通过后合并到主分支

## 🚦 CI/CD流程

项目支持GitHub Actions或其他CI/CD平台的自动化构建、测试和部署流程：

<details><summary><strong>CI/CD工作流</strong></summary>

1. **代码提交**：开发者提交代码到Git仓库
2. **持续集成**：自动运行测试、代码质量检查和构建
3. **持续部署**：通过自动部署脚本部署到测试/生产环境
4. **监控反馈**：收集部署后系统运行状态和性能数据

</details>

## 🤝 贡献指南

我们欢迎社区贡献来改进和完善YYC³ Integration Center平台：

<details><summary><strong>贡献流程</strong></summary>

1. Fork项目仓库
2. 创建功能分支 (`feature/your-feature-name` 或 `fix/your-bugfix`)
3. 提交更改并确保通过所有测试
4. 编写清晰的Pull Request描述
5. 等待代码审查和合并

</details>

## 📝 许可证

本项目采用[MIT License](LICENSE)开源协议。

## 📊 技术栈概览

<details><summary><strong>主要技术栈</strong></summary>

### 后端/API
- **Python 3.10+**：核心编程语言
- **Gradio**：交互式AI应用框架
- **FastAPI**：高性能API构建框架
- **Pandas/Numpy**：数据处理和分析
- **CacheManager**：缓存管理系统

### 前端
- **React 18+**：前端UI框架
- **Next.js 14+**：全栈React框架
- **TypeScript**：类型安全的JavaScript超集
- **Tailwind CSS 3+**：实用优先的CSS框架
- **Lucide Icons**：现代化图标库

### 基础设施
- **Node.js 16+**：JavaScript运行时
- **Git**：版本控制系统
- **Docker**：容器化部署（可选）

</details>

## 📧 联系方式

如有任何问题或建议，请联系我们：

- 电子邮件：admin@0379.email
- 官方网站：[www.yy.0379.pro](http://www.yy.0379.pro)

## 📌 特别说明

YYC³ Integration Center（言语云³集成中心）是一个面向企业和开发者的智能服务集成平台，旨在提供一站式智能服务解决方案。本平台支持多种部署模式，可根据业务需求灵活扩展。

© 2024 YanYu Cloud | 言语云³ | PyTorch AI版本 v3.2.0
