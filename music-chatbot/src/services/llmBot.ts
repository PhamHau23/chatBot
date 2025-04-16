import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const apiKey = `${process.env.GEMINI_API_KEY}`;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro", // Hoặc model bạn đang dùng
});

const generationConfig = {
    temperature: 0.7,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 2048, // Nên giảm xuống một chút cho an toàn
};

async function run(message: string, history: any[] = []): Promise<string> {
    console.log("API Key:", apiKey ? "Đã được cấu hình" : "Chưa được cấu hình!")
    console.log("Bot đang bắt đầu trả lời...")

    const chatSession = model.startChat({
        generationConfig,
        history,
    })

    const result = await chatSession.sendMessageStream(`Bạn là 1 chatbot âm nhạc, hãy trả lời thông tin của
        câu hỏi sau nếu nó liên quan đến âm nhạc và trả lời bằng tiếng việt. Câu hỏi, thông tin: ${message}`)

    process.stdout.write("Phản hồi từ Bot: ")
    const response = await result.response

    return response.text()
}

export default run
