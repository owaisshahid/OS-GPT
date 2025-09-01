"use client";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

declare global {
  interface Window {
    puter: any;
  }
}

const animations = `
@keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.animate-slideUp { animation: slideUp 0.4s ease-out; }
.animate-fadeIn { animation: fadeIn 0.6s ease-in; }
`;

export default function ChatBot() {
  const [messages, setMessages] = useState<
    { role: "user" | "assistant" | string; content: string }[]
  >([]);
  const [chatHistory, setChatHistory] = useState<
    { id: number; title: string; messages: { role: string; content: string }[] }[]
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [chatId, setChatId] = useState<number | null>(null);

  // ✅ Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("chatHistory");
    if (saved) {
      setChatHistory(JSON.parse(saved));
    }
  }, []);

  // ✅ Save history whenever it changes
  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  }, [chatHistory]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await window.puter.ai.chat(newMessages, {
        model: "gpt-4.1-mini",
        stream: true,
      });

      let reply = "";
      for await (const part of response) {
        reply += part?.text || "";
        setMessages([...newMessages, { role: "assistant", content: reply }]);
      }
    } catch (err: any) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "⚠️ Error: " + err.message },
      ]);
    }

    setLoading(false);
  };

  // ✅ Start a new chat & save old one
  const startNewChat = () => {
    if (messages.length > 0) {
      const title = messages[0]?.content.slice(0, 25) || "New Chat";
      const newHistory = {
        id: Date.now(),
        title,
        messages,
      };
      setChatHistory([newHistory, ...chatHistory]);
    }
    setMessages([]);
    setChatId(null);
  };

  // ✅ Load an old chat
  const loadChat = (id: number) => {
    const chat = chatHistory.find((c) => c.id === id);
    if (chat) {
      setMessages(chat.messages);
      setChatId(chat.id);
    }
  };

  // ✅ Clear all chat history
  const clearHistory = () => {
    setChatHistory([]);
    localStorage.removeItem("chatHistory");
  };

  // Detect mobile for better input sizing
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    const chatContainer = document.getElementById("chat-messages");
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages]);

  return (
    <>
      <style>{animations}</style>

      <div className="flex h-screen w-full flex-col md:flex-row bg-gradient-to-br from-blue-950 via-purple-900 to-black overflow-hidden relative text-white font-inter">
        {/* Sidebar */}
        <div
          className="w-full md:w-64 lg:w-72 xl:w-80 
            bg-black/40 backdrop-blur-lg border-r border-purple-700/40
            p-4 flex flex-col shadow-xl"
        >
          <h2 className="text-xl font-bold mb-6 text-center text-purple-300 animate-pulse">
            ⚡ Chat History
          </h2>

          <div className="flex-1 overflow-y-auto space-y-2">
            {chatHistory.length === 0 ? (
              <p className="text-gray-400 text-center">No chats yet</p>
            ) : (
              chatHistory.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => loadChat(chat.id)}
                  className={`w-full text-left p-2 rounded-xl truncate transition-all duration-300 ${
                    chatId === chat.id
                      ? "bg-purple-600 text-white"
                      : "bg-gray-800 hover:bg-purple-700"
                  }`}
                >
                  {chat.title}
                </button>
              ))
            )}
          </div>

          {/* ✅ Action buttons */}
          <div className="mt-4 space-y-2">
            <button
              onClick={startNewChat}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 
                text-white p-3 rounded-2xl hover:scale-105 
                transition-transform duration-300 shadow-md hover:shadow-purple-600/40"
            >
              ➕ New Chat
            </button>

            <button
              onClick={clearHistory}
              className="w-full bg-gradient-to-r from-red-600 to-pink-600 
                text-white p-3 rounded-2xl hover:scale-105 
                transition-transform duration-300 shadow-md hover:shadow-red-600/40"
            >
              🗑️ Clear History
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col rounded-t-2xl md:rounded-xl shadow-2xl overflow-hidden">
          <h1
            className="text-lg sm:text-xl font-bold py-3 text-center 
            bg-gradient-to-r from-purple-800 to-blue-700 text-white shadow-lg tracking-wide"
          >
            Owais Chatbot 🤖
          </h1>

          {/* Messages */}
          <div
            id="chat-messages"
            className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl max-w-[80%] shadow-lg transition-all duration-500 ease-in-out
                  ${
                    msg.role === "user"
                      ? "ml-auto bg-gradient-to-r from-purple-600 to-blue-600 text-white animate-slideUp"
                      : "bg-black/60 border border-purple-700/30 text-gray-200 backdrop-blur-sm animate-fadeIn"
                  }`}
              >
                <div className="prose prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {String(msg.content)}
                  </ReactMarkdown>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-3 text-purple-300 animate-pulse">
                <span className="flex gap-1">
                  <span className="w-3 h-3 rounded-full bg-purple-400 animate-bounce" />
                  <span className="w-3 h-3 rounded-full bg-blue-400 animate-bounce delay-150" />
                  <span className="w-3 h-3 rounded-full bg-purple-400 animate-bounce delay-300" />
                </span>
                <span>Thinking...</span>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 bg-black/50 border-t border-purple-800/50 flex">
            <input
              type="text"
              className="flex-1 rounded-l-2xl p-3 bg-gray-900/80 border border-purple-700/40 
                text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                focus:ring-purple-500 transition duration-300"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              style={{ fontSize: isMobile ? "16px" : undefined }}
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 
    px-5 py-3 rounded-r-2xl hover:scale-105 
    transition-transform duration-300 shadow-md 
    hover:shadow-purple-500/40 disabled:opacity-50"
            >
              Send 🚀
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
