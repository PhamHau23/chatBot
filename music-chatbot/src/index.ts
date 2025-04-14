import * as express from 'express';
import * as path from 'path';
import * as cors from 'cors';
import { config } from 'dotenv';
import { BotFrameworkAdapter } from 'botbuilder';
import MyBot from './bots/bot';

const app = express();

// Import cấu hình môi trường
const ENV_FILE = path.join(__dirname, '..', '.env');
config({ path: ENV_FILE });

// Tạo HTTP app
app.use(express.json());
app.use(cors());

// Tạo adapter
const adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

// Xử lý lỗi
adapter.onTurnError = async (context, error) => {
    console.error(`\n [onTurnError] unhandled error: ${error}`);
    await context.sendActivity('Xin lỗi, bot đã gặp lỗi.');
};

const bot = new MyBot();

// Lắng nghe các tin nhắn đến
app.post('/api/messages', async (req, res) => {
    const activity = req.body;
    console.log('Received message:', activity);
    await adapter.processActivity(req, res, async (activity) => {
        console.log("Turn Context Activity:", activity); // Thêm dòng này
        await bot.onTurn(activity);
    });
});

// Khởi động server
const port = process.env.PORT || 3978;
app.listen(port, () => {
    console.log(`\nBot đang chạy tại http://localhost:${port}`);
    console.log(`\nĐể test bot, hãy mở Bot Framework Emulator và kết nối tới http://localhost:${port}/api/messages`);
});
