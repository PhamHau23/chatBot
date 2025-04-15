import {
    ActivityTypes,
    TurnContext,
    ConversationState,
    MemoryStorage,
} from "botbuilder";
import run from "../services/llmBot";

type HistoryItem = {
    role: 'user' | 'model';
    parts: { text: string }[];
};

const HISTORY_PROPERTY = 'geminiHistory';
const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const historyAccessor = conversationState.createProperty<HistoryItem[]>(HISTORY_PROPERTY);

class MyBot {

    /**
     * Handles incoming activities for the Direct API approach.
     * Instead of sending replies via sendActivity, it processes the logic
     * and returns the response string to be sent back via the HTTP response.
     *
     * @param turnContext A TurnContext object created by the adapter or manually.
     * @returns A Promise resolving to the bot's response string, or null if no response generated.
     */
    async onTurn(turnContext: TurnContext): Promise<string | null> {
        let responseToReturn: string | null = null;

        switch (turnContext.activity.type) {
            case ActivityTypes.Message:
                let history = await historyAccessor.get(turnContext, []);
                const userMessage = turnContext.activity.text;

                if (!userMessage) {
                    console.warn("Received message activity with no text.");
                    return null
                }

                console.log("Lịch sử trước khi gọi Gemini:", JSON.stringify(history));

                try {
                    // --- Call Gemini Service ---
                    const geminiResponse = await run(userMessage, history);
                    console.log("Phản hồi từ Gemini:", geminiResponse);

                    if (geminiResponse && typeof geminiResponse === 'string') {
                        // --- Update History ---
                        history.push({ role: 'user', parts: [{ text: userMessage }] });
                        history.push({ role: 'model', parts: [{ text: geminiResponse }] });

                        // --- Save History Back to State ---
                        await historyAccessor.set(turnContext, history);
                        console.log("Lịch sử sau khi gọi Gemini:", history);

                        // --- Set the response to be returned by this method ---
                        responseToReturn = geminiResponse;

                    } else {
                        console.warn("Gemini run function did not return a valid string response.");
                        responseToReturn = "Xin lỗi, tôi không thể tạo phản hồi lúc này.";
                    }

                } catch (error) {
                    console.error("!!! LỖI KHI GỌI HÀM run (Gemini):", error);
                    responseToReturn = "Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn.";
                }
                break;

            case ActivityTypes.ConversationUpdate:
                const membersAdded = turnContext.activity.membersAdded || [];
                for (const member of membersAdded) {
                    if (member.id !== turnContext.activity.recipient.id) {
                        console.log(`Direct API: Member added ${member.name} (${member.id})`);
                    }
                }
                break;

            default:
                console.log(`Received unhandled activity type: ${turnContext.activity.type}`);
                break;
        }
        try {
             await conversationState.saveChanges(turnContext, false);
        } catch (saveStateError){
            console.error("!!! LỖI KHI LƯU CONVERSATION STATE:", saveStateError);
            // If saving state fails, the history update might be lost for the next turn.
            // Consider if the responseToReturn should reflect this error.
            if (responseToReturn === null) { // Only override if no other response/error was set
                 responseToReturn = "Lỗi: Không thể lưu trạng thái cuộc trò chuyện.";
            }
        }


        // --- Return the calculated response ---
        // This will be null if it wasn't a message activity, or if an error occurred
        // and we decided to return null instead of an error message.
        return responseToReturn;
    }
}

export default MyBot;