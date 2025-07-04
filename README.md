<div align="right">
  <a href="#chinese">中文</a> | <a href="#english">English</a>
</div>

<h1 id="english">AI ContentCraft</h1>

AI ContentCraft is a versatile content creation tool that integrates text generation, speech synthesis, and image generation capabilities. It helps creators quickly generate stories, podcast scripts, and accompanying audio-visual content.

## ✨ Latest Updates (v1.2.1)

### 🎨 Modern UI Overhaul
- **Complete design system refresh** with modern aesthetics
- **Responsive layout** optimized for all device sizes
- **Dark/Light theme support** with smooth transitions
- **Enhanced accessibility** with WCAG 2.1 compliance
- **Improved user experience** with better visual hierarchy

### 🔧 Technical Improvements
- **Upgraded to MiniMax Speech-02-Turbo** for superior voice quality
- **16+ multilingual voices** with natural speech patterns
- **Enhanced image generation** using latest FLUX models
- **Optimized performance** with better memory management
- **Improved error handling** and user feedback

## Features

- 🎯 **Story Generation**: Automatically generate short stories based on themes
- 📝 **Script Conversion**: Convert stories into standard script format with scene breakdown
- 🎙️ **Podcast Content**: Generate podcast outlines and natural dialogue scripts
- 🗣️ **Speech Synthesis**: High-quality text-to-speech with 16+ multilingual voices
- 🎨 **Image Generation**: AI-powered scene illustrations using FLUX models
- 🌐 **Bilingual Support**: Seamless Chinese-English content conversion and translation
- 📊 **Batch Processing**: Bulk generation and download of audio/visual content
- 🎨 **Modern UI**: Responsive design with dark/light themes and accessibility features

## Demo

### Video Demos
- [🎬 Bilibili demo](https://www.bilibili.com/video/BV1a8w6eaELj/)
- [🎬 Youtube demo](https://www.youtube.com/watch?v=2xEOzjsiFUY)

## Tech Stack

### Frontend
- **HTML5/CSS3**: Modern responsive design with CSS Grid and Flexbox
- **JavaScript (ES6+)**: Vanilla JS with modern async/await patterns
- **Modern UI System**: Custom design system with CSS variables and themes
- **Accessibility**: WCAG 2.1 compliant with screen reader support

### Backend
- **Node.js + Express**: RESTful API server with ES modules
- **Stream Processing**: Real-time progress updates for long operations

### AI Services
- **DeepSeek AI**: Advanced text generation ([DeepSeek Chat API](https://platform.deepseek.com/))
- **MiniMax Speech-02-Turbo**: High-quality multilingual TTS ([via Replicate](https://replicate.com/minimax/speech-02-turbo))
- **Replicate FLUX Models**: State-of-the-art image generation ([Replicate API](https://replicate.com/))

### Tools & Dependencies
- **FFmpeg**: Professional audio processing and merging ([FFmpeg official site](https://ffmpeg.org/))
- **dotenv**: Secure environment variable management
- **nodemon**: Development hot-reload support

## Prerequisites

### System Requirements
- **Node.js 18+** (recommended) or Node.js 16+
- **FFmpeg** (latest stable version)
- **4GB+ RAM** (recommended for optimal performance)
- **2GB+ free disk space** (for output files)

### API Keys Required
- **DeepSeek AI**: Account and API key ([Sign up here](https://platform.deepseek.com/))
- **Replicate**: Account and API token ([Sign up here](https://replicate.com/))

### Network
- Stable internet connection for AI service calls
- Outbound HTTPS access to API endpoints

## Quick Start

1. **Clone and Install**:
```bash
git clone https://github.com/nicekate/AI-ContentCraft.git
cd AI-ContentCraft

# Install all dependencies (recommended)
npm install

# Or install manually
npm install dotenv express openai replicate
npm install -D nodemon
```

2. **Environment Setup**:
Create a `.env` file in the project root:
```bash
# Required API Keys
DEEPSEEK_API_KEY=your_deepseek_api_key_here
REPLICATE_API_TOKEN=your_replicate_token_here

# Optional: Backup OpenAI API (if DeepSeek quota exceeded)
OPENAI_API_KEY=your_openai_key_here
```

3. **Install FFmpeg**:

**macOS (Homebrew)**:
```bash
brew install ffmpeg
```

**Ubuntu/Debian**:
```bash
sudo apt update && sudo apt install ffmpeg
```

**Windows**: Download from [FFmpeg.org](https://ffmpeg.org/download.html) and add to PATH

4. **Launch Application**:
```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start
```

5. **Access the App**:
Open your browser and navigate to `http://localhost:3000`

## Usage Guide

### 📖 Story Generation
1. **Input Theme**: Enter your story concept or theme
2. **Generate Story**: AI creates a complete short story
3. **Script Conversion**: Transform story into scene-by-scene script format
4. **Voice Selection**: Choose from 16+ multilingual voices for each scene
5. **Audio Generation**: Create professional audio narration
6. **Image Creation**: Generate AI illustrations for each scene
7. **Export**: Download complete multimedia story package

### 🎙️ Podcast Creation
1. **Topic Input**: Describe your podcast theme or subject
2. **Content Generation**: AI creates structured podcast outline
3. **Dialogue Script**: Convert to natural conversation format
4. **Multi-Voice Setup**: Assign different voices to Host A and Host B
5. **Audio Production**: Generate complete podcast episode
6. **Translation**: Convert between Chinese and English

### 🗣️ Voice Synthesis
- **16+ Voice Options**: Male, female, and neutral voices
- **Multilingual Support**: Seamless Chinese-English switching
- **Batch Processing**: Generate multiple audio segments
- **Auto-Merge**: Combine segments into single audio file
- **High Quality**: 32kHz sample rate, professional output

### 🎨 Image Generation
- **FLUX AI Models**: State-of-the-art image generation
- **Smart Prompts**: Auto-generated scene descriptions
- **Batch Creation**: Generate multiple images simultaneously
- **Gallery View**: Auto-generated showcase pages
- **Download Options**: Individual or bulk download

## API Reference

### Core Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/voices` | GET | List available TTS voices |
| `/generate-story` | POST | Generate story from theme |
| `/generate-script` | POST | Convert story to script format |
| `/generate-podcast` | POST | Create podcast content |
| `/generate-podcast-script` | POST | Convert to dialogue script |

### Audio Processing
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/generate` | POST | Single text-to-speech conversion |
| `/generate-and-merge` | POST | Batch TTS with audio merging |

### Image Generation
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/generate-image-prompt` | POST | Create image prompts |
| `/generate-image` | POST | Generate single image |
| `/generate-all-images` | POST | Batch image generation |
| `/download-images` | POST | Package images for download |

### Translation
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/translate-podcast` | POST | Translate podcast scripts |
| `/translate-story-script` | POST | Translate story scripts |

> 📚 **Full API Documentation**: See [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md) for detailed API specifications

## Important Notes

### 🔑 API Requirements
- **Valid API keys** are required for all AI services
- **DeepSeek API**: Text generation and translation
- **Replicate API**: Voice synthesis and image generation
- Monitor your API usage and costs

### ⚙️ System Configuration
- **FFmpeg**: Must be properly installed and accessible
- **Memory**: 4GB+ RAM recommended for optimal performance
- **Storage**: Ensure adequate space for output files
- **Network**: Stable connection required for AI service calls

### 🛡️ Security
- Keep API keys secure in `.env` file
- Never commit `.env` to version control
- Use environment variables in production
- Monitor API usage for unexpected charges

### 🚀 Performance Tips
- Use batch operations for multiple items
- Monitor output directory size
- Clear temporary files periodically
- Consider API rate limits for bulk operations

## Error Handling

Common issues and solutions:

1. API Call Failures
   - Check if API keys are correct
   - Verify API call quota
   - Check specific error messages

2. Audio Processing Issues
   - Confirm FFmpeg installation
   - Check audio file format
   - Review server logs

3. Image Generation Failures
   - Check Replicate API quota
   - Verify prompt compliance
   - Review error responses

## Contributing

We welcome contributions! Here's how to get started:

### 🚀 Quick Contribution Guide
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### 🐛 Bug Reports
- Use the GitHub Issues tab
- Include detailed reproduction steps
- Provide system information (OS, Node.js version, etc.)

### 💡 Feature Requests
- Check existing issues first
- Describe the use case and expected behavior
- Consider implementation complexity

### 📚 Documentation
- Help improve README and technical docs
- Add code comments and examples
- Translate content to other languages

> 📖 **Detailed Guidelines**: See [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md) for development setup and coding standards

## License

MIT

---

<h1 id="chinese">AI ContentCraft</h1>

AI ContentCraft 是一个多功能的内容创作工具，集成了文本生成、语音合成、图像生成等功能。它可以帮助创作者快速生成故事、播客脚本和配套的音视频内容。

## ✨ 最新更新 (v1.2.1)

### 🎨 现代化UI全面升级
- **完整设计系统重构**，采用现代化美学设计
- **响应式布局优化**，适配所有设备尺寸
- **深色/浅色主题支持**，平滑过渡效果
- **增强无障碍功能**，符合WCAG 2.1标准
- **改进用户体验**，更好的视觉层次结构

### 🔧 技术改进
- **升级到MiniMax Speech-02-Turbo**，提供卓越语音质量
- **16+种多语言语音**，自然语音模式
- **增强图像生成**，使用最新FLUX模型
- **性能优化**，更好的内存管理
- **改进错误处理**和用户反馈机制

## 功能特点

- 🎯 **故事生成**：基于主题自动生成完整短篇故事
- 📝 **脚本转换**：将故事转换为分场景的标准剧本格式
- 🎙️ **播客内容**：生成播客大纲和自然对话脚本
- 🗣️ **语音合成**：16+种多语言高质量语音选择
- 🎨 **图像生成**：使用FLUX模型的AI场景插图生成
- 🌐 **双语支持**：中英文内容无缝转换和翻译
- 📊 **批量处理**：音视频内容的批量生成和下载
- 🎨 **现代界面**：响应式设计，支持深色/浅色主题和无障碍功能

## 演示

### 视频演示
- [🎬 B站演示](https://www.bilibili.com/video/BV1a8w6eaELj/)
- [🎬 Youtube演示](https://www.youtube.com/watch?v=2xEOzjsiFUY)

## 技术栈

### 前端技术
- **HTML5/CSS3**：使用CSS Grid和Flexbox的现代响应式设计
- **JavaScript (ES6+)**：原生JS配合现代async/await模式
- **现代UI系统**：基于CSS变量和主题的自定义设计系统
- **无障碍支持**：符合WCAG 2.1标准，支持屏幕阅读器

### 后端技术
- **Node.js + Express**：使用ES模块的RESTful API服务器
- **流式处理**：长时间操作的实时进度更新

### AI服务集成
- **DeepSeek AI**：先进的文本生成（[DeepSeek Chat API](https://platform.deepseek.com/)）
- **MiniMax Speech-02-Turbo**：高质量多语言TTS（[通过Replicate](https://replicate.com/minimax/speech-02-turbo)）
- **Replicate FLUX模型**：最先进的图像生成（[Replicate API](https://replicate.com/)）

### 工具和依赖
- **FFmpeg**：专业音频处理和合并（[FFmpeg官网](https://ffmpeg.org/)）
- **dotenv**：安全的环境变量管理
- **nodemon**：开发环境热重载支持

## 前置条件

### 系统要求
- **Node.js 18+**（推荐）或 Node.js 16+
- **FFmpeg**（最新稳定版）
- **4GB+ 内存**（推荐，确保最佳性能）
- **2GB+ 可用磁盘空间**（用于输出文件）

### 必需的API密钥
- **DeepSeek AI**：账号和API密钥（[注册地址](https://platform.deepseek.com/)）
- **Replicate**：账号和API令牌（[注册地址](https://replicate.com/)）

### 网络要求
- 稳定的互联网连接用于AI服务调用
- 支持HTTPS出站访问到API端点

## 快速开始

1. **克隆和安装**：
```bash
git clone https://github.com/nicekate/AI-ContentCraft.git
cd AI-ContentCraft

# 安装所有依赖（推荐）
npm install

# 或手动安装
npm install dotenv express openai replicate
npm install -D nodemon
```

2. **环境配置**：
在项目根目录创建 `.env` 文件：
```bash
# 必需的API密钥
DEEPSEEK_API_KEY=your_deepseek_api_key_here
REPLICATE_API_TOKEN=your_replicate_token_here

# 可选：备用OpenAI API（当DeepSeek配额用完时）
OPENAI_API_KEY=your_openai_key_here
```

3. **安装FFmpeg**：

**macOS (Homebrew)**：
```bash
brew install ffmpeg
```

**Ubuntu/Debian**：
```bash
sudo apt update && sudo apt install ffmpeg
```

**Windows**：从 [FFmpeg.org](https://ffmpeg.org/download.html) 下载并添加到PATH

4. **启动应用**：
```bash
# 开发模式（支持热重载）
npm run dev

# 生产模式
npm start
```

5. **访问应用**：
打开浏览器访问 `http://localhost:3000`

## 使用说明

### 故事生成
1. 输入故事主题
2. 点击生成故事
3. 可选择转换为脚本格式
4. 支持生成配套的场景图片

### 播客内容
1. 输入播客主题
2. 生成播客大纲
3. 转换为对话脚本
4. 选择不同声音进行配音

### 音频处理
1. 支持多段文本分别配音
2. 自动合并多个音频片段
3. 提供音频预览和下载

### 图片生成
1. 自动为场景生成提示词
2. 批量生成场景图片
3. 提供图片预览和批量下载
4. 自动生成图片展示页面

## API 接口

主要接口包括：
- `/generate-story`: 生成故事
- `/generate-script`: 转换脚本
- `/generate-podcast`: 生成播客内容
- `/generate`: 单段文本转语音
- `/generate-and-merge`: 多段文本转语音并合并
- `/generate-image`: 生成图片
- `/translate-podcast`: 播客脚本翻译
- `/translate-story-script`: 故事脚本翻译

## 重要说明

### 🔑 API要求
- **有效的API密钥**是使用所有AI服务的必要条件
- **DeepSeek API**：文本生成和翻译
- **Replicate API**：语音合成和图像生成
- 请监控您的API使用量和费用

### ⚙️ 系统配置
- **FFmpeg**：必须正确安装并可访问
- **内存**：推荐4GB+内存以获得最佳性能
- **存储**：确保有足够空间存储输出文件
- **网络**：AI服务调用需要稳定的网络连接

### 🛡️ 安全性
- 将API密钥安全保存在`.env`文件中
- 切勿将`.env`文件提交到版本控制
- 生产环境中使用环境变量
- 监控API使用情况以防意外费用

### 🚀 性能建议
- 对多个项目使用批量操作
- 监控输出目录大小
- 定期清理临时文件
- 批量操作时考虑API速率限制

## 错误处理

常见问题及解决方案：

1. API 调用失败
   - 检查 API 密钥是否正确
   - 确认 API 调用限额
   - 查看具体错误信息

2. 音频处理问题
   - 确认 FFmpeg 安装正确
   - 检查音频文件格式
   - 查看服务器日志

3. 图片生成失败
   - 检查 Replicate API 配额
   - 确认提示词是否合规
   - 查看错误响应

## 贡献指南

欢迎贡献代码！以下是参与方式：

### 🚀 快速贡献指南
1. **Fork** 仓库
2. **创建** 功能分支 (`git checkout -b feature/amazing-feature`)
3. **提交** 更改 (`git commit -m 'Add amazing feature'`)
4. **推送** 到分支 (`git push origin feature/amazing-feature`)
5. **创建** Pull Request

### 🐛 错误报告
- 使用GitHub Issues标签
- 包含详细的重现步骤
- 提供系统信息（操作系统、Node.js版本等）

### 💡 功能请求
- 首先检查现有issues
- 描述用例和预期行为
- 考虑实现复杂度

### 📚 文档贡献
- 帮助改进README和技术文档
- 添加代码注释和示例
- 将内容翻译成其他语言

> 📖 **详细指南**：查看 [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md) 了解开发设置和编码标准

## License

MIT
