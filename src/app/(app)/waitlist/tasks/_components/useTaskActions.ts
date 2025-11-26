import {
  useActionState,
  startTransition,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { notify } from "@/components/ui/Toaster";
import { WaitlistTask, WaitlistTaskId, TaskStatus } from "../client";
import { completeWaitlistTask, CompleteTaskState } from "@/actions/waitlist";
import {
  useComposeCast,
  useMiniKit,
  useOpenUrl,
} from "@coinbase/onchainkit/minikit";
import { env } from "@/lib/env";
import { WaitlistData } from "@/app/(app)/(game)/api/waitlist/route";

interface UseTaskActionsProps {
  waitlistData: WaitlistData;
}

export function useTaskActions({ waitlistData }: UseTaskActionsProps) {
  const { context } = useMiniKit();
  const fid = context?.user?.fid;
  const { composeCastAsync } = useComposeCast();
  const openUrl = useOpenUrl();

  // Share function for invite task
  const share = useCallback(async () => {
    const rank = waitlistData.rank ?? null;
    const message = `I'm on the Waffles waitlist! Join me!`;
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

  // Track which tasks have been "started" (clicked GO) -> Pending State
  const [pendingTasks, setPendingTasks] = useLocalStorage<WaitlistTaskId[]>(
    "waffles:tasks:pending",
    []
  );

  // Optimistic state for immediate UI update
  const [optimisticCompleted, setOptimisticCompleted] = useState<string[]>([]);

  const [state, action, pending] = useActionState<CompleteTaskState, FormData>(
    completeWaitlistTask,
    { success: false }
  );

  const handleGo = async (task: WaitlistTask) => {
    // 1. Handle specific actions
    if (task.type === "invite") {
      share();
      return;
    }

    if (task.type === "farcaster_share") {
      try {
        await composeCastAsync({
          text: "I'm joining Waffles! 🧇\n\nJoin the waitlist:",
          embeds: [env.rootUrl + "/waitlist?ref=" + fid],
        });
      } catch (error) {
        console.error("Compose cast failed", error);
      }
    } else if (task.actionUrl) {
      openUrl(task.actionUrl);
    }

    // 2. Set task to pending state (shows COMPLETE button)
    if (!pendingTasks.includes(task.id)) {
      setPendingTasks([...pendingTasks, task.id]);
    }
  };

  const handleComplete = (taskId: string) => {
    if (!fid) {
      notify.error("User not identified");
      return;
    }

    // Optimistically mark as completed
    setOptimisticCompleted((prev) => [...prev, taskId]);

    // Remove from pending since it's now completed (optimistically)
    setPendingTasks((prev) => prev.filter((id) => id !== taskId));

    const formData = new FormData();
    formData.append("fid", fid.toString());
    formData.append("taskId", taskId);

    startTransition(() => {
      action(formData);
    });
  };

  const getTaskStatus = (task: WaitlistTask): TaskStatus => {
    // 1. Completed?
    if (
      waitlistData?.completedTasks.includes(task.id) ||
      optimisticCompleted.includes(task.id)
    ) {
      return "completed";
    }

    // 2. Pending?
    if (task.type === "invite") {
      if (waitlistData.invites >= 3) return "pending";
      return "initial";
    }

    if (pendingTasks.includes(task.id)) {
      return "pending";
    }

    // 3. Initial
    return "initial";
  };

  return {
    handleGo,
    handleComplete,
    getTaskStatus,
    isPending: pending,
  };
}
