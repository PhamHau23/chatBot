import * as path from 'path';
import * as restify from 'restify';
import { config } from 'dotenv';
import { BotFrameworkAdapter } from 'botbuilder';
import run from './bots/llmBot';

// Import cấu hình môi trường
const ENV_FILE = path.join(__dirname, '..', '.env');
config({ path: ENV_FILE });

// Tạo HTTP server
const server = restify.createServer();
server.use(restify.plugins.bodyParser());

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

// Lắng nghe các tin nhắn đến
server.post('/api/messages', async (req, res) => {
    console.log('Received message:', req.body);
    await adapter.processActivity(req, res, async (context) => {
        if (context.activity.type === 'message') {
            const userMessage = context.activity.text;
            const botResponse = await run(userMessage);
            await context.sendActivity(botResponse);
        }
    });
});

// Khởi động server
const port = process.env.PORT || 3978;
server.listen(port, () => {
    console.log(`\nBot đang chạy tại http://localhost:${port}`);
    console.log(`\nĐể test bot, hãy mở Bot Framework Emulator và kết nối tới http://localhost:${port}/api/messages`);
});
