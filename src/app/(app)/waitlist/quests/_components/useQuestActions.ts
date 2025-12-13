import {
  useActionState,
  startTransition,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { notify } from "@/components/ui/Toaster";
import { Quest, QuestId, QuestStatus, WaitlistData } from "../client";
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
  const [pendingQuests, setPendingQuests] = useLocalStorage<QuestId[]>(
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
    // 1. Handle specific actions
    if (quest.type === "invite") {
      share();
      return;
    }

    if (quest.type === "view_cast" && quest.castHash) {
      // Use MiniKit's viewCast to open the cast in Farcaster
      viewCast({ hash: quest.castHash, close: false });
    } else if (quest.type === "farcaster_share") {
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
    if (!pendingQuests.includes(quest.id)) {
      setPendingQuests([...pendingQuests, quest.id]);
    }
  };

  const handleComplete = (questId: string) => {
    if (!fid) {
      notify.error("User not identified");
      return;
    }

    // Optimistically mark as completed
    setOptimisticCompleted((prev) => [...prev, questId]);

    // Remove from pending since it's now completed (optimistically)
    setPendingQuests((prev) => prev.filter((id) => id !== questId));

    const formData = new FormData();
    formData.append("fid", fid.toString());
    formData.append("questId", questId);

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
    // 1. Completed?
    if (
      waitlistData?.completedTasks.includes(quest.id) ||
      optimisticCompleted.includes(quest.id)
    ) {
      return "completed";
    }

    // 2. Pending?
    if (quest.type === "invite") {
      if (waitlistData.invitesCount >= 3) return "pending";
      return "initial";
    }

    if (pendingQuests.includes(quest.id)) {
      return "pending";
    }

    // 3. Initial
    return "initial";
  };

  return {
    handleGo,
    handleComplete,
    getQuestStatus,
    isPending: pending,
  };
}
