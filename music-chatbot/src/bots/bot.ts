import { ActivityTypes, TurnContext, ConversationState, MemoryStorage } from "botbuilder"
import run from "../services/llmBot"

const HISTORY_PROPERTY = 'geminiHistory';

// Khởi tạo ConversationState với bộ lưu trữ bạn chọn (ví dụ: MemoryStorage)
const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const historyAccessor = conversationState.createProperty(HISTORY_PROPERTY);

class MyBot {
    async onTurn(turnContext: TurnContext): Promise<void> {
        if (turnContext.activity.type === ActivityTypes.Message) {
            let history = await historyAccessor.get(turnContext, []);
            const userMessage = turnContext.activity.text;
    
            console.log("Lịch sử trước khi gọi Gemini:", history);
    
            // Gọi hàm runGemini và truyền lịch sử
            const geminiResponse = await run(userMessage, history);
    
            console.log("Phản hồi từ Gemini:", geminiResponse);
    
            // Cập nhật lịch sử (có thể bạn cần định dạng lại để phù hợp với Gemini)
            history.push({ role: 'user', parts: [{ text: userMessage }] });
            history.push({ role: 'model', parts: [{ text: geminiResponse }] });
    
            await historyAccessor.set(turnContext, history);
            await turnContext.sendActivity(geminiResponse);
        }
        await conversationState.saveChanges(turnContext, false);
    }
}

export default MyBot;