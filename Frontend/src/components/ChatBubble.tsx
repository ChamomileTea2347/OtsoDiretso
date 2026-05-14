"use client";

interface ChatBubbleProps {
  message: string;
  sender?: "bot" | "user";
}

export default function ChatBubble({ message, sender = "bot" }: ChatBubbleProps) {
  const isUser = sender === "user";
  return (
    <div className={`flex items-start ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs p-2 space-y-2 rounded text-xl ${
          isUser ? "bg-blue-500 text-black" : "bg-white text-black"
        }`}
      >
        {message}
      </div>
    </div>
  );
}
