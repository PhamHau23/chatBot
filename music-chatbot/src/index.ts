import * as express from 'express';
import * as path from 'path';
import * as cors from 'cors';
import { config } from 'dotenv';
// Import thêm TurnContext và Activity từ botbuilder
import { BotFrameworkAdapter, TurnContext, Activity } from 'botbuilder';
// ConversationState và MemoryStorage cũng cần nếu bot dùng state
import { ConversationState, MemoryStorage } from 'botbuilder';
import MyBot from './bots/bot'; // Đảm bảo import đúng class MyBot đã sửa

const app = express();

// Import cấu hình môi trường
const ENV_FILE = path.join(__dirname, '..', '.env');
config({ path: ENV_FILE });

// Tạo HTTP app middleware
app.use(express.json()); // Rất quan trọng để parse req.body
app.use(cors());       // Cho phép CORS nếu client từ domain khác

// Tạo adapter
// Vẫn cần adapter để tạo TurnContext cho bot sử dụng (đặc biệt là cho state)
const adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId || "", // Dùng chuỗi rỗng nếu không có
    appPassword: process.env.MicrosoftAppPassword || "" // Dùng chuỗi rỗng nếu không có
});

// --- Xử lý lỗi Adapter (ít quan trọng hơn trong mô hình này) ---
// onTurnError chủ yếu được gọi bởi processActivity, mà ta không dùng nữa.
// Tuy nhiên, nó có thể được gọi nếu có lỗi khi tạo TurnContext thủ công.
adapter.onTurnError = async (context, error) => {
    console.error(`\n [onTurnError] unhandled error during context operation: ${error}`);
    // Không nên cố gắng gửi activity ở đây trong mô hình direct API
};

// --- Khởi tạo State và Bot ---
// Nếu MyBot cần ConversationState trong constructor, hãy khởi tạo và truyền vào đây
const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
// Giả sử MyBot constructor giờ nhận conversationState
// const bot = new MyBot(conversationState);
// Nếu MyBot constructor không cần gì (như code gốc bạn gửi), thì:
const bot = new MyBot();


// --- Route xử lý tin nhắn cho Direct API ---
app.post('/api/messages', async (req, res): Promise<any> => {
    // 1. Lấy Activity từ Request Body
    // Sử dụng Partial<Activity> để an toàn hơn, phòng trường hợp client gửi thiếu field
    const activity: Partial<Activity> = req.body;
    console.log('Direct API: Received Activity:', JSON.stringify(activity, null, 2));

    // Kiểm tra cơ bản xem có phải là activity hợp lệ không
    if (!activity || !activity.type) {
        console.error('Direct API Error: Invalid or missing activity in request body.');
        return res.status(400).json({ error: 'Invalid request body. Activity object expected.' });
    }

    // 2. Tạo TurnContext thủ công
    // Cần adapter và activity để tạo context. Điều này cho phép bot.onTurn
    // tiếp tục sử dụng các tính năng phụ thuộc context như state accessors.
    // Cast `activity` thành `Activity` đầy đủ khi chắc chắn về cấu trúc client gửi lên.
    const turnContext = new TurnContext(adapter, activity as Activity);

    try {
        // 3. Gọi logic chính của Bot (hàm onTurn đã sửa đổi)
        // Hàm này giờ sẽ trả về chuỗi phản hồi hoặc null
        const botResponse: string | null = await bot.onTurn(turnContext);

        console.log('Direct API: Bot Response String:', botResponse);

        // 4. Gửi phản hồi về cho Client qua HTTP Response
        if (botResponse !== null) {
            // Gửi JSON chứa câu trả lời của bot
            res.json({ reply: botResponse });
        } else {
            // Nếu bot không trả về gì (ví dụ: activity không phải message, hoặc có lỗi nội bộ đã xử lý)
            // Trả về một phản hồi thành công nhưng không có nội dung reply cụ thể
            res.status(200).json({ reply: null, message: "Activity processed, no specific reply generated." });
        }

    } catch (error) {
        // Bắt các lỗi chưa xử lý từ bot.onTurn hoặc việc tạo TurnContext
        console.error('Direct API: Unhandled error processing activity:', error);
        // Trả về lỗi 500 cho client
        res.status(500).json({ error: 'Internal server error processing your request.' });
    }
});

// Khởi động server
const port = process.env.PORT || 3978;
app.listen(port, () => {
    console.log(`\nDirect API Bot Server đang chạy tại http://localhost:${port}`);
    console.log(`\nGửi yêu cầu POST đến http://localhost:${port}/api/messages`);
    // Log cảnh báo rằng Emulator có thể không hoạt động đúng với cách này
    console.warn(`\nLưu ý: Bot Framework Emulator có thể không hoạt động đúng hoàn toàn với endpoint này vì nó không dùng processActivity chuẩn.`);
});