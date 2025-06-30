import express from 'express';
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

// 调试模式控制
const DEBUG_MODE = process.env.NODE_ENV !== 'production';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

// 先设置中间件
app.use(express.json());
app.use(express.static(__dirname));
app.use('/output', express.static(path.join(__dirname, 'output')));

// 创建 output 目录
await fs.mkdir(path.join(__dirname, 'output'), { recursive: true });

// 初始化 TTS (使用 MiniMax Speech-02-Turbo)
console.log('Initializing MiniMax TTS...');
console.log('MiniMax TTS ready to use via Replicate API');

// 在初始化 OpenAI 之前添加 Replicate 客户端
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// MiniMax TTS 辅助函数
async function generateSpeechWithMiniMax(text, voiceId = "Wise_Woman", language = "english") {
    try {
        console.log(`Generating speech with MiniMax TTS: voice=${voiceId}, language=${language}, text length=${text.length}`);

        // 根据语言设置language_boost参数
        let languageBoost = "English";
        if (language === "chinese") {
            languageBoost = "Chinese";
        }

        const inputParams = {
            text: text,
            voice_id: voiceId,
            speed: 1,
            volume: 1,
            pitch: 0,
            sample_rate: 32000,
            bitrate: 128000,
            channel: "mono",
            language_boost: languageBoost,
            english_normalization: true
        };

        // console.log('MiniMax TTS input parameters:', JSON.stringify(inputParams, null, 2));

        // 使用 predictions API 来获得更好的控制
        const prediction = await replicate.predictions.create({
            version: "minimax/speech-02-turbo",
            input: inputParams
        });

        // console.log('Prediction created:', prediction.id);

        // 等待预测完成
        let finalPrediction = prediction;
        while (finalPrediction.status === 'starting' || finalPrediction.status === 'processing') {
            await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
            finalPrediction = await replicate.predictions.get(prediction.id);
            // console.log('Prediction status:', finalPrediction.status);
        }

        if (finalPrediction.status === 'succeeded') {
            console.log('MiniMax TTS completed successfully');
            return finalPrediction.output; // 返回音频文件URL
        } else {
            throw new Error(`Prediction failed with status: ${finalPrediction.status}, error: ${finalPrediction.error}`);
        }
    } catch (error) {
        console.error('MiniMax TTS error:', error);
        throw error;
    }
}

// API 路由
app.get('/voices', async (req, res) => {
    console.log('GET /voices request received');
    // MiniMax Speech-02-Turbo 支持的语音列表 - 所有语音都支持中英文
    const voices = [
        { id: "Wise_Woman", name: "Wise Woman / 智慧女声", language: "multilingual", gender: "Female" },
        { id: "Friendly_Person", name: "Friendly Person / 友善声音", language: "multilingual", gender: "Neutral" },
        { id: "Inspirational_girl", name: "Inspirational Girl / 励志女孩", language: "multilingual", gender: "Female" },
        { id: "Deep_Voice_Man", name: "Deep Voice Man / 深沉男声", language: "multilingual", gender: "Male" },
        { id: "Calm_Woman", name: "Calm Woman / 平静女声", language: "multilingual", gender: "Female" },
        { id: "Casual_Guy", name: "Casual Guy / 随性男声", language: "multilingual", gender: "Male" },
        { id: "Lively_Girl", name: "Lively Girl / 活泼女孩", language: "multilingual", gender: "Female" },
        { id: "Patient_Man", name: "Patient Man / 耐心男声", language: "multilingual", gender: "Male" },
        { id: "Young_Knight", name: "Young Knight / 年轻骑士", language: "multilingual", gender: "Male" },
        { id: "Determined_Man", name: "Determined Man / 坚定男声", language: "multilingual", gender: "Male" },
        { id: "Lovely_Girl", name: "Lovely Girl / 可爱女孩", language: "multilingual", gender: "Female" },
        { id: "Decent_Boy", name: "Decent Boy / 正派男孩", language: "multilingual", gender: "Male" },
        { id: "Imposing_Manner", name: "Imposing Manner / 威严声音", language: "multilingual", gender: "Neutral" },
        { id: "Elegant_Man", name: "Elegant Man / 优雅男声", language: "multilingual", gender: "Male" },
        { id: "Abbess", name: "Abbess / 修女", language: "multilingual", gender: "Female" },
        { id: "Sweet_Girl_2", name: "Sweet Girl / 甜美女孩", language: "multilingual", gender: "Female" },
        { id: "Exuberant_Girl", name: "Exuberant Girl / 热情女孩", language: "multilingual", gender: "Female" }
    ];
    res.json(voices);
});

app.post('/generate', async (req, res) => {
    const { text, voice = "Wise_Woman", language = "english" } = req.body;

    try {
        const audioUrl = await generateSpeechWithMiniMax(text, voice, language);

        // 返回音频URL而不是音频数据
        res.json({
            success: true,
            audioUrl: audioUrl // 返回音频文件URL
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
    const { sections, language = "english" } = req.body;
    console.log('=== /generate-and-merge request ===');
    console.log('Language received:', language);
    console.log('Sections count:', sections?.length);
    // console.log('Request body:', JSON.stringify(req.body, null, 2));

    if (!sections || sections.length === 0) {
        return res.status(400).json({
            success: false,
            error: '没有有效的文本段落'
        });
    }

    // 改进文件名生成逻辑
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(__dirname, `output/${timestamp}/audio.mp3`);

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
                // 使用MiniMax生成音频，传递语言参数
                const audioUrl = await generateSpeechWithMiniMax(text, voice, language);

                // 下载音频文件
                const response = await fetch(audioUrl);
                if (!response.ok) {
                    throw new Error(`Failed to download audio: ${response.status}`);
                }

                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                const tempFile = path.join(tempDir, `temp-${i}.mp3`);
                await fs.writeFile(tempFile, buffer);
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

            // 合并音频文件 (MP3格式)
            const ffmpegPath = '/Users/katemac/anaconda3/bin/ffmpeg';
            await execAsync(`"${ffmpegPath}" -f concat -safe 0 -i "${listFile}" -c:a libmp3lame -b:a 128k "${outputFile}"`);

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
    const { theme, language = 'english' } = req.body;
    try {
        // 根据语言选择设置系统提示和用户提示
        let systemContent, userContent;

        if (language === 'chinese') {
            systemContent = '你是一位专业的故事作家。创作引人入胜且有趣的短篇故事，具有良好的情节发展。请用中文回复。';
            userContent = `请写一个关于"${theme}"的短篇故事，大约200字左右`;
        } else {
            systemContent = 'You are a professional story writer. Create engaging and interesting short stories with good plot development.';
            userContent = `Write a short story about "${theme}" in around 200 words`;
        }

        const response = await openai.chat.completions.create({
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: systemContent
                },
                {
                    role: 'user',
                    content: userContent
                }
            ],
        });

        res.json({
            success: true,
            story: response.choices[0].message.content,
            language: language
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
    const { story, language = "english" } = req.body;

    // 发送开始消息
    res.write(JSON.stringify({
        type: 'status',
        message: '正在将故事转换为脚本...'
    }) + '\n');

    try {
        // 根据语言设置系统提示
        let systemContent;
        if (language === 'chinese') {
            systemContent = `将故事转换为对话格式并返回JSON格式，要求如下：
1. 保持中文内容，不要翻译成英文
2. 分离旁白和对话
3. 不要使用星号(*)或任何特殊格式字符
4. 格式：
{
  "scenes": [
    {
      "type": "narration",
      "text": "场景描述或旁白"
    },
    {
      "type": "dialogue",
      "character": "角色名称",
      "text": "对话内容"
    }
  ]
}`;
        } else {
            systemContent = `Convert stories into dialogue format and return JSON format with these requirements:
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
}`;
        }

        const response = await openai.chat.completions.create({
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: systemContent
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
    const { topic, language = 'english' } = req.body;

    if (DEBUG_MODE) {
        console.log('=== PODCAST GENERATION DEBUG ===');
        console.log('Topic:', topic);
        console.log('Language:', language);
        console.log('DeepSeek API Key:', process.env.DEEPSEEK_API_KEY ? 'Present' : 'Missing');
    }

    try {
        if (DEBUG_MODE) console.log('Making request to DeepSeek API...');

        // 根据语言选择设置系统提示和用户提示
        let systemContent, userContent;

        if (language === 'chinese') {
            systemContent = '你是一位专业的播客内容创作者。创作引人入胜且信息丰富的播客内容，适合两位主持人之间的对话。请用中文回复。';
            userContent = `请创建一个关于"${topic}"的播客讨论大纲。内容应该信息丰富且对话性强。`;
        } else {
            systemContent = 'You are a professional podcast content creator. Create engaging and informative podcast content that is suitable for a conversation between two hosts.';
            userContent = `Create a podcast discussion outline about "${topic}". The content should be informative and conversational.`;
        }

        const response = await openai.chat.completions.create({
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: systemContent
                },
                {
                    role: 'user',
                    content: userContent
                }
            ],
        });

        if (DEBUG_MODE) console.log('DeepSeek API response received successfully');
        res.json({
            success: true,
            content: response.choices[0].message.content,
            language: language
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
    const { content, language = 'english' } = req.body;

    if (DEBUG_MODE) {
        console.log('=== PODCAST SCRIPT GENERATION DEBUG ===');
        console.log('Content length:', content ? content.length : 0);
        console.log('Language:', language);
        console.log('DeepSeek API Key:', process.env.DEEPSEEK_API_KEY ? 'Present' : 'Missing');
    }

    try {
        if (DEBUG_MODE) console.log('Making request to DeepSeek API for script generation...');

        // 根据语言设置系统提示
        let systemContent, userContent;

        if (language === 'chinese') {
            systemContent = `将内容转换为两位播客主持人（A和B）之间的自然中文对话。要求：
1. 将回复格式化为对话对象的JSON数组
2. 每个对象应该有'host'（'A'或'B'）和'text'字段
3. 保持对话自然且引人入胜
4. 保持中文内容，不要翻译成英文
格式示例：
[
    {"host": "A", "text": "欢迎收听我们的节目..."},
    {"host": "B", "text": "今天我们要讨论..."}
]`;
            userContent = `将以下内容转换为播客对话：\n${content}`;
        } else {
            systemContent = `Convert content into a natural English conversation between two podcast hosts (A and B). Requirements:
1. Format the response as JSON array of dialog objects
2. Each object should have 'host' (either 'A' or 'B') and 'text' fields
3. Keep the conversation natural and engaging
4. Convert any non-English content to English
Format example:
[
    {"host": "A", "text": "Welcome to our show..."},
    {"host": "B", "text": "Today we're discussing..."}
]`;
            userContent = `Convert this content into a podcast conversation:\n${content}`;
        }

        const response = await openai.chat.completions.create({
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: systemContent
                },
                {
                    role: 'user',
                    content: userContent
                }
            ],
        });

        if (DEBUG_MODE) console.log('DeepSeek API response received for script generation');
        const scriptContent = response.choices[0].message.content;
        if (DEBUG_MODE) {
            console.log('Generated script content:', scriptContent.substring(0, 500) + '...');
        }
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

// 获取模型配置的辅助函数
function getModelConfig(modelName) {
    const configs = {
        'black-forest-labs/flux-schnell': {
            num_inference_steps: 4,
            guidance: 3.5,
            requiresInputImage: false
        },
        'black-forest-labs/flux-dev': {
            num_inference_steps: 50,
            guidance: 3.5,
            requiresInputImage: false
        },
        'black-forest-labs/flux-1.1-pro': {
            num_inference_steps: 25,
            guidance: 3.5,
            requiresInputImage: false
        },
        'black-forest-labs/flux-kontext-pro': {
            num_inference_steps: 30,
            guidance: 2.5,
            requiresInputImage: true
        },
        'black-forest-labs/flux-kontext-max': {
            num_inference_steps: 30,
            guidance: 2.5,
            requiresInputImage: true
        }
    };

    return configs[modelName] || configs['black-forest-labs/flux-schnell'];
}

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
6. ALWAYS output in English only, regardless of input language
7. If input text is in Chinese or other languages, translate the key visual elements to English first

Story context:
${context || 'No context provided'}`
                },
                {
                    role: 'user',
                    content: `Create an English image generation prompt for this scene while maintaining consistency with any provided context. If the input text is not in English, translate the visual elements first: "${text}"`
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
    const { prompt, sectionId, seed = 1234, model = 'black-forest-labs/flux-schnell' } = req.body;

    if (!prompt) {
        return res.status(400).json({
            success: false,
            error: 'Prompt is required'
        });
    }

    console.log('Generating image for prompt:', prompt, 'using model:', model);

    const modelConfig = getModelConfig(model);

    // 注意：FLUX Kontext Pro/Max 虽然是编辑模型，但在没有输入图像时仍能生成图片
    // 只是会有警告信息，但不影响生成结果
    if (modelConfig.requiresInputImage) {
        console.log(`Model ${model} is an editing model but will work without input image (with warnings)`);
    }

    try {
        const inputParams = {
            prompt: prompt,
            seed: seed,
            num_inference_steps: modelConfig.num_inference_steps,
            guidance: modelConfig.guidance
        };

        const output = await replicate.run(model, { input: inputParams });

        console.log('Raw output from Replicate:', output);

        // 改进输出处理逻辑
        let imageUrl;
        if (typeof output === 'string' && output.startsWith('http')) {
            // 直接的URL字符串（FLUX Kontext 模型常见格式）
            imageUrl = output;
        } else if (Array.isArray(output)) {
            // 数组格式
            const firstItem = output[0];
            // 检查第一个元素是否有 url() 方法
            if (firstItem && typeof firstItem.url === 'function') {
                imageUrl = firstItem.url();
            } else {
                imageUrl = firstItem;
            }
        } else if (typeof output === 'object' && output !== null) {
            // 对象格式 - 处理完整的 Replicate 响应对象
            // 首先检查是否有 url() 方法
            if (typeof output.url === 'function') {
                imageUrl = output.url();
            } else if (output.output && Array.isArray(output.output)) {
                const firstItem = output.output[0];
                if (firstItem && typeof firstItem.url === 'function') {
                    imageUrl = firstItem.url();
                } else {
                    imageUrl = firstItem;
                }
            } else if (output.output && typeof output.output === 'string') {
                imageUrl = output.output;
            } else if (output.urls && output.urls.get) {
                imageUrl = output.urls.get;
            } else if (output.url) {
                imageUrl = output.url;
            }
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
        console.error('=== IMAGE GENERATION ERROR ===');
        console.error('Model:', model);
        console.error('Prompt:', prompt);
        console.error('Error message:', error.message);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            status: error.status,
            code: error.code
        });

        // 提供更友好的错误信息
        let userFriendlyError = error.message;
        if (error.message.includes('400')) {
            userFriendlyError = 'Invalid request parameters. Please check your model selection and try again.';
        } else if (error.message.includes('401')) {
            userFriendlyError = 'Authentication failed. Please check your API credentials.';
        } else if (error.message.includes('429')) {
            userFriendlyError = 'Rate limit exceeded. Please wait a moment and try again.';
        } else if (error.message.includes('500')) {
            userFriendlyError = 'Server error occurred. Please try again later.';
        }

        res.status(500).json({
            success: false,
            error: userFriendlyError
        });
    }
});

// 修改 generate-all-images 路由
app.post('/generate-all-images', async (req, res) => {
    const { sections, model = 'black-forest-labs/flux-schnell' } = req.body;
    
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
                const modelConfig = getModelConfig(model);

                // 注意：编辑模型在没有输入图像时仍能工作，只是会有警告
                if (modelConfig.requiresInputImage) {
                    console.log(`Using editing model ${model} without input image - will generate with warnings`);
                }

                const inputParams = {
                    prompt: prompt,
                    seed: 1234,
                    num_inference_steps: modelConfig.num_inference_steps,
                    guidance: modelConfig.guidance
                };

                const output = await replicate.run(model, { input: inputParams });

                console.log('Raw Replicate output:', output); // 添加日志

                let imageUrl;
                if (typeof output === 'string' && output.startsWith('http')) {
                    // 直接的URL字符串（FLUX Kontext 模型常见格式）
                    imageUrl = output;
                    console.log('String URL output:', imageUrl);
                } else if (Array.isArray(output)) {
                    const firstItem = output[0];
                    // 检查第一个元素是否有 url() 方法
                    if (firstItem && typeof firstItem.url === 'function') {
                        imageUrl = firstItem.url();
                        console.log('Array output with url() method:', imageUrl);
                    } else {
                        imageUrl = firstItem;
                        console.log('Array output, first item:', imageUrl);
                    }
                } else if (typeof output === 'object' && output !== null) {
                    console.log('Object output:', output);
                    // 首先检查是否有 url() 方法
                    if (typeof output.url === 'function') {
                        imageUrl = output.url();
                        console.log('Object output with url() method:', imageUrl);
                    } else if (output.output && Array.isArray(output.output)) {
                        const firstItem = output.output[0];
                        if (firstItem && typeof firstItem.url === 'function') {
                            imageUrl = firstItem.url();
                        } else {
                            imageUrl = firstItem;
                        }
                    } else if (output.output && typeof output.output === 'string') {
                        imageUrl = output.output;
                    } else if (output.urls && output.urls.get) {
                        imageUrl = output.urls.get;
                    } else {
                        imageUrl = output.url || output.image;
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
        if (DEBUG_MODE) {
            console.log('Testing DeepSeek API...');
            console.log('API Key:', process.env.DEEPSEEK_API_KEY ? 'Present' : 'Missing');
        }

        const response = await openai.chat.completions.create({
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: 'Hello, this is a test.' }],
            max_tokens: 10
        });

        results.deepseek.status = 'success';
        if (DEBUG_MODE) console.log('DeepSeek API test successful');
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
        if (DEBUG_MODE) {
            console.log('Testing Replicate API...');
            console.log('API Token:', process.env.REPLICATE_API_TOKEN ? 'Present' : 'Missing');
        }

        // 简单的模型列表请求来测试连接
        const response = await fetch('https://api.replicate.com/v1/models', {
            headers: {
                'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            results.replicate.status = 'success';
            if (DEBUG_MODE) console.log('Replicate API test successful');
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
