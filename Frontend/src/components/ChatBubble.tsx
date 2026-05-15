"use client";

interface ChatBubbleProps {
  message: string;
  sender?: "bot" | "user";
}

export default function ChatBubble({ message, sender = "bot" }: ChatBubbleProps) {
  const isUser = sender === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`p-3 rounded-lg text-xl whitespace-pre-line break-words ${
          isUser
            ? "bg-blue-500 text-black max-w-xs"
            : "bg-white text-black max-w-[75%]"
        }`}
      >
        <p>{message}</p>
      </div>
    </div>
  );
}