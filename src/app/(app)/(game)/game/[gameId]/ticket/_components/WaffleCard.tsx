import {
  startTransition,
  useActionState,
  useEffect,
  useState,
} from "react";
import Image from "next/image";
import { buyWaffleAction } from "@/actions/ticket";
import { notify } from "@/components/ui/Toaster";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { env } from "@/lib/env";
import { USDC_TRANSFER_ABI } from "@/lib/constants";

const InfoBox = ({
  iconUrl,
  label,
  value,
}: {
  iconUrl: string;
  label: string;
  value: string;
}) => (
  <div
    className="flex flex-col justify-center items-center gap-1"
    style={{ width: "156px", height: "89px" }}
  >
    {/* Icon */}
    <Image
      src={iconUrl}
      width={40}
      height={40}
      alt={label}
      className="h-[40px]"
      // Fallback in case the image is missing
      onError={(e) => {
        e.currentTarget.style.display = "none";
        const placeholder = document.createElement("div");
        placeholder.className =
          "h-[40px] w-[55px] bg-gray-700 rounded flex items-center justify-center text-xs text-gray-400";
        placeholder.innerText = "img";
        e.currentTarget.parentNode?.insertBefore(placeholder, e.currentTarget);
      }}
    />
    {/* Text Lines */}
    <div className="flex flex-col justify-center items-center">
      <span className="font-display text-[16px] font-medium leading-[130%] tracking-[-0.03em] text-[#99A0AE]">
        {label}
      </span>
      <span className="font-body text-[24px] font-normal leading-[100%] text-white">
        {value}
      </span>
    </div>
  </div>
);

export const WaffleCard = ({
  spots,
  prizePool,
  price,
  maxPlayers,
  fid,
  gameId,
}: {
  spots: number;
  prizePool: number;
  price: number;
  maxPlayers: number;
  fid: number;
  gameId: number;
}) => {
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);

  const [state, submitWaffleAction, pending] = useActionState(
    buyWaffleAction,
    null
  );

  // Basic wagmi hooks for direct transaction
  const { writeContract, isPending: isWritePending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Watch for transaction confirmation
  useEffect(() => {
    if (isConfirmed && txHash) {
      const formData = new FormData();
      formData.append("fid", String(fid));
      formData.append("gameId", String(gameId));
      formData.append("txHash", txHash);

      startTransition(() => {
        submitWaffleAction(formData);
      });
    }
  }, [isConfirmed, txHash, fid, gameId, submitWaffleAction]);

  const handlePurchase = () => {
    try {
      notify.info("Initiating transaction...");
      writeContract(
        {
          address: env.nextPublicUsdcAddress as `0x${string}`,
          abi: USDC_TRANSFER_ABI,
          functionName: "transfer",
          args: [
            env.nextPublicTreasuryWallet as `0x${string}`,
            parseUnits(price.toString(), 6),
          ],
        },
        {
          onSuccess: (hash) => {
            setTxHash(hash);
            notify.info("Transaction submitted. Waiting for confirmation...");
          },
          onError: (error) => {
            console.error("Transaction failed:", error);
            notify.error("Transaction failed. Please try again.");
          },
        }
      );
    } catch (err) {
      console.error("Failed to initiate purchase:", err);
      notify.error("An unexpected error occurred.");
    }
  };

  const isProcessing = isWritePending || isConfirming || pending;

  return (
    <div
      className="box-border flex flex-col justify-center items-center gap-6 p-5 px-3 border border-white/10 rounded-2xl w-full max-w-lg h-auto min-h-[207px]"
    >
      {/* Top section with Spots and Prize pool (in a new row wrapper) */}
      <div className="flex flex-row justify-center items-center gap-4 sm:gap-6 w-full">
        <div className="flex-1 flex justify-center">
          <InfoBox
            iconUrl="/images/illustrations/seats.svg"
            label="Spots"
            value={`${spots}/${maxPlayers}`}
          />
        </div>
        <div className="flex-1 flex justify-center">
          <InfoBox
            iconUrl="/images/illustrations/money-stack.svg"
            label="Prize pool"
            value={`$${prizePool}`}
          />
        </div>
      </div>

      {/* Button */}
      <div className="w-full max-w-lg">
        <FancyBorderButton
          disabled={isProcessing}
          onClick={handlePurchase}
        >
          {isProcessing
            ? "PROCESSING..."
            : `BUY WAFFLE $${price}`}
        </FancyBorderButton>
      </div>
    </div>
  );
};
