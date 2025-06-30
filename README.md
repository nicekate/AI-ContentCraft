<div align="right">
  <a href="#chinese">中文</a> | <a href="#english">English</a>
</div>

<h1 id="english">AI ContentCraft</h1>

AI ContentCraft is a versatile content creation tool that integrates text generation, speech synthesis, and image generation capabilities. It helps creators quickly generate stories, podcast scripts, and accompanying audio-visual content.

## Features

- 🎯 Story Generation: Automatically generate short stories based on themes
- 📝 Script Conversion: Convert stories into standard script format
- 🎙️ Podcast Content: Generate podcast outlines and dialogue scripts
- 🗣️ Speech Synthesis: Text-to-speech support with multiple voices
- 🎨 Image Generation: Generate illustrations for story scenes
- 🌐 Bilingual Support: Support for Chinese-English content conversion
- 📊 Batch Processing: Support batch generation and download of content

## Demo

### Screenshots
![Story Generation](https://r2.kateviews.com/20250120_670.png)
![Podcast Creation](https://r2.kateviews.com/20250120_171.png)

### Video Demos
- [🎬 Bilibili demo](https://www.bilibili.com/video/BV1a8w6eaELj/)
- [🎬 Youtube demo](https://www.youtube.com/watch?v=2xEOzjsiFUY)

## Tech Stack

- Frontend: HTML/JavaScript
- Backend: Node.js + Express
- AI Services:
  - DeepSeek AI: Text generation (using [DeepSeek Chat API](https://platform.deepseek.com/))
  - MiniMax Speech-02-Turbo: Speech synthesis (using [MiniMax TTS via Replicate](https://replicate.com/minimax/speech-02-turbo))
  - Replicate: Image generation (using [Replicate API](https://replicate.com/))
- Other tools: FFmpeg (audio processing) ([FFmpeg official site](https://ffmpeg.org/))

## Prerequisites

- Node.js 16+
- FFmpeg
- API keys for AI services
  - DeepSeek AI account and API key
  - Replicate account and API token
- Stable internet connection

## Quick Start

1. Clone the project and install dependencies:
```bash
git clone https://github.com/nicekate/AI-ContentCraft.git
cd AI-ContentCraft

# Install project dependencies
npm install dotenv express openai replicate

# Install dev dependencies
npm install -D nodemon
```

2. Configure environment variables:
Create a `.env` file and add the following configuration:
```bash
DEEPSEEK_API_KEY=your_deepseek_api_key
REPLICATE_API_TOKEN=your_replicate_token
```

3. Install FFmpeg:
Ensure FFmpeg is installed on your system and update the FFmpeg path in `server.js`:
```javascript
const ffmpegPath = 'your_ffmpeg_path';
```

4. Start the server:
```bash
npm run dev
```

5. Access the application:
Open your browser and visit `http://localhost:3000`

## Usage Guide

### Story Generation
1. Input story theme
2. Click to generate story
3. Optionally convert to script format
4. Generate accompanying scene images

### Podcast Content
1. Input podcast theme
2. Generate podcast outline
3. Convert to dialogue script
4. Choose different voices for dubbing

### Audio Processing
1. Support voiceover for multiple text segments
2. Automatically merge multiple audio clips
3. Provide audio preview and download

### Image Generation
1. Automatically generate prompts for scenes
2. Batch generate scene images
3. Provide image preview and batch download
4. Auto-generate image showcase page

## API Endpoints

Main endpoints include:
- `/generate-story`: Generate story
- `/generate-script`: Convert script
- `/generate-podcast`: Generate podcast content
- `/generate`: Single text to speech
- `/generate-and-merge`: Multiple text to speech and merge
- `/generate-image`: Generate image
- `/translate-podcast`: Podcast script translation
- `/translate-story-script`: Story script translation

## Notes

- Valid API keys are required for AI services
- Audio merging requires proper FFmpeg configuration
- Recommended for local development environment
- Mind API call limits and costs

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

1. Fork the project
2. Create feature branch
3. Submit changes
4. Create Pull Request

## License

MIT

---

<h1 id="chinese">AI ContentCraft</h1>

AI ContentCraft 是一个多功能的内容创作工具，集成了文本生成、语音合成、图像生成等功能。它可以帮助创作者快速生成故事、播客脚本和配套的音视频内容。

## 功能特点

- 🎯 故事生成：基于主题自动生成短篇故事
- 📝 脚本转换：将故事转换为标准剧本格式
- 🎙️ 播客内容：生成播客大纲和对话脚本
- 🗣️ 语音合成：支持多种声音的文本转语音
- 🎨 图像生成：为故事场景生成配图
- 🌐 双语支持：支持内容的中英文转换
- 📊 批量处理：支持批量生成和下载内容

## 演示

### 应用截图
![故事生成](https://r2.kateviews.com/20250120_670.png)
![播客创作](https://r2.kateviews.com/20250120_171.png)

### 视频演示
- [🎬 B站演示](https://www.bilibili.com/video/BV1a8w6eaELj/)
- [🎬 Youtube演示](https://www.youtube.com/watch?v=2xEOzjsiFUY)

## 技术栈

- Frontend: HTML/JavaScript
- Backend: Node.js + Express
- AI Services:
  - DeepSeek AI: 文本生成（使用 [DeepSeek Chat API](https://platform.deepseek.com/)）
  - Kokoro TTS: 语音合成（使用 [Kokoro-82M-ONNX 模型](https://huggingface.co/onnx-community/Kokoro-82M-ONNX)）
  - Replicate: 图像生成（使用 [Replicate API](https://replicate.com/)）
- 其他工具：FFmpeg (音频处理) ([FFmpeg 官网](https://ffmpeg.org/))

## 前置条件

- Node.js 16+
- FFmpeg
- 各 AI 服务的 API 密钥
  - DeepSeek AI 账号和 API 密钥
  - Replicate 账号和 API Token
- 稳定的网络连接

## 快速开始

1. 克隆项目并安装依赖：
```bash
git clone https://github.com/nicekate/AI-ContentCraft.git
cd AI-ContentCraft

# 安装项目依赖
npm install dotenv express openai replicate

# 安装开发依赖
npm install -D nodemon
```

2. 配置环境变量：
创建 `.env` 文件并添加以下配置：
```bash
DEEPSEEK_API_KEY=your_deepseek_api_key
REPLICATE_API_TOKEN=your_replicate_token
```

3. 安装 FFmpeg：
确保系统中已安装 FFmpeg，并更新 `server.js` 中的 FFmpeg 路径：
```javascript
const ffmpegPath = 'your_ffmpeg_path';
```

4. 启动服务器：
```bash
npm run dev
```

5. 访问应用：
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

## 注意事项

- 需要有效的 API 密钥才能使用 AI 服务
- 音频合并功能需要正确配置 FFmpeg
- 建议在本地开发环境中使用
- 注意 API 调用限制和费用

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

1. Fork 项目
2. 创建功能分支
3. 提交变更
4. 发起 Pull Request

## License

MIT
