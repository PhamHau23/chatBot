import { ActivityTypes, TurnContext, ConversationState, MemoryStorage, ConversationReference } from "botbuilder";
import run from "../services/llmBot";

const HISTORY_PROPERTY = 'geminiHistory';
const CONVERSATION_REFERENCE_PROPERTY = 'conversationReference';

// Khởi tạo ConversationState với bộ lưu trữ bạn chọn (ví dụ: MemoryStorage)
const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const historyAccessor = conversationState.createProperty(HISTORY_PROPERTY);
const conversationReferenceAccessor = conversationState.createProperty<ConversationReference>(CONVERSATION_REFERENCE_PROPERTY);

class MyBot {
    async onTurn(turnContext: TurnContext): Promise<void> {
        if (turnContext.activity.type === ActivityTypes.ConversationUpdate) {
            const membersAdded = turnContext.activity.membersAdded || [];
            for (const member of membersAdded) {
                if (member.id !== turnContext.activity.recipient.id) {
                    const welcomeMessage = "Chào mừng bạn đến với chatbot âm nhạc! Hãy đặt câu hỏi về âm nhạc nhé.";
                    await turnContext.sendActivity(welcomeMessage);
        
                    const conversationReference = TurnContext.getConversationReference(turnContext.activity) as ConversationReference;
                    await conversationReferenceAccessor.set(turnContext, conversationReference);
                }
            }
        } else if (turnContext.activity.type === ActivityTypes.Message) {
            let history = await historyAccessor.get(turnContext, []);
            const userMessage = turnContext.activity.text;

            console.log("Lịch sử trước khi gọi Gemini:", history);

            const geminiResponse = await run(userMessage, history);

            console.log("Phản hồi từ Gemini:", geminiResponse);

            history.push({ role: 'user', parts: [{ text: userMessage }] });
            history.push({ role: 'model', parts: [{ text: geminiResponse }] });

            await historyAccessor.set(turnContext, history);
            await turnContext.sendActivity(geminiResponse);
        }
        await conversationState.saveChanges(turnContext, false);
    }
}

export default MyBot;