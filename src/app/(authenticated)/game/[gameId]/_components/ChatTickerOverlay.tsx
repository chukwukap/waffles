import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const ALL_MESSAGES = [
  {
    name: "rugpull847",
    message: "game tuff man",
  },
  {
    name: "ianbowenthe",
    message: "LFGGGG",
  },
  {
    name: "funddswen",
    message: "Next round come onnnn",
  },
];

export default function ChatTickerOverlay({
  bottomOffset,
}: {
  bottomOffset: number;
}) {
  const messageIndex = useRef(0);
  const [chats, setChats] = useState<
    { id: number; name: string; message: string; avatarUrl: string }[]
  >([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const idx = messageIndex.current % ALL_MESSAGES.length;
      const msg = ALL_MESSAGES[idx];
      // Manipulate the avatarUrl, e.g. "/images/lobby/1.jpg", "/images/lobby/2.jpg", ...
      const avatarNum = (idx % 6) + 1; // e.g. numbers 1-6 cycling
      const avatarUrl = `/images/lobby/${avatarNum}.jpg`;

      messageIndex.current++;
      setChats((prevChats) => {
        const newList = [...prevChats, { ...msg, avatarUrl, id: Date.now() }];
        return newList.slice(-5); // keep only the last 5
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="absolute left-0 right-0 h-[136px] overflow-hidden"
      style={{ bottom: `${bottomOffset}px` }}
    >
      {/* Gradient Overlay */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(to bottom, #0E0E0E 0%, #0E0E0E 6%, transparent 100%)",
        }}
      />

      {/* Chat Content */}
      <div className="flex flex-col justify-end h-full px-4 space-y-3">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className="flex items-center gap-2 animate-fade-in"
          >
            <Image
              src={chat.avatarUrl}
              alt={`${chat.name} avatar`}
              width={20}
              height={20}
              className="rounded-full"
            />
            <span className="text-sm font-medium text-white">{chat.name}</span>
            <span className="text-sm font-medium text-white/70 font-display">
              {chat.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
