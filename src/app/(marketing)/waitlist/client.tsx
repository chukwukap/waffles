"use client";
import { useComposeCast } from "@coinbase/onchainkit/minikit";
import { notify } from "@/components/ui/Toaster";
import {
  useCallback,
  startTransition,
  useEffect,
  useActionState,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { joinWaitlistAction, type JoinWaitlistState } from "@/actions/waitlist";
import { useAddFrame, useMiniKit } from "@coinbase/onchainkit/minikit";
import { env } from "@/lib/env";
import { WaitlistJoinView } from "./_components/WaitlistJoinView";
import { WaitlistStatusView } from "./_components/WaitlistStatusView";

export interface WaitlistData {
  onList: boolean;
  rank: number | null;
  invites: number;
}

export function WaitlistClient() {
  const { context, isMiniAppReady, setMiniAppReady } = useMiniKit();
  const searchParams = useSearchParams();
  const fid = context?.user?.fid;
  const ref = searchParams.get("ref") || null; // referrer fid
  const addFrame = useAddFrame();
  const router = useRouter();
  const [state, action, pending] = useActionState<JoinWaitlistState, FormData>(
    joinWaitlistAction,
    { ok: false }
  );
  const [waitlistData, setWaitlistData] = useState<WaitlistData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutualsData, setMutualsData] = useState<{
    mutuals: Array<{ fid: number; pfpUrl: string | null }>;
    mutualCount: number;
    totalCount: number;
  } | null>(null);


  // Fetch waitlist data helper
  const fetchWaitlistData = useCallback(async () => {
    if (!fid) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/waitlist?fid=${fid}`);

      if (!response.ok) {
        throw new Error("Failed to fetch waitlist data");
      }

      const data: WaitlistData = await response.json();
      setWaitlistData(data);
    } catch (err) {
      console.error("Error fetching waitlist data:", err);
      setError("Failed to load waitlist data");
      setWaitlistData({
        onList: false,
        rank: null,
        invites: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [fid]);

  // Fetch waitlist data on mount
  useEffect(() => {
    fetchWaitlistData();
  }, [fetchWaitlistData]);

  // Fetch mutuals data
  useEffect(() => {
    if (!fid) return;

    const fetchMutuals = async () => {
      try {
        const res = await fetch(`/api/mutuals?fid=${fid}&context=waitlist`);
        if (res.ok) {
          const data = await res.json();
          setMutualsData(data);
        }
      } catch (err) {
        console.error("Error fetching mutuals:", err);
      }
    };

    fetchMutuals();
  }, [fid]);

  // Refresh waitlist data after successful join
  useEffect(() => {
    if (state.ok && !state.already && !pending && fid) {
      fetchWaitlistData();
    }
  }, [state.ok, state.already, pending, fid, fetchWaitlistData]);

  const { onList, rank } = waitlistData || {
    onList: false,
    rank: null,
    invites: 0,
  };

  const handleAddFrame = useCallback(async () => {
    if (!context?.user?.fid) return;
    try {
      await addFrame();
    } catch (error) {
      console.error("Error adding frame:", error);
    }
  }, [addFrame, context?.user?.fid]);

  const { composeCastAsync } = useComposeCast();
  const share = useCallback(async () => {
    const message = `I'm on the Waffles waitlist! Join me!`;
    try {
      const result = await composeCastAsync({
        text: message,
        embeds: [
          `${env.rootUrl}/waitlist?ref=${fid}&rank=${rank}`,
        ],
      });
      if (result?.cast) notify.success("Shared successfully!");
      else notify.info("Share cancelled.");
    } catch {
      notify.error("Failed to share waitlist.");
    }
  }, [composeCastAsync, fid, rank]);

  const handleSubmit = useCallback(
    (formData: FormData) => {
      if (!fid) return;
      startTransition(() => {
        action(formData);
      });
    },
    [action, fid]
  );

  useEffect(() => {
    if (!isMiniAppReady) {
      setMiniAppReady();
    }
  }, [isMiniAppReady, setMiniAppReady]);

  useEffect(() => {
    if (state.ok && !state.already && !pending) {
      if (context?.client.added === false) handleAddFrame();
    }
  }, [
    state.ok,
    state.already,
    pending,
    context?.client.added,
    handleAddFrame,
    router,
  ]);

  const headingClasses =
    "font-body font-normal not-italic text-[44px] leading-[92%] tracking-[-0.03em] text-center text-white";
  const errorClasses = "text-red-400 text-sm";

  // ───────────────────────── RENDER LOGIC ─────────────────────────

  // 1. Loading
  if (isLoading) {
    return (
      <section className="flex-1 flex items-center justify-center">
        <h1 className={headingClasses}>LOADING...</h1>
      </section>
    );
  }

  // 2. Error
  if (error) {
    return (
      <section className="flex-1 flex flex-col items-center justify-center gap-4">
        <h1 className={headingClasses}>ERROR</h1>
        <p className={errorClasses}>{error}</p>
      </section>
    );
  }


  // 4. Main View: ON LIST
  if (onList) {
    return (
      <WaitlistStatusView
        rank={rank}
        share={share}
        mutualsData={mutualsData}
        pending={pending}
      />
    );
  }

  // 5. Default View: NOT ON LIST (Join Form)
  return (
    <WaitlistJoinView
      state={state}
      pending={pending}
      handleSubmit={handleSubmit}
      fid={fid}
      refParam={ref}
      mutualsData={mutualsData}
    />
  );
}