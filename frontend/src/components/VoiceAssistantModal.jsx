import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  Bot,
  User,
  RefreshCw,
  HelpCircle,
  Radio,
  Zap,
} from 'lucide-react';
import { sendVoiceQuery } from '../services/api';

export default function VoiceAssistantModal({ isOpen, onClose }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [answer, setAnswer] = useState('');
  const [functionTriggered, setFunctionTriggered] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef(null);

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  // Text to Speech
  const speakText = useCallback(
    (text) => {
      if (isMuted || !('speechSynthesis' in window)) return;

      try {
        window.speechSynthesis.cancel(); // Stop any previous speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'vi-VN';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis notice:', err.message);
      }
    },
    [isMuted]
  );

  // Submit voice or text query to backend
  const handleSendQuery = async (queryText) => {
    const cleanText = queryText?.trim();
    if (!cleanText || isLoading) return;

    setIsLoading(true);
    setAnswer('');
    setFunctionTriggered('');

    try {
      const res = await sendVoiceQuery(cleanText);
      const data = res?.data || res;
      const replyText =
        data?.reply || 'Dạ em đã nhận được câu hỏi nhưng chưa có phản hồi.';
      setAnswer(replyText);
      setFunctionTriggered(data?.functionTriggered || '');
      speakText(replyText);
    } catch (err) {
      const errReply =
        'Dạ em bị mất kết nối với máy chủ, anh/chị vui lòng thử lại nhé!';
      setAnswer(errReply);
      speakText(errReply);
    } finally {
      setIsLoading(false);
    }
  };

  // Start Voice Recognition
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Trình duyệt chưa hỗ trợ Web Speech API. Bạn có thể gõ câu hỏi bằng ô nhập bên dưới.');
      return;
    }

    try {
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
        return;
      }

      window.speechSynthesis?.cancel();
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      recognition.onresult = (event) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);

        if (event.results[0].isFinal) {
          setIsListening(false);
          handleSendQuery(currentText);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Start listening error:', err.message);
      setIsListening(false);
    }
  };

  // Quick suggestions
  const quickPrompts = [
    'Còn chảo Sunhouse trong kho không?',
    'Hôm nay bán được bao nhiêu tiền rồi?',
    'Có món nào sắp hết hàng không?',
    'Món nào đọng vốn trên 45 ngày?',
  ];

  const handleSelectQuickPrompt = (prompt) => {
    setTranscript(prompt);
    handleSendQuery(prompt);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    setTranscript(textInput.trim());
    handleSendQuery(textInput.trim());
    setTextInput('');
  };

  // Stop speech when closing modal
  useEffect(() => {
    if (!isOpen) {
      window.speechSynthesis?.cancel();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setIsListening(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-200">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-slate-900 text-sm">
                  Trợ lý Giọng nói Kho hàng (Voice BI)
                </h3>
                <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                  Gemini Flash
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Hỏi tự nhiên bằng tiếng Việt về tồn kho & doanh thu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const nextMute = !isMuted;
                setIsMuted(nextMute);
                if (nextMute) window.speechSynthesis?.cancel();
              }}
              title={isMuted ? 'Bật giọng đọc' : 'Tắt giọng đọc'}
              className={`p-2 rounded-full transition-colors ${
                isMuted
                  ? 'bg-slate-100 text-slate-400'
                  : 'bg-indigo-50 text-indigo-600'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Main Voice Microphone Interaction Area */}
          <div className="flex flex-col items-center justify-center py-6 bg-gradient-to-b from-indigo-50/60 to-purple-50/40 rounded-3xl border border-indigo-100/80 relative overflow-hidden">
            {/* Background pulsating effect when listening */}
            {isListening && (
              <>
                <div className="absolute w-36 h-36 rounded-full bg-rose-400/20 animate-ping" />
                <div className="absolute w-28 h-28 rounded-full bg-rose-400/30 animate-pulse" />
              </>
            )}

            {/* Big Mic Button */}
            <button
              type="button"
              onClick={startListening}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 active:scale-90 ${
                isListening
                  ? 'bg-rose-500 shadow-rose-300 ring-8 ring-rose-200 animate-pulse'
                  : 'bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-700 shadow-indigo-300 hover:shadow-indigo-400'
              }`}
            >
              {isListening ? (
                <MicOff className="w-8 h-8 animate-bounce" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>

            <div className="mt-3 text-center z-10 px-4">
              <span
                className={`text-xs font-bold ${
                  isListening ? 'text-rose-600 animate-pulse' : 'text-slate-700'
                }`}
              >
                {isListening ? 'Đang lắng nghe câu hỏi của bạn...' : 'Chạm vào Micro để bắt đầu nói'}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isListening
                  ? 'Hãy nói câu hỏi bằng tiếng Việt (ví dụ: Còn chảo Sunhouse không?)'
                  : 'Nhận diện giọng nói chuẩn Web Speech API (vi-VN)'}
              </p>
            </div>
          </div>

          {/* Transcript & Response Chat Bubbles */}
          {(transcript || isLoading || answer) && (
            <div className="space-y-3 pt-1">
              {/* User Question Bubble */}
              {transcript && (
                <div className="flex items-start justify-end gap-2">
                  <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-xs p-3 max-w-[85%] text-xs shadow-xs">
                    <p className="font-medium leading-relaxed">"{transcript}"</p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 text-xs font-bold">
                    <User className="w-4 h-4" />
                  </div>
                </div>
              )}

              {/* AI Processing Status */}
              {isLoading && (
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-slate-100 rounded-2xl rounded-tl-xs p-3 text-xs text-slate-600 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                    <span>Trợ lý đang tra cứu dữ liệu kho...</span>
                  </div>
                </div>
              )}

              {/* AI Answer Bubble */}
              {answer && !isLoading && (
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-purple-50/80 border border-purple-200 rounded-2xl rounded-tl-xs p-3 max-w-[85%] text-xs text-slate-800 shadow-xs space-y-1.5">
                    {functionTriggered && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-full">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Tool: {functionTriggered}</span>
                      </span>
                    )}
                    <p className="font-sans leading-relaxed text-slate-800 text-xs select-text">
                      {answer}
                    </p>
                    <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Được hỗ trợ bởi Gemini Function Calling</span>
                      <button
                        onClick={() => speakText(answer)}
                        className="text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Nghe lại</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Prompts Suggestions */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Gợi ý câu hỏi nhanh (Chạm để hỏi):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSelectQuickPrompt(prompt)}
                  className="text-xs bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 py-1.5 px-3 rounded-xl transition-all text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Text Input Fallback (for noisy environments) */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/90 shrink-0">
          <form onSubmit={handleFormSubmit} className="flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Hoặc gõ câu hỏi tại đây (VD: Còn chảo Sunhouse không)..."
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
            <button
              type="submit"
              disabled={isLoading || !textInput.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-1 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
