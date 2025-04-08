import axios from 'axios';
import 'dotenv/config';


interface DeepSeekMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface DeepSeekResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

class DeepSeekService {
    private readonly apiKey: string;
    private readonly apiUrl: string;

    constructor() {
        this.apiKey = process.env.DEEPSEEK_API_KEY || '';
        this.apiUrl = 'https://api.deepseek.com/chat/completions';

        if (!this.apiKey) {
            throw new Error('DeepSeek API key is not configured');
        }
    }

    async chat(message: string): Promise<string> {
        console.log('2',this.apiKey)
        try {
            console.log('3','đã chạy')
            const response = await axios.post<DeepSeekResponse>(
                this.apiUrl,
                {
                    messages: [
                        {
                            role: 'user',
                            content: message
                        }
                    ],
                    model: 'deepseek-chat',
                    temperature: 0.7,
                    max_tokens: 1000
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('4','đã chạy')

            return response.data.choices[0].message.content;
        } catch (error) {
            console.log('5','lỗi')
            if (axios.isAxiosError(error)) {
                console.error('DeepSeek API Error:', error.response?.data || error.message);
            } else {
                console.error('Error:', error);
            }
            throw new Error('Failed to get response from DeepSeek');
        }
    }

    async chatWithHistory(messages: DeepSeekMessage[]): Promise<string> {
        console.log('6','đã chạy', process.env.DEEPSEEK_API_KEY)
        try {
            const response = await axios.post<DeepSeekResponse>(
                this.apiUrl,
                {
                    messages,
                    model: 'deepseek-chat',
                    temperature: 0.7,
                    max_tokens: 1000
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data.choices[0].message.content;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('DeepSeek API Error:', error.response?.data || error.message);
            } else {
                console.error('Error:', error);
            }
            throw new Error('Failed to get response from DeepSeek');
        }
    }
}

export default new DeepSeekService();
