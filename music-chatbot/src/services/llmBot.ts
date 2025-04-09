// gemini-integration.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const apiKey = `${process.env.GEMINI_API_KEY}`
const genAI = new GoogleGenerativeAI(apiKey)
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-thinking-exp-01-21",
});
const generationConfig = {
    temperature: 0.7,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 65536,
}

async function run(message: string, history: any[] = []): Promise<string> { // Nhận thêm tham số history
    console.log("API Key:", apiKey ? "Đã được cấu hình" : "Chưa được cấu hình!")
    console.log("Bot đang bắt đầu trả lời...");

    const chatSession = model.startChat({
        generationConfig,
        history: history, // Sử dụng lịch sử được truyền vào
    });

    const result = await chatSession.sendMessageStream(`Bạn là một chatbot về âm nhạc. Chỉ cần trả lời bằng tiếng việt, hãy đưa
        thông tin về ${message}, chỉ trả lời chi tiết nếu có yêu cầu.`)

    let accumulatedText = ""

    process.stdout.write("Phản hồi từ Bot: ")
    for await (const chunk of result.stream) {
        try {
            const chunkText = chunk.text()
            process.stdout.write(chunkText)
            accumulatedText += chunkText
        } catch (error) {
            console.error("\nLỗi khi xử lý chunk:", error)
        }
    }

    console.log("\nBot đã trả lời xong")

    // Bạn có thể muốn trả về cả accumulatedText và history đã được cập nhật từ chatSession
    // để bot.js có thể lưu lại.
    return accumulatedText;
}

export default run;