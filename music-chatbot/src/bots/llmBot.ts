// Import các module cần thiết
import { GoogleGenerativeAI } from "@google/generative-ai"; // Import thêm GenerateContentResponse để type hint cho chunk
import "dotenv/config"; // Import và cấu hình thư viện 'dotenv' để tải biến môi trường từ file .env

// Lấy API key từ biến môi trường
const apiKey = `${process.env.GEMINI_API_KEY}`
// Khởi tạo GoogleGenerativeAI client với API key
const genAI = new GoogleGenerativeAI(apiKey)

// Chọn model Gemini muốn sử dụng
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-thinking-exp-01-21", // Cập nhật tên model nếu cần
});

// Cấu hình các tham số cho việc sinh nội dung
const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 65536, // Giới hạn token vẫn áp dụng cho tổng độ dài phản hồi
};

// Hàm chính để chạy chat, sử dụng streaming
async function run(message: string): Promise<string> {
  console.log("API Key:", apiKey ? "Đã được cấu hình" : "Chưa được cấu hình!");

  // Bắt đầu một phiên chat mới
  const chatSession = model.startChat({
    generationConfig,
    history: [],
  });

  // ---- Thông báo bắt đầu xử lý ----
  console.log("Bot đang bắt đầu trả lời (streaming)...");
  // ---------------------------------

  // Gửi tin nhắn và nhận về một stream kết quả
  // sendMessageStream trả về một Promise giải quyết thành một đối tượng chứa cả stream và response tổng hợp
  const result = await chatSession.sendMessageStream(`Bạn là một chatbot về âm nhạc. Chỉ cần trả lời bằng tiếng việt, hãy đưa
    thông tin về ${message}, chỉ trả lời chi tiết nếu có yêu cầu. Hãy trả lời nếu thông tin liên quan đến âm nhạc, 
    đưa ra lời xin lỗi nếu không liên quan, luôn ghi nhớ rằng bạn là một chatbot âm nhạc`);

  let accumulatedText = ""; // Biến để tích lũy văn bản từ các chunk

  // Sử dụng vòng lặp for await...of để xử lý từng chunk dữ liệu từ stream
  // Mỗi 'chunk' là một đối tượng GenerateContentResponse chứa một phần của phản hồi
  process.stdout.write("Phản hồi từ Bot: "); // Bắt đầu dòng output
  for await (const chunk of result.stream) {
    try {
        // Lấy phần văn bản từ chunk hiện tại
        const chunkText = chunk.text();
        // In ngay lập tức phần văn bản nhận được ra console mà không xuống dòng
        // Điều này tạo hiệu ứng "gõ chữ"
        process.stdout.write(chunkText);
        // Cộng dồn vào biến văn bản đầy đủ
        accumulatedText += chunkText;
    } catch (error) {
        console.error("\nLỗi khi xử lý chunk:", error);
        // Cân nhắc có nên dừng xử lý hay bỏ qua chunk lỗi
    }
  }

  // ---- Thông báo đã xử lý xong stream ----
  console.log("\nBot đã trả lời xong (stream kết thúc).");
  console.log(chatSession.getHistory())

  // Trả về toàn bộ văn bản đã được tích lũy
  return accumulatedText;
}

// Xuất hàm `run`
export default run;

// --- Ví dụ cách gọi hàm run ---
// run("Kể tên một vài ca sĩ nhạc pop Việt Nam nổi tiếng?")
//   .then(response => {
//     console.log("\n--- Hoàn tất ---");
//     // console.log("Văn bản cuối cùng nhận được:", response);
//   })
//   .catch(error => {
//     console.error("\n--- Lỗi tổng thể ---", error);
//   });