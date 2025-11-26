import Image from "next/image";

export function InvitePageHeader() {
  return (
    <header
      className="w-full max-w-lg h-[47.29px] border-b border-white/10 pt-3 pr-4 pb-3 pl-4 bg-[#191919] shrink-0 px-4 mx-auto"
      style={{
        borderBottomWidth: "1px",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="relative w-[122px] h-[23px] mx-auto">
          <Image
            src="/logo-onboarding.png"
            alt="Logo"
            fill
            fetchPriority="high"
          />
        </div>
      </div>
    </header>
  );
}
