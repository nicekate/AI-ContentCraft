import express from 'express';
import { KokoroTTS } from "kokoro-js";
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import Replicate from "replicate";

dotenv.config();

// 定义 execAsync
const execAsync = promisify(exec);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

// 先设置中间件
app.use(express.json());
app.use(express.static(__dirname));
app.use('/output', express.static(path.join(__dirname, 'output')));

// 创建 output 目录
await fs.mkdir(path.join(__dirname, 'output'), { recursive: true });

// 初始化 TTS
console.log('Initializing TTS...');
const model_id = "onnx-community/Kokoro-82M-ONNX";
const tts = await KokoroTTS.from_pretrained(model_id, {
    dtype: "q8",
});
console.log('TTS initialized successfully');

// 在初始化 OpenAI 之前添加 Replicate 客户端
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// API 路由
app.get('/voices', async (req, res) => {
    console.log('GET /voices request received');
    // 硬编码声音列表
    const voices = [
        { id: "af", name: "Default", language: "en-us", gender: "Female" },
        { id: "af_bella", name: "Bella", language: "en-us", gender: "Female" },
        { id: "af_nicole", name: "Nicole", language: "en-us", gender: "Female" },
        { id: "af_sarah", name: "Sarah", language: "en-us", gender: "Female" },
        { id: "af_sky", name: "Sky", language: "en-us", gender: "Female" },
        { id: "am_adam", name: "Adam", language: "en-us", gender: "Male" },
        { id: "am_michael", name: "Michael", language: "en-us", gender: "Male" },
        { id: "bf_emma", name: "Emma", language: "en-gb", gender: "Female" },
        { id: "bf_isabella", name: "Isabella", language: "en-gb", gender: "Female" },
        { id: "bm_george", name: "George", language: "en-gb", gender: "Male" },
        { id: "bm_lewis", name: "Lewis", language: "en-gb", gender: "Male" }
    ];
    res.json(voices);
});

app.post('/generate', async (req, res) => {
    const { text, voice = "af_nicole" } = req.body;
    
    try {
        const audio = await tts.generate(text, {
            voice: voice,
        });
        // 返回音频数据而不是保存文件
        res.json({ 
            success: true,
            audioData: audio.data // 返回音频数据
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 修改生成并合并音频的路由
app.post('/generate-and-merge', async (req, res) => {
    const { sections } = req.body;
    if (!sections || sections.length === 0) {
        return res.status(400).json({ 
            success: false, 
            error: '没有有效的文本段落' 
        });
    }

    // 改进文件名生成逻辑
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(__dirname, `output/${timestamp}/audio.wav`);
    
    try {
        // 创建临时目录和输出目录
        const tempDir = path.join(__dirname, 'temp');
        const outputDir = path.join(__dirname, 'output', timestamp);
        await fs.mkdir(tempDir, { recursive: true });
        await fs.mkdir(outputDir, { recursive: true });
        
        // 生成所有音频文件
        const audioFiles = [];
        for (let i = 0; i < sections.length; i++) {
            const { text, voice } = sections[i];
            
            // 发送进度更新
            res.write(JSON.stringify({
                type: 'progress',
                current: i + 1,
                total: sections.length,
                message: `Generating audio for section ${i + 1}/${sections.length}`
            }) + '\n');

            try {
                const audio = await tts.generate(text, { voice });
                const tempFile = path.join(tempDir, `temp-${i}.wav`);
                await audio.save(tempFile);
                audioFiles.push(tempFile);
            } catch (error) {
                console.error(`Error generating audio for section ${i}:`, error);
                res.write(JSON.stringify({
                    type: 'error',
                    message: `Failed to generate audio for section ${i + 1}: ${error.message}`
                }) + '\n');
            }
        }

        if (audioFiles.length > 0) {
            // 发送合并开始通知
            res.write(JSON.stringify({
                type: 'status',
                message: 'Merging audio files...'
            }) + '\n');

            // 创建文件列表
            const listFile = path.join(tempDir, `list-${timestamp}.txt`);
            const fileList = audioFiles.map(f => `file '${f}'`).join('\n');
            await fs.writeFile(listFile, fileList);

            // 合并音频文件
            const ffmpegPath = '/Users/katemac/anaconda3/bin/ffmpeg';
            await execAsync(`"${ffmpegPath}" -f concat -safe 0 -i "${listFile}" -c copy "${outputFile}"`);

            // 清理临时文件
            await Promise.all([
                ...audioFiles.map(f => fs.unlink(f)),
                fs.unlink(listFile)
            ]);
            
            await fs.rmdir(tempDir);

            // 发送完成消息
            res.write(JSON.stringify({
                type: 'complete',
                success: true,
                filename: path.relative(__dirname, outputFile)
            }));
            res.end();
        } else {
            throw new Error('No audio generated');
        }
    } catch (error) {
        console.error('Error generating and merging audio:', error);
        res.write(JSON.stringify({
            type: 'error',
            error: error.message
        }));
        res.end();
    }
});

// 修改生成故事的路由
app.post('/generate-story', async (req, res) => {
    const { theme } = req.body;
    try {
        const response = await openai.chat.completions.create({
            model: 'deepseek-chat',
            messages: [
                { 
                    role: 'system', 
                    content: 'You are a professional story writer. Create engaging and interesting short stories with good plot development.' 
                },
                { 
                    role: 'user', 
                    content: `Write a short story about "${theme}" in around 200 words` 
                }
            ],
        });
        
        res.json({ 
            success: true,
            story: response.choices[0].message.content 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 修改生成脚本的路由
app.post('/generate-script', async (req, res) => {
    const { story } = req.body;
    
    // 发送开始消息
    res.write(JSON.stringify({
        type: 'status',
        message: 'Converting story to script...'
    }) + '\n');

    try {
        const response = await openai.chat.completions.create({
            model: 'deepseek-chat',
            messages: [
                { 
                    role: 'system', 
                    content: `Convert stories into dialogue format and return JSON format with these requirements:
1. Convert any non-English text to English first
2. Separate narration and dialogues
3. Do not use asterisks (*) or any special formatting characters
4. Format: 
{
  "scenes": [
    {
      "type": "narration",
      "text": "scene description or narration"
    },
    {
      "type": "dialogue",
      "character": "Character Name",
      "text": "dialogue content"
    }
  ]
}
5. Keep dialogues natural and concise
6. Add scene descriptions where needed
7. Maintain story flow and emotion
8. Use appropriate names for characters` 
                },
                { 
                    role: 'user', 
                    content: `Convert this story into script format:\n${story}` 
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        });
        
        // 发送生成完成消息
        res.write(JSON.stringify({
            type: 'status',
            message: 'Processing script format...'
        }) + '\n');

        // 解析返回的 JSON 字符串
        const scriptContent = response.choices[0].message.content;
        let scriptData;
        try {
            // 尝试找到并提取 JSON 部分
            const jsonMatch = scriptContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                scriptData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Invalid script format');
            }

            // 验证数据格式
            if (!scriptData.scenes || !Array.isArray(scriptData.scenes)) {
                throw new Error('Invalid script structure');
            }

            // 处理脚本内容，移除所有星号
            scriptData.scenes = scriptData.scenes.map(scene => ({
                ...scene,
                text: scene.text.replace(/\*/g, ''),
                ...(scene.character && { character: scene.character.replace(/\*/g, '') })
            }));

            // 发送完成消息
            res.write(JSON.stringify({
                type: 'complete',
                success: true,
                script: scriptData
            }) + '\n');
            res.end();
        } catch (error) {
            console.error('Script parsing error:', error);
            console.error('Raw script content:', scriptContent);
            throw new Error('Failed to parse script format');
        }
    } catch (error) {
        console.error('Script generation error:', error);
        res.write(JSON.stringify({
            type: 'error',
            error: error.message
        }) + '\n');
        res.end();
    }
});

// 添加播客生成路由
app.post('/generate-podcast', async (req, res) => {
    const { topic } = req.body;

    console.log('=== PODCAST GENERATION DEBUG ===');
    console.log('Topic:', topic);
    console.log('DeepSeek API Key:', process.env.DEEPSEEK_API_KEY ? 'Present' : 'Missing');
    console.log('API Key length:', process.env.DEEPSEEK_API_KEY ? process.env.DEEPSEEK_API_KEY.length : 0);

    try {
        console.log('Making request to DeepSeek API...');
        const response = await openai.chat.completions.create({
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: 'You are a professional podcast content creator. Create engaging and informative podcast content that is suitable for a conversation between two hosts.'
                },
                {
                    role: 'user',
                    content: `Create a podcast discussion outline about "${topic}". The content should be informative and conversational.`
                }
            ],
        });

        console.log('DeepSeek API response received successfully');
        res.json({
            success: true,
            content: response.choices[0].message.content
        });
    } catch (error) {
        console.error('=== PODCAST GENERATION ERROR ===');
        console.error('Error message:', error.message);
        console.error('Error status:', error.status);
        console.error('Error code:', error.code);
        console.error('Full error:', error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/generate-podcast-script', async (req, res) => {
    const { content } = req.body;

    console.log('=== PODCAST SCRIPT GENERATION DEBUG ===');
    console.log('Content length:', content ? content.length : 0);
    console.log('DeepSeek API Key:', process.env.DEEPSEEK_API_KEY ? 'Present' : 'Missing');

    try {
        console.log('Making request to DeepSeek API for script generation...');
        const response = await openai.chat.completions.create({
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: `Convert content into a natural English conversation between two podcast hosts (A and B). Requirements:
1. Format the response as JSON array of dialog objects
2. Each object should have 'host' (either 'A' or 'B') and 'text' fields
3. Keep the conversation natural and engaging
4. Convert any non-English content to English
Format example:
[
    {"host": "A", "text": "Welcome to our show..."},
    {"host": "B", "text": "Today we're discussing..."}
]`
                },
                {
                    role: 'user',
                    content: `Convert this content into a podcast conversation:\n${content}`
                }
            ],
        });

        console.log('DeepSeek API response received for script generation');
        const scriptContent = response.choices[0].message.content;
        let scriptData;
        try {
            scriptData = JSON.parse(scriptContent);
        } catch (e) {
            const jsonMatch = scriptContent.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                scriptData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Invalid script format');
            }
        }

        res.json({
            success: true,
            script: scriptData
        });
    } catch (error) {
        console.error('=== PODCAST SCRIPT GENERATION ERROR ===');
        console.error('Error message:', error.message);
        console.error('Error status:', error.status);
        console.error('Error code:', error.code);
        console.error('Full error:', error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 修改 generate-image-prompt 路由
app.post('/generate-image-prompt', async (req, res) => {
    const { text, context } = req.body;
    
    if (!text) {
        return res.status(400).json({ 
            success: false, 
            error: 'Text is required' 
        });
    }

    console.log('Generating prompt for text:', text);
    
    try {
        const response = await openai.chat.completions.create({
            model: 'deepseek-chat',
            messages: [
                { 
                    role: 'system', 
                    content: `You are a professional image prompt engineer. Create concise but detailed image prompts that maintain consistency.

Requirements:
1. Keep prompts under 75 words
2. Focus on key visual elements and maintain character/setting consistency
3. Include artistic style and mood
4. Avoid NSFW content
5. Use natural, descriptive language
6. Output in English only

Story context:
${context || 'No context provided'}` 
                },
                { 
                    role: 'user', 
                    content: `Create an image generation prompt for this scene while maintaining consistency with any provided context: "${text}"` 
                }
            ],
        });

        const prompt = response.choices[0].message.content;
        console.log('Generated prompt:', prompt);
        
        res.json({ 
            success: true,
            prompt: prompt
        });
    } catch (error) {
        console.error('Prompt generation error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Failed to generate prompt'
        });
    }
});

// 修改 generate-image 路由
app.post('/generate-image', async (req, res) => {
    const { prompt, sectionId, seed = 1234 } = req.body;
    
    if (!prompt) {
        return res.status(400).json({ 
            success: false, 
            error: 'Prompt is required' 
        });
    }
    
    console.log('Generating image for prompt:', prompt);
    
    try {
        const output = await replicate.run(
            "black-forest-labs/flux-schnell",
            {
                input: {
                    prompt: prompt,
                    seed: seed,
                    num_inference_steps: 4,
                    guidance_scale: 7.5
                }
            }
        );

        console.log('Raw output from Replicate:', output);

        // 改进输出处理逻辑
        let imageUrl;
        if (Array.isArray(output)) {
            imageUrl = output[0];
        } else if (typeof output === 'object' && output !== null) {
            // 处理完整的 Replicate 响应对象
            if (output.output && Array.isArray(output.output)) {
                imageUrl = output.output[0];
            } else if (output.urls && output.urls.get) {
                imageUrl = output.urls.get;
            }
        } else if (typeof output === 'string' && output.startsWith('http')) {
            imageUrl = output;
        }

        if (!imageUrl) {
            console.error('No valid image URL found in output:', output);
            throw new Error('No valid image URL in API response');
        }

        // 确保 imageUrl 是字符串并且是有效的 URL
        imageUrl = String(imageUrl);
        if (!imageUrl.startsWith('http')) {
            throw new Error('Invalid image URL format');
        }

        console.log('Final image URL:', imageUrl);

        res.json({ 
            success: true,
            imageUrl: imageUrl,
            sectionId: sectionId
        });
    } catch (error) {
        console.error('Error generating image:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Failed to generate image'
        });
    }
});

// 修改 generate-all-images 路由
app.post('/generate-all-images', async (req, res) => {
    const { sections } = req.body;
    
    try {
        // 发送开始消息
        res.write(JSON.stringify({
            type: 'status',
            message: 'Analyzing story context...'
        }) + '\n');

        // 首先分析整个故事的上下文
        const contextResponse = await openai.chat.completions.create({
            model: 'deepseek-chat',
            messages: [
                { 
                    role: 'system', 
                    content: `Extract key story elements (characters, settings, themes) from the story sections. Keep it concise.` 
                },
                { 
                    role: 'user', 
                    content: `Analyze these story sections and extract key elements:\n${sections.map(s => s.text).join('\n\n')}` 
                }
            ],
        });

        const storyContext = contextResponse.choices[0].message.content;
        console.log('Story context:', storyContext);

        // 发送提示词生成开始消息
        res.write(JSON.stringify({
            type: 'status',
            message: 'Generating prompts...'
        }) + '\n');

        // 生成所有提示词
        const promptResults = [];
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            
            res.write(JSON.stringify({
                type: 'prompt_progress',
                current: i + 1,
                total: sections.length,
                message: `Generating prompt ${i + 1}/${sections.length}`
            }) + '\n');

            const promptResponse = await openai.chat.completions.create({
                model: 'deepseek-chat',
                messages: [
                    { 
                        role: 'system', 
                        content: `You are a professional image prompt engineer. Create concise but detailed image prompts that maintain consistency across a story.

Requirements:
1. Keep prompts under 75 words
2. Focus on key visual elements and maintain character/setting consistency
3. Include artistic style and mood
4. Avoid NSFW content
5. Use natural, descriptive language
6. Output in English only

Story context:
${storyContext}` 
                    },
                    { 
                        role: 'user', 
                        content: `Create an image generation prompt for this scene while maintaining consistency with the story context: "${section.text}"` 
                    }
                ],
            });

            promptResults.push({
                sectionId: section.id,
                prompt: promptResponse.choices[0].message.content
            });
        }

        // 发送开始生成图片的消息
        res.write(JSON.stringify({
            type: 'status',
            message: 'Generating images...'
        }) + '\n');

        // 生成所有图片
        for (let i = 0; i < promptResults.length; i++) {
            const { sectionId, prompt } = promptResults[i];
            
            res.write(JSON.stringify({
                type: 'image_progress',
                current: i + 1,
                total: promptResults.length,
                message: `Generating image ${i + 1}/${promptResults.length}`
            }) + '\n');

            try {
                const output = await replicate.run(
                    "black-forest-labs/flux-schnell",
                    {
                        input: {
                            prompt: prompt,
                            seed: 1234,
                            num_inference_steps: 4,
                            guidance_scale: 7.5
                        }
                    }
                );

                console.log('Raw Replicate output:', output); // 添加日志

                let imageUrl;
                if (Array.isArray(output)) {
                    imageUrl = output[0];
                    console.log('Array output, first item:', imageUrl);
                } else if (typeof output === 'string') {
                    imageUrl = output;
                    console.log('String output:', imageUrl);
                } else if (typeof output === 'object' && output !== null) {
                    console.log('Object output:', output);
                    if (output.output && Array.isArray(output.output)) {
                        imageUrl = output.output[0];
                    } else {
                        imageUrl = output.url || output.output || output.image;
                    }
                }

                if (!imageUrl) {
                    console.error('No valid image URL found in output:', output);
                    throw new Error('No valid image URL in API response');
                }

                // 确保 imageUrl 是字符串
                imageUrl = String(imageUrl);
                console.log('Final image URL:', imageUrl);

                res.write(JSON.stringify({
                    type: 'section_complete',
                    sectionId: sectionId,
                    prompt: prompt,
                    imageUrl: imageUrl,
                    current: i + 1,
                    total: promptResults.length
                }) + '\n');

            } catch (error) {
                console.error(`Error generating image for section ${sectionId}:`, error);
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                });
                res.write(JSON.stringify({
                    type: 'section_error',
                    sectionId: sectionId,
                    error: error.message
                }) + '\n');
            }
        }

        // 发送完成消息
        res.write(JSON.stringify({
            type: 'complete',
            message: 'All images generated successfully'
        }));
        res.end();

    } catch (error) {
        res.write(JSON.stringify({
            type: 'error',
            error: error.message
        }));
        res.end();
    }
});

// 修改批量下载图片的路由
app.post('/download-images', async (req, res) => {
    const { images, theme } = req.body;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    try {
        // 确保 output 目录存在
        const outputDir = path.join(__dirname, 'output');
        await fs.mkdir(outputDir, { recursive: true });
        
        // 直接使用时间戳创建目录
        const downloadDir = path.join(outputDir, timestamp);
        await fs.mkdir(downloadDir, { recursive: true });
        
        console.log('Downloading images to:', downloadDir);
        
        // 下载所有图片
        for (let i = 0; i < images.length; i++) {
            const { url, prompt } = images[i];
            console.log(`Downloading image ${i + 1}/${images.length} from:`, url);
            
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
                }
                
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                
                const filename = `image-${String(i + 1).padStart(3, '0')}.webp`;
                const filePath = path.join(downloadDir, filename);
                
                await fs.writeFile(filePath, buffer);
                console.log(`Saved image to:`, filePath);
                
                // 保存提示词到单独的文件
                await fs.appendFile(
                    path.join(downloadDir, 'prompts.txt'),
                    `Image ${i + 1}:\n${prompt}\nURL: ${url}\n\n`
                );
            } catch (error) {
                console.error(`Error downloading image ${i + 1}:`, error);
                await fs.appendFile(
                    path.join(downloadDir, 'errors.txt'),
                    `Failed to download image ${i + 1}:\nURL: ${url}\nError: ${error.message}\n\n`
                );
            }
        }
        
        // 创建一个简单的 HTML 预览文件，添加主题信息
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>${theme || 'Story'} - Image Gallery</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .theme { margin-bottom: 20px; color: #666; }
        .image-container { margin-bottom: 30px; }
        img { max-width: 100%; height: auto; border-radius: 8px; }
        .prompt { margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>Generated Images</h1>
    <div class="theme">Theme: ${theme || 'Story'}</div>
    ${images.map((img, i) => `
        <div class="image-container">
            <img src="image-${String(i + 1).padStart(3, '0')}.webp" alt="Generated image ${i + 1}">
            <div class="prompt">
                <strong>Prompt ${i + 1}:</strong><br>
                ${img.prompt}
            </div>
        </div>
    `).join('')}
</body>
</html>`;
        
        await fs.writeFile(path.join(downloadDir, 'gallery.html'), htmlContent);
        
        res.json({
            success: true,
            directory: path.relative(__dirname, downloadDir),
            totalImages: images.length
        });
    } catch (error) {
        console.error('Error in download-images:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 修改 OpenAI 客户端配置部分
const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com/v1',
    apiKey: process.env.DEEPSEEK_API_KEY || '', // 从环境变量读取
});

// 备用 OpenAI 客户端 (如果 DeepSeek 余额不足)
const openaiBackup = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '', // 需要添加 OpenAI API Key
});

// 在 app.use 中间件部分添加
app.use((req, res, next) => {
    // 只允许本地域名访问
    const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    }
    next();
});

// 添加 API 测试端点
app.get('/test-apis', async (req, res) => {
    const results = {
        deepseek: { status: 'unknown', error: null },
        replicate: { status: 'unknown', error: null }
    };

    // 测试 DeepSeek API
    try {
        console.log('Testing DeepSeek API...');
        console.log('API Key:', process.env.DEEPSEEK_API_KEY ? `Present (${process.env.DEEPSEEK_API_KEY.length} chars)` : 'Missing');

        const response = await openai.chat.completions.create({
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: 'Hello, this is a test.' }],
            max_tokens: 10
        });

        results.deepseek.status = 'success';
        console.log('DeepSeek API test successful');
    } catch (error) {
        results.deepseek.status = 'error';
        results.deepseek.error = {
            message: error.message,
            status: error.status,
            code: error.code
        };
        console.error('DeepSeek API test failed:', error.message);
    }

    // 测试 Replicate API
    try {
        console.log('Testing Replicate API...');
        console.log('API Token:', process.env.REPLICATE_API_TOKEN ? `Present (${process.env.REPLICATE_API_TOKEN.length} chars)` : 'Missing');

        // 简单的模型列表请求来测试连接
        const response = await fetch('https://api.replicate.com/v1/models', {
            headers: {
                'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            results.replicate.status = 'success';
            console.log('Replicate API test successful');
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        results.replicate.status = 'error';
        results.replicate.error = {
            message: error.message
        };
        console.error('Replicate API test failed:', error.message);
    }

    res.json(results);
});

// 添加翻译路由
app.post('/translate-podcast', async (req, res) => {
    const { script } = req.body;
    
    try {
        const response = await openai.chat.completions.create({
            model: 'deepseek-chat',
            messages: [
                { 
                    role: 'system', 
                    content: `Translate the podcast script to Chinese. Keep the format:
1. Keep the Host A/B labels
2. Translate naturally and maintain the conversation style
3. Return in this format:
[Host A]
Chinese translation

[Host B]
Chinese translation
` 
                },
                { 
                    role: 'user', 
                    content: `Translate this podcast script to Chinese:\n${script}` 
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        });
        
        res.json({ 
            success: true,
            translation: response.choices[0].message.content 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 添加故事脚本翻译路由
app.post('/translate-story-script', async (req, res) => {
    const { script } = req.body;
    
    try {
        const response = await openai.chat.completions.create({
            model: 'deepseek-chat',
            messages: [
                { 
                    role: 'system', 
                    content: `Translate the story script to Chinese. Keep the format:
1. Keep the [Narration] and [Dialogue] labels
2. Translate naturally and maintain the story flow
3. Return in this format:
[Narration]
Chinese translation

[Dialogue]
Character Name:
Chinese translation
` 
                },
                { 
                    role: 'user', 
                    content: `Translate this story script to Chinese:\n${script}` 
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        });
        
        res.json({ 
            success: true,
            translation: response.choices[0].message.content 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 启动服务器
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
