"use client";

import {
  ArrowRightIcon,
  InviteFriendsIcon,
  UploadIcon,
  WalletIcon,
} from "@/components/icons";
import { useProfile, useLobby } from "@/state";
import { GameHistory } from "./_components/GameHistory";
import LogoIcon from "@/components/logo/LogoIcon";
import { BottomNav } from "@/components/BottomNav";
import { ProfileCard } from "./_components/ProfileCard";
import { Stats } from "./_components/Stats";
import { InviteFriendsDrawer } from "./_components/InviteFriendsDrawer";
import { useEffect, useState } from "react";
import { useMiniUser } from "@/hooks/useMiniUser";

export default function ProfilePage() {
  const { username, streak, stats, gameHistory, fetchProfile } = useProfile();
  const [inviteOpen, setInviteOpen] = useState(false);
  const { myReferral } = useLobby();
  const inviteCode = myReferral?.code ?? "------";
  const { fid } = useMiniUser();

  useEffect(() => {
    if (fid) {
      fetchProfile(String(fid)).catch((err) =>
        console.error("Failed to load profile", err)
      );
    }
  }, [fid, fetchProfile]);

  return (
    <div className="min-h-screen flex flex-col bg-figma noise ">
      {/* Header */}
      <header className="sticky top-0 z-10 w-full border-b border-white/20 px-4 py-3">
        <div className="mx-auto max-w-screen-sm flex w-full items-center justify-between">
          <div className="flex min-w-0 flex-row items-center justify-center">
            <LogoIcon />
          </div>
          <div className="flex items-center">
            <div className="flex h-7 min-w-[64px] flex-row items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
              <WalletIcon className="h-4 w-4 text-[color:var(--text-primary)]" />
              <span
                className="font-edit-undo leading-[1.1] text-[color:var(--text-primary)] text-center"
                style={{ fontSize: "clamp(0.95rem, 1.9vw, 1rem)" }}
              >
                $983.23
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main
        className="
          mx-auto w-full max-w-screen-sm px-4
          pb-[calc(env(safe-area-inset-bottom)+84px)]
          flex flex-col gap-6 sm:gap-8 pt-4
        "
      >
        {/* Title bar */}
        <div className="flex items-center justify-between">
          <button
            aria-label="Upload"
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full p-1 opacity-0"
          >
            <UploadIcon className="h-3.5 w-3.5" />
          </button>

          <h1
            className="font-edit-undo font-normal tracking-tight text-white leading-[0.92] text-center select-none"
            style={{
              fontSize: "clamp(1.2rem, 4vw, 1.375rem)",
              letterSpacing: "-0.03em",
            }}
          >
            PROFILE
          </h1>

          {/* ✨ Wire the icon to open the drawer */}
          <button
            onClick={() => setInviteOpen(true)}
            aria-label="Invite Friends"
            className="box-border flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/15 p-2 transition-opacity hover:opacity-80"
          >
            <InviteFriendsIcon className="h-[18px] w-[18px]" />
          </button>
        </div>

        <ProfileCard
          username={username}
          streak={streak}
          avatarUrl="/images/avatars/a.png"
          onUpload={() => {
            /* open picker */
          }}
        />

        {/* Big invite CTA */}
        <button
          onClick={() => setInviteOpen(true)}
          className="
            flex flex-row items-center justify-between
            w-full max-w-screen-sm min-h-[64px] h-[74px]
            mx-auto px-3 sm:px-4 box-border gap-3 rounded-[16px]
            border border-white/40 transition-transform hover:scale-[1.02]
            bg-[#FFC931] bg-blend-overlay
            [background:linear-gradient(189.66deg,rgba(0,0,0,0)_-6.71%,rgba(0,0,0,0.8)_92.73%),_#FFC931]
          "
          aria-haspopup="dialog"
          aria-controls="invite-friends-drawer"
        >
          <span
            className="font-normal text-[clamp(1.08rem,2.7vw,1.31rem)] leading-[1.3] text-foreground tracking-tight select-none px-2"
            style={{ letterSpacing: "-0.03em", fontWeight: 400 }}
          >
            INVITE FRIENDS
          </span>
          <div className="flex items-center justify-center w-[34px] h-[34px] rounded-full bg-white/15 flex-shrink-0 p-0.5 ml-2">
            <ArrowRightIcon className="w-[18px] h-[18px]" />
          </div>
        </button>

        <div className="mt-2">
          <Stats stats={stats} />
        </div>

        <div className="mt-4">
          <GameHistory gameHistory={gameHistory} />
        </div>
      </main>

      <BottomNav />

      {/* Drawer */}
      <InviteFriendsDrawer
        open={inviteOpen}
        code={inviteCode}
        onClose={() => setInviteOpen(false)}
      />
    </div>
  );
}
