---
name: conversational-voice-bi
description: >-
  Use this skill whenever implementing voice queries, conversational reporting, Web Speech API integration,
  or Gemini Function Calling (Tools) for conversational business intelligence in NestJS and React.
---

# Conversational Voice BI (Voice-to-Insights) Guide

## Overview
Tính năng Voice BI cho phép chủ cửa hàng (kể cả người lớn tuổi, không quen nhìn biểu đồ) nhấn nút Micro trên điện thoại và hỏi bằng giọng nói tự nhiên tiếng Việt:
- *"Hôm nay bán được bao nhiêu tiền rồi em?"*
- *"Trong kho còn bao nhiêu cái chảo chống dính Sunhouse?"*
- *"Có mặt hàng nào sắp hết không?"*

Hệ thống hoạt động theo luồng:
```text
[Giọng nói người dùng] 
  -> Web Speech API (Client-side) 
  -> Text tiếng Việt 
  -> NestJS API 
  -> Gemini Function Calling (Tools) 
  -> Truy vấn MongoDB an toàn 
  -> Gemini tóm tắt câu trả lời tự nhiên 
  -> Trả về Text & Web Speech Synthesis đọc to câu trả lời cho chủ quán.
```

---

## 1. Phía Frontend: Tích hợp Web Speech API (React)

```jsx
import React, { useState } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import axios from 'axios';

export function VoiceAssistantModal({ isOpen, onClose }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt chưa hỗ trợ nhận diện giọng nói. Hãy dùng Google Chrome hoặc Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN'; // Nhận diện tiếng Việt
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setIsListening(false);
      await sendVoiceQuery(text);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const sendVoiceQuery = async (queryText) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/ai/voice-query', { query: queryText });
      const reply = res.data.data.reply;
      setAnswer(reply);
      speakText(reply); // Đọc câu trả lời thành tiếng
    } catch (err) {
      setAnswer("Có lỗi khi tra cứu dữ liệu, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="p-4 bg-white rounded-2xl shadow-xl">
      <button 
        onClick={startListening}
        className={`p-5 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-blue-600'} text-white shadow-lg`}
      >
        {isListening ? <MicOff size={32} /> : <Mic size={32} />}
      </button>
      {transcript && <p className="mt-3 text-sm text-gray-500 italic">" {transcript} "</p>}
      {loading && <p className="mt-2 text-sm text-blue-500">Đang tra cứu dữ liệu kho...</p>}
      {answer && <p className="mt-3 font-medium text-gray-800">{answer}</p>}
    </div>
  );
}
```

---

## 2. Phía Backend: NestJS Gemini Function Calling (Tools)

Thay vì cho LLM tự sinh câu lệnh SQL/Mongo dễ bị injection hoặc lỗi cú pháp, ta định nghĩa các Tool cụ thể:

```typescript
import { GoogleGenAI, Type } from '@google/genai';

// Khai báo công cụ cho Gemini
const inventoryTools = [
  {
    functionDeclarations: [
      {
        name: 'getRevenueReport',
        description: 'Lấy báo cáo doanh thu và số đơn hàng theo ngày hoặc khoảng thời gian.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            timeframe: { type: Type.STRING, enum: ['today', 'yesterday', 'this_week', 'this_month'] }
          },
          required: ['timeframe']
        }
      },
      {
        name: 'checkProductInventory',
        description: 'Tra cứu số lượng tồn kho và vị trí kệ hàng của một sản phẩm theo tên.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            productName: { type: Type.STRING, description: 'Tên hoặc từ khóa sản phẩm cần tìm' }
          },
          required: ['productName']
        }
      },
      {
        name: 'getLowStockAlerts',
        description: 'Lấy danh sách các mặt hàng đang chạm ngưỡng báo động sắp hết hàng.',
        parameters: { type: Type.OBJECT, properties: {} }
      }
    ]
  }
];
```

Khi người dùng hỏi *"Còn chảo Sunhouse không?"*, Gemini sẽ tự động kích hoạt hàm `checkProductInventory({ productName: "chảo Sunhouse" })`. NestJS thực thi hàm này trên MongoDB một cách an toàn tuyệt đối và trả về kết quả để Gemini tổng hợp câu trả lời ngôn ngữ tự nhiên.
