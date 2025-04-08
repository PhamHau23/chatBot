import { ActivityHandler, MessageFactory } from 'botbuilder';

export class SimpleBot extends ActivityHandler {
    constructor() {
        super();

        // Xử lý khi có thành viên mới tham gia
        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (const member of membersAdded) {
                if (member.id !== context.activity.recipient.id) {
                    await context.sendActivity('Xin chào! Tôi là bot trợ giúp. Bạn cần giúp gì?');
                }
            }
            await next();
        });

        // Xử lý khi nhận tin nhắn
        this.onMessage(async (context, next) => {
            const text = context.activity.text.toLowerCase();
            let responseText = '';

            // Xử lý các câu hỏi đơn giản
            if (text.includes('xin chào') || text.includes('hello')) {
                responseText = 'Xin chào! Tôi có thể giúp gì cho bạn?';
            }
            else if (text.includes('tạm biệt') || text.includes('bye')) {
                responseText = 'Tạm biệt! Hẹn gặp lại bạn.';
            }
            else if (text.includes('bạn là ai')) {
                responseText = 'Tôi là một chatbot được tạo ra để trợ giúp bạn.';
            }
            else if (text.includes('giúp') || text.includes('help')) {
                responseText = 'Tôi có thể:\n- Chào hỏi\n- Trả lời các câu hỏi đơn giản\n- Giúp bạn tìm hiểu thông tin';
            }
            else {
                responseText = 'Xin lỗi, tôi chưa hiểu câu hỏi của bạn. Bạn có thể hỏi "giúp đỡ" để xem tôi có thể làm gì.';
            }

            await context.sendActivity(MessageFactory.text(responseText));
            await next();
        });
    }
} 