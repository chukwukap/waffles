const ChatInput = ({ onOpenChat }: { onOpenChat: () => void }) => {
  return (
    <div className="w-full h-[78px] pt-[12px] pr-[16px] pb-[12px] pl-[16px] flex flex-col  bg-[#0E0E0E]">
      <button
        onClick={onOpenChat}
        className="flex items-center justify-start w-full max-w-lg h-[46px] pt-[14px] pr-4 pb-[14px] pl-4 rounded-[900px] bg-white/5 text-white/80 font-display font-medium text-[14px] leading-[130%] tracking-[-0.03em]"
      >
        Type...
      </button>
    </div>
  );
};

export { ChatInput };
