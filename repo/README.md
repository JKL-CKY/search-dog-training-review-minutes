# K9 灾害搜救犬训练复盘会议系统

一个用于灾害搜救犬训练复盘会议的全栈应用，集成了音频处理、AI 分析和邮件推送功能。

## 功能特性

### 核心功能
- **搜救路径可视化** - 使用 Leaflet 地图绘制搜救犬的搜索路径
- **气味热点标记** - 在地图上标记气味发现热点，支持强度和类型
- **音频降噪处理** - 使用 librosa 去除犬吠声和户外风声
- **语音转写** - 集成 Whisper 进行会议内容自动转写
- **说话人识别** - 使用 pyannote 识别不同训导员和专家的发言
- **AI 智能分析** - OpenAI GPT 生成犬只评估和训练改进方案
- **邮件推送** - 将训练报告自动推送给搜救队成员

### 功能模块
1. **仪表盘** - 训练记录概览和统计
2. **训练记录管理** - 创建、查看、编辑训练复盘记录
3. **犬只管理** - 搜救犬信息管理
4. **训导员管理** - 训导员信息和声纹档案管理
5. **音频处理** - 上传、降噪、转写、说话人识别
6. **AI 分析** - 自动评估和改进方案生成
7. **邮件推送** - 训练报告分发

## 技术栈

### 后端
- **FastAPI** - Python Web 框架
- **SQLAlchemy** - ORM 数据库操作
- **SQLite** - 数据库（可切换为 PostgreSQL/MySQL）
- **librosa** - 音频降噪和特征提取
- **OpenAI Whisper** - 语音识别转写
- **pyannote.audio** - 说话人识别
- **OpenAI API** - AI 分析和摘要生成
- **aiosmtplib** - 异步邮件发送

### 前端
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **React Leaflet** - 地图组件
- **React Query** - 数据请求管理
- **Zustand** - 状态管理
- **Recharts** - 数据可视化（雷达图）
- **Lucide React** - 图标库

## 项目结构

```
auto105/
├── backend/                    # 后端代码
│   ├── main.py                 # FastAPI 入口
│   ├── config.py               # 配置管理
│   ├── database.py             # 数据库连接
│   ├── models.py               # SQLAlchemy 模型
│   ├── schemas.py              # Pydantic 数据模型
│   ├── routers/                # API 路由
│   │   ├── training_sessions.py
│   │   ├── audio_processing.py
│   │   ├── analysis.py
│   │   ├── email_notifications.py
│   │   ├── dogs.py
│   │   └── handlers.py
│   └── services/               # 业务服务
│       ├── audio_processor.py  # 音频处理服务
│       ├── ai_analyzer.py      # AI 分析服务
│       └── email_service.py    # 邮件服务
├── src/                        # 前端代码
│   ├── main.tsx                # React 入口
│   ├── App.tsx                 # 应用根组件
│   ├── index.css               # 全局样式
│   ├── api/                    # API 调用
│   ├── store/                  # 状态管理
│   ├── types/                  # TypeScript 类型定义
│   ├── components/             # 通用组件
│   └── pages/                  # 页面组件
├── uploads/                    # 上传文件目录
├── processed/                  # 处理后文件目录
├── requirements.txt            # Python 依赖
├── package.json                # Node 依赖
├── vite.config.ts              # Vite 配置
├── tailwind.config.js          # Tailwind 配置
└── .env.example                # 环境变量示例
```

## 快速开始

### 1. 环境配置

复制环境变量文件并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下内容：

```env
# 数据库
DATABASE_URL=sqlite:///./k9_training.db

# OpenAI API
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini

# Hugging Face Token (用于 pyannote)
HF_TOKEN=your_huggingface_token

# SMTP 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

### 2. 后端安装和运行

```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 运行后端服务
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

后端 API 文档将在 http://localhost:8000/docs 可用。

### 3. 前端安装和运行

```bash
# 安装依赖
npm install

# 运行开发服务器
npm run dev
```

前端应用将在 http://localhost:3000 可用。

## API 接口

### 训练记录
- `GET /api/sessions` - 获取训练记录列表
- `POST /api/sessions` - 创建训练记录
- `GET /api/sessions/{id}` - 获取训练记录详情
- `PUT /api/sessions/{id}` - 更新训练记录
- `DELETE /api/sessions/{id}` - 删除训练记录
- `POST /api/sessions/{id}/upload-audio` - 上传音频文件

### 音频处理
- `POST /api/audio/process` - 完整音频处理（降噪+转写+说话人识别）
- `POST /api/audio/denoise` - 仅降噪
- `POST /api/audio/transcribe` - 仅转写
- `POST /api/audio/diarize` - 仅说话人识别

### AI 分析
- `POST /api/analysis/analyze` - 分析转录内容并生成改进方案
- `GET /api/analysis/{id}/scores` - 获取评估分数
- `GET /api/analysis/{id}/improvement-plan` - 获取改进方案

### 邮件
- `POST /api/email/send-report` - 发送训练报告邮件
- `GET /api/email/{id}/history` - 获取邮件发送历史

## 使用流程

### 标准工作流

1. **创建训练记录**
   - 填写训练基本信息（时间、地点、场景类型等）
   - 关联搜救犬和训导员
   - 录入搜索路径和气味热点数据

2. **上传并处理音频**
   - 上传复盘会议录音
   - 系统自动进行：
     - 噪音抑制（去除犬吠、风声）
     - 语音转写（中文识别）
     - 说话人识别（区分不同发言者）

3. **AI 智能分析**
   - 系统分析转录内容
   - 自动评估犬只表现（8个维度）
   - 生成个性化训练改进方案

4. **邮件推送报告**
   - 输入收件人邮箱
   - 一键发送完整训练报告
   - 包含评估成绩和改进方案

## 音频处理说明

### 降噪算法
系统使用 librosa 实现三层降噪：

1. **频谱减法** - 去除背景稳态噪音
2. **犬吠声抑制** - 针对 200-2000Hz 频段的犬叫特征进行压制
3. **风噪消除** - 去除 200Hz 以下的低频风噪

### 说话人识别
使用 pyannote.audio 的预训练模型进行说话人分割和聚类，可自动识别不同训导员和专家的发言。

## 评估维度

AI 分析将从以下 8 个维度对搜救犬进行评估：

1. **气味识别准确率** - 发现目标气味的准确性
2. **搜索路径效率** - 区域覆盖的效率和系统性
3. **服从性** - 对训导员指令的执行情况
4. **抗干扰能力** - 复杂环境中的专注力
5. **耐力表现** - 长时间工作的持续能力
6. **复杂环境适应** - 不同地形环境的适应能力
7. **指令响应速度** - 对指令的反应速度
8. **团队协作能力** - 与训导员的配合默契度

## 注意事项

1. **首次运行** - 首次使用 Whisper 和 pyannote 时会下载模型文件，需要网络连接
2. **GPU 加速** - 建议使用 GPU 运行音频处理，速度提升明显
3. **音频格式** - 支持常见音频格式（wav, mp3, m4a 等）
4. **API 配额** - 注意 OpenAI API 的使用配额限制

## 许可证

MIT License
