const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai'); // Import thư viện OpenAI
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Khởi tạo OpenAI với API Key từ file .env
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// API 1: Xử lý câu hỏi văn bản
app.post('/ask', async (req, res) => {
    const { question, lang } = req.body;

    if (!question) {
        return res.status(400).json({ reply: "Vui lòng cung cấp câu hỏi." });
    }

    try {
        // Cấu hình prompt hệ thống (System Prompt) cho OpenAI
        const languageRequirement = lang === 'en' ? 'Please reply in English.' : 'Vui lòng trả lời bằng Tiếng Việt.';
        const systemPrompt = `Bạn là một trợ lý ảo am hiểu về Áo Ngũ Thân truyền thống của Việt Nam. ${languageRequirement}`;

        // Gọi API ChatGPT
        // Sử dụng 'gpt-4o-mini' vì đây là model thế hệ mới: siêu nhanh và rẻ
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: question }
            ],
            temperature: 0.7, // Mức độ sáng tạo của câu trả lời (0.0 đến 2.0)
        });

        // Trích xuất văn bản trả về
        const text = response.choices[0].message.content;

        // Trả kết quả về cho Frontend
        res.json({ reply: text });

    } catch (error) {
        console.error("Lỗi từ OpenAI API (Chat):", error);
        
        // Xử lý lỗi phổ biến
        if (error.status === 429) {
            res.status(429).json({ reply: "Hệ thống AI đang quá tải hoặc tài khoản của bạn đã hết giới hạn (Quota). Vui lòng kiểm tra lại thanh toán OpenAI." });
        } else {
            res.status(500).json({ reply: "Lỗi kết nối đến OpenAI. Vui lòng kiểm tra lại API Key hoặc kết nối mạng." });
        }
    }
});

// API 2: Xử lý chuyển đổi văn bản thành giọng nói (TTS)
app.post('/speak', async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).send("Vui lòng cung cấp văn bản để đọc.");
    }

    try {
        // Gọi API Text-to-Speech của OpenAI
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy", // Bạn có thể đổi sang các giọng khác: echo, fable, onyx, nova, shimmer
            input: text,
        });
        
        // Chuyển đổi dữ liệu âm thanh và gửi về Frontend
        const buffer = Buffer.from(await mp3.arrayBuffer());
        res.set('Content-Type', 'audio/mpeg');
        res.send(buffer);
        
    } catch (error) {
        console.error("Lỗi từ OpenAI API (TTS):", error);
        res.status(500).send("Lỗi tạo giọng nói từ máy chủ.");
    }
});

app.listen(port, () => {
    console.log(`✅ Server Backend đang chạy thành công tại http://localhost:${port}`);
});