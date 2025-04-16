import * as express from 'express';
import * as path from 'path';
import * as cors from 'cors';
import { config } from 'dotenv';
import { BotFrameworkAdapter, TurnContext, Activity } from 'botbuilder';
import { ConversationState, MemoryStorage } from 'botbuilder';
import MyBot from './bots/bot';

const app = express();

const ENV_FILE = path.join(__dirname, '..', '.env');
config({ path: ENV_FILE });

app.use(express.json());
app.use(cors());

// Tạo adapter
const adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId || "",
    appPassword: process.env.MicrosoftAppPassword || ""
});

adapter.onTurnError = async (context, error) => {
    console.error(`\n [onTurnError] unhandled error during context operation: ${error}`);
};

const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const bot = new MyBot();


app.post('/api/messages', async (req, res): Promise<any> => {
    const activity: Partial<Activity> = req.body;
    console.log('Direct API: Received Activity:', JSON.stringify(activity, null, 2));

    if (!activity || !activity.type) {
        console.error('Direct API Error: Invalid or missing activity in request body.');
        return res.status(400).json({ error: 'Invalid request body. Activity object expected.' });
    }
    const turnContext = new TurnContext(adapter, activity as Activity);

    try {
        const botResponse: string | null = await bot.onTurn(turnContext);

        console.log('Direct API: Bot Response String:', botResponse);

        if (botResponse !== null) {
            res.json({ reply: botResponse });
        } else {
            res.status(200).json({ reply: null, message: "Activity processed, no specific reply generated." });
        }

    } catch (error) {
        console.error('Direct API: Unhandled error processing activity:', error);
        res.status(500).json({ error: 'Internal server error processing your request.' });
    }
});

// Khởi động server
const port = process.env.PORT || 3978;
app.listen(port, () => {
    console.log(`\nDirect API Bot Server đang chạy tại http://localhost:${port}`);
    console.log(`\nGửi yêu cầu POST đến http://localhost:${port}/api/messages`);
    console.warn(`\nLưu ý: Bot Framework Emulator có thể không hoạt động đúng hoàn toàn với endpoint này vì nó không dùng processActivity chuẩn.`);
});