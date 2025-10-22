"use client";

import { useEffect } from "react";
import { useProfileStore } from "@/stores/profileStore";
import { useAuthStore } from "@/stores/authStore";
import Image from "next/image";
import { shareResult } from "@/lib/share";

export default function ProfilePage() {
  const { fid } = useAuthStore();
  const { profile, fetchProfile } = useProfileStore();

  useEffect(() => {
    if (fid) fetchProfile(fid);
  }, [fid, fetchProfile]);

  if (!profile)
    return (
      <main className="flex items-center justify-center min-h-screen text-white">
        <p>Loading profile...</p>
      </main>
    );

  return (
    <main className="flex flex-col items-center justify-start min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black text-white p-6">
      <div className="flex flex-col items-center mt-10">
        <Image
          src={"/default-avatar.png"}
          alt={profile.username}
          width={100}
          height={100}
          className="rounded-full border-4 border-purple-600"
        />
        <h1 className="text-3xl font-bold mt-4">{profile.username}</h1>
        <p className="text-gray-400 text-sm">{profile.wallet}</p>
      </div>

      <div className="mt-6 text-center space-y-2">
        <p>
          🔥 Total Points: <b>{profile.totalPoints}</b>
        </p>
        <p>
          🏆 Wins: <b>{profile.wins}</b>
        </p>
        <p>
          📅 Streak: <b>{profile.streak} days</b>
        </p>
      </div>

      <div className="mt-6 w-full max-w-md bg-zinc-800 p-4 rounded-xl">
        <h2 className="text-lg font-semibold mb-3">🎖 Badges</h2>
        {profile.badges.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.badges.map((b, i) => (
              <span
                key={i}
                className="bg-purple-700/40 px-3 py-1 rounded-full text-sm"
              >
                {b}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No badges yet</p>
        )}
      </div>

      <div className="mt-8 w-full max-w-md bg-zinc-900 p-4 rounded-xl">
        <h2 className="text-lg font-semibold mb-3">🕹 Game History</h2>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {profile.history.map((h, i) => (
            <div
              key={i}
              className="flex justify-between text-sm bg-zinc-800 p-2 rounded-lg"
            >
              <span>{h.gameTitle}</span>
              <span className="text-gray-400">{h.points} pts</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={
          () => shareResult(fid!, 0, profile.totalPoints) // rank optional here
        }
        className="mt-6 bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Share My Journey on Farcaster
      </button>

      <footer className="text-xs text-gray-500 mt-10">
        <p>Waffles © 2025 | Built on Farcaster</p>
      </footer>
    </main>
  );
}
