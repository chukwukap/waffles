"use client";

import { useState, useEffect, useRef } from "react";

interface Message {
  user: string;
  text: string;
  time: string;
}

export default function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollTo(0, ref.current.scrollHeight);
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const msg: Message = {
      user: "You",
      text: input,
      time: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, msg]);
    setInput("");
    await fetch("/api/chat/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: msg.text }),
    });
  };

  return (
    <div className="flex flex-col h-64 w-full max-w-md bg-zinc-900 rounded-xl overflow-hidden">
      <div ref={ref} className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((m, i) => (
          <div key={i} className="text-sm text-gray-300">
            <span className="font-semibold text-purple-400">{m.user}:</span>{" "}
            {m.text}
          </div>
        ))}
      </div>
      <div className="flex p-2 border-t border-zinc-800">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent outline-none px-2"
          placeholder="Type a message..."
        />
        <button onClick={sendMessage} className="text-purple-500 font-semibold">
          Send
        </button>
      </div>
    </div>
  );
}
