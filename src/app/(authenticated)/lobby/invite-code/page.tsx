import LogoIcon from "@/components/logo/LogoIcon";
import InviteCodeScreen from "./_components/InviteCodeScreen";

export default function InviteCodePage() {
  return (
    <div className="min-h-screen  flex flex-col">
      <div
        className={
          "p-4 flex items-center justify-center border-y border-border bg-figma-gradient"
        }
      >
        <LogoIcon />
      </div>
      <InviteCodeScreen />
    </div>
  );
}
