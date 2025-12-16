import {
  useActionState,
  startTransition,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { notify } from "@/components/ui/Toaster";
import { Quest, QuestStatus, WaitlistData } from "../client";
import { completeWaitlistQuest, CompleteQuestState } from "@/actions/waitlist";
import {
  useComposeCast,
  useMiniKit,
  useOpenUrl,
  useViewCast,
} from "@coinbase/onchainkit/minikit";
import { env } from "@/lib/env";

interface UseQuestActionsProps {
  waitlistData: WaitlistData;
}

export function useQuestActions({ waitlistData }: UseQuestActionsProps) {
  const { context } = useMiniKit();
  const fid = context?.user?.fid;
  const { composeCastAsync } = useComposeCast();
  const openUrl = useOpenUrl();
  const { viewCast } = useViewCast();

  // Share function for invite quest
  const share = useCallback(async () => {
    const rank = waitlistData.rank ?? null;
    const message = `just got in to waffles
if you need me i'd be knead deep in trivia

think you can beat me? you're on😏`;
    try {
      const result = await composeCastAsync({
        text: message,
        embeds: [`${env.rootUrl}/waitlist?ref=${fid}&rank=${rank}`],
      });
      if (result?.cast) notify.success("Shared successfully!");
      else notify.info("Share cancelled.");
    } catch {
      notify.error("Failed to share waitlist.");
    }
  }, [composeCastAsync, fid, waitlistData.rank]);

  // Track which quests have been "started" (clicked GO) -> Pending State
  const [pendingQuests, setPendingQuests] = useLocalStorage<string[]>(
    "waffles:quests:pending",
    []
  );

  // Optimistic state for immediate UI update
  const [optimisticCompleted, setOptimisticCompleted] = useState<string[]>([]);

  const [state, action, pending] = useActionState<CompleteQuestState, FormData>(
    completeWaitlistQuest,
    { success: false }
  );

  const handleGo = async (quest: Quest) => {
    // 1. Handle specific actions based on quest type
    if (quest.type === "REFERRAL") {
      share();
      return;
    }

    if (quest.type === "FARCASTER_RECAST" && quest.castHash) {
      // Use MiniKit's viewCast to open the cast in Farcaster
      viewCast({ hash: quest.castHash, close: false });
    } else if (quest.type === "FARCASTER_CAST") {
      try {
        await composeCastAsync({
          text: `just got in to waffles
if you need me i'd be knead deep in trivia

think you can beat me? you're on😏`,
          embeds: [env.rootUrl + "/waitlist?ref=" + fid],
        });
      } catch (error) {
        console.error("Compose cast failed", error);
      }
    } else if (quest.actionUrl) {
      openUrl(quest.actionUrl);
    }

    // 2. Set quest to pending state (shows COMPLETE button)
    if (!pendingQuests.includes(quest.slug)) {
      setPendingQuests([...pendingQuests, quest.slug]);
    }
  };

  const handleComplete = (questSlug: string) => {
    if (!fid) {
      notify.error("User not identified");
      return;
    }

    // Optimistically mark as completed
    setOptimisticCompleted((prev) => [...prev, questSlug]);

    // Remove from pending since it's now completed (optimistically)
    setPendingQuests((prev) => prev.filter((slug) => slug !== questSlug));

    const formData = new FormData();
    formData.append("fid", fid.toString());
    formData.append("questId", questSlug); // Using slug as questId

    startTransition(() => {
      action(formData);
    });
  };

  // Handle verification errors and revert optimistic updates
  useEffect(() => {
    if (state.error) {
      // Show user-friendly error message
      notify.error(state.error);
      // Note: We can't easily identify which quest failed here,
      // so we revert all optimistic updates
      setOptimisticCompleted([]);
    } else if (state.success && state.message) {
      notify.success(state.message);
    }
  }, [state]);

  const getQuestStatus = (quest: Quest): QuestStatus => {
    // 1. Already completed from API?
    if (quest.isCompleted) {
      return "completed";
    }

    // 2. Optimistically completed?
    if (
      waitlistData?.completedQuests.includes(quest.slug) ||
      optimisticCompleted.includes(quest.slug)
    ) {
      return "completed";
    }

    // 3. Pending approval (CUSTOM quests)?
    if (quest.isPending) {
      return "pending";
    }

    // 4. Pending (user clicked GO)?
    if (quest.type === "REFERRAL") {
      if (waitlistData.invitesCount >= quest.requiredCount) return "pending";
      return "initial";
    }

    if (pendingQuests.includes(quest.slug)) {
      return "pending";
    }

    // 5. Initial
    return "initial";
  };

  return {
    handleGo,
    handleComplete,
    getQuestStatus,
    isPending: pending,
  };
}
