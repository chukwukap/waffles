import { useState, useRef, useEffect } from "react";
import { ChatIcon, SendIcon } from "@/components/icons";
import Backdrop from "@/components/ui/Backdrop";
import Image from "next/image";

// Single Comment component
const Comment = ({
  name,
  time,
  message,
  avatarUrl,
}: {
  name: string;
  time: string;
  message: string;
  avatarUrl: string;
}) => (
  <div className="flex w-full flex-col items-start gap-2">
    {/* User + Time */}
    <div className="flex items-center gap-1.5">
      {/* Replaced Next/Image with standard <img> tag */}
      <Image
        src={avatarUrl}
        alt={`${name} avatar`}
        width={20}
        height={20}
        className="rounded-full"
      />
      <span
        className="text-sm font-medium text-white"
        style={{ letterSpacing: "-0.03em" }}
      >
        {name}
      </span>
      <span className="h-0.5 w-0.5 rounded-full bg-gray-400"></span>
      <span
        className="text-[10px] font-medium text-gray-400"
        style={{ letterSpacing: "-0.03em" }}
      >
        {time}
      </span>
    </div>
    {/* Comment Body */}
    <div className="flex w-full flex-col justify-center rounded-r-lg rounded-bl-lg border border-white/5 bg-white/10 p-3">
      <p
        className="text-sm font-medium text-white"
        style={{ letterSpacing: "-0.03em" }}
      >
        {message}
      </p>
    </div>
  </div>
);

export const Chat = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [message, setMessage] = useState("");
  const [comments, setComments] = useState([
    {
      id: 1,
      name: "rugpull847",
      time: "13:42",
      message: "game tuff man",
      avatarUrl: "/images/lobby/1.jpg",
    },
    {
      id: 2,
      name: "ianbowenthe",
      time: "13:42",
      message: "LFGGGG",
      avatarUrl: "/images/lobby/2.jpg",
    },
    {
      id: 3,
      name: "funddswen",
      time: "13:42",
      message: "Next round come onnnn",
      avatarUrl: "/images/lobby/3.jpg",
    },
    {
      id: 4,
      name: "apestonk",
      time: "13:42",
      message: "👀",
      avatarUrl: "/images/lobby/4.jpg",
    },
    {
      id: 5,
      name: "0xpotato",
      time: "13:42",
      message: "is this thing working",
      avatarUrl: "/images/lobby/5.jpg",
    },
    {
      id: 6,
      name: "bullishmaxi",
      time: "13:42",
      message: "i love this game",
      avatarUrl: "/images/lobby/6.jpg",
    },
  ]);

  const chatListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null); // Ref for the input

  // Auto-scroll to bottom when new comments are added
  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message.trim() === "") return;

    const newComment = {
      id: Date.now(),
      name: "You",
      time: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      message: message.trim(),
      avatarUrl: "/images/lobby/7.jpg", // Placeholder for user's avatar
    };

    setComments([...comments, newComment]);
    setMessage("");
  };

  const hasText = message.trim().length > 0;

  return (
    <>
      <Backdrop isOpen={isOpen} onClose={onClose} />
      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 flex h-[644px] w-full flex-col
                    rounded-t-[20px] bg-gradient-to-b from-[#1E1E0E] to-black
                    transition-transform duration-500 ease-in-out
                    ${isOpen ? "translate-y-0" : "translate-y-full"}`}
      >
        {/* Header */}
        <header
          className="relative flex h-[56px] w-full flex-shrink-0 items-center border-b border-white/10 bg-[#191919] px-6 py-3 rounded-t-[20px]"
          style={{
            minHeight: "56px",
          }}
        >
          {/* Grabber */}
          <button
            onClick={onClose}
            className="absolute top-2 left-1/2 h-3 w-14 -translate-x-1/2 rounded-full 
                       group transition-all focus:outline-none"
            aria-label="Close chat"
            tabIndex={0}
            style={{ zIndex: 10 }}
          >
            <div className="absolute top-1/2 left-1/2 h-[4px] w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40 group-hover:bg-white/60 group-active:bg-white/80 transition-all" />
          </button>
          {/* The actual content */}
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <ChatIcon
                className="w-7 h-7 text-[#3795F6] -ml-2"
                style={{ minWidth: 28, minHeight: 28 }}
              />
              <span className="font-bold uppercase text-white font-body tracking-[0.04em] text-[1.40rem] select-none">
                LOBBY&nbsp;CHAT
              </span>
            </div>
            <span
              className="text-white font-bold text-[1.1rem] font-body tracking-tight select-none"
              style={{
                fontSize: "1.1rem",
                letterSpacing: "0.005em",
              }}
            >
              00:10
            </span>
          </div>
        </header>

        {/* Comment List */}
        <div
          ref={chatListRef}
          className="flex-1 space-y-3.5 overflow-y-auto p-4"
        >
          {comments.map((comment) => (
            <Comment
              key={comment.id}
              name={comment.name}
              time={comment.time}
              message={comment.message}
              avatarUrl={comment.avatarUrl}
            />
          ))}
        </div>

        {/* Footer Input */}
        <footer className="h-[98px] w-full flex-shrink-0 bg-[#0E0E0E] p-4 pt-5">
          <form
            onSubmit={handleSubmit}
            onClick={() => inputRef.current?.focus?.()} // Click wrapper to focus input
            className="flex h-[58px] w-full items-center gap-3 rounded-full bg-white/5 px-4 cursor-text" // Add cursor-text
          >
            <input
              ref={inputRef} // Assign the ref
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a comment"
              className="flex-1 bg-transparent text-sm font-medium text-white placeholder:text-white/40
                         focus:outline-none"
              style={{ letterSpacing: "-0.03em" }}
            />
            {/* Send Button - appears when there is text */}
            <button
              type="submit"
              disabled={!hasText}
              className={`flex h-[30px] w-[50px] items-center justify-center rounded-full bg-blue-500
                         transition-all duration-200 ease-in-out
                         ${
                           hasText
                             ? "scale-100 opacity-100"
                             : "scale-50 opacity-0"
                         }
                         ${!hasText ? "pointer-events-none" : ""}
                         hover:bg-blue-400 active:bg-blue-600
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                         focus-visible:ring-offset-2 focus-visible:ring-offset-black`}
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </form>
        </footer>
      </div>
    </>
  );
};
