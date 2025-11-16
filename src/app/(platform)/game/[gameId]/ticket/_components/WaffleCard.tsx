import {
  SetStateAction,
  Dispatch,
  startTransition,
  useActionState,
  useEffect,
} from "react";
import Image from "next/image";
import { purchaseTicketAction } from "@/actions/ticket";
import { useAuth } from "@/hooks/useAuth";
import { notify } from "@/components/ui/Toaster";
import { Ticket } from "@prisma/client";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";

// --- InfoBox Helper Component ---
// A small component for the "Spots" and "Prize pool" boxes
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

// --- Waffle Card Component ---
// This is the main component you requested
export const WaffleCard = ({
  spots,
  prizePool,
  price,
  maxPlayers,
  fid,
  gameId,
  setTicket,
}: {
  spots: number;
  prizePool: number;
  price: number;
  maxPlayers: number;
  fid: number;
  gameId: number;
  setTicket: Dispatch<SetStateAction<Ticket | null>>;
}) => {
  const { signIn } = useAuth();

  const [state, buyWaffleAction, pending] = useActionState(
    purchaseTicketAction,
    null
  );

  useEffect(() => {
    if (state?.status === "success") {
      setTicket(state.ticket ?? null);
    }
  }, [state, setTicket]);
  // --- Handlers ---
  const handlePurchase = async () => {
    try {
      // Authenticate user before purchase (REQUIRED for purchases)
      const token = await signIn();
      if (!token) {
        notify.error("Authentication required to purchase tickets.");
        return;
      }

      notify.info("Processing purchase (test mode, no transaction sent)...");

      let txHash: string | null = null;
      // SKIP sending token transaction for now, just call server action directly.
      // Simulate a txHash for test purposes.
      txHash =
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdfa";

      // Call Server Action to record/confirm purchase
      const formData = new FormData();
      formData.append("fid", String(fid));
      formData.append("gameId", String(gameId));
      formData.append("authToken", token); // Include auth token
      if (txHash) {
        formData.append("txHash", txHash);
      }

      startTransition(() => {
        buyWaffleAction(formData);
      });
    } catch (err) {
      console.error("Ticket purchase failed:", err);
      const message =
        err instanceof Error ? err.message : "An unknown error occurred.";

      // Refine error messages
      let displayError = "Ticket purchase failed. Please try again.";
      if (message.toLowerCase().includes("user rejected")) {
        displayError = "Transaction cancelled.";
      } else if (message.includes("Invite required")) {
        displayError = "Redeem an invite code before buying a ticket.";
      } else if (message.includes("insufficient funds")) {
        displayError = "Insufficient funds for transaction.";
      } else if (
        message.includes("already purchased") ||
        message.includes("already exists")
      ) {
        displayError = "You already have a ticket for this game.";
      } else if (message.includes("Authentication required")) {
        displayError = message;
      } else if (message) {
        displayError = message;
      }

      notify.error(displayError);
    }
  };
  return (
    <div
      className="box-border flex flex-col justify-center items-center gap-6 p-5 px-3 border border-white/10 rounded-2xl"
      // These dimensions match your CSS specs
      style={{ width: "361px", height: "207px" }}
    >
      {/* Top section with Spots and Prize pool (in a new row wrapper) */}
      <div className="flex flex-row justify-center items-center gap-6">
        <InfoBox
          iconUrl="/images/illustrations/seats.svg"
          label="Spots"
          value={`${spots}/${maxPlayers}`}
        />
        <InfoBox
          iconUrl="/images/illustrations/money-stack.svg"
          label="Prize pool"
          value={`$${prizePool}`}
        />
      </div>

      {/* Button */}
      <div className="w-full" style={{ width: "337px" }}>
        <FancyBorderButton
          fullWidth
          disabled={pending}
          onClick={handlePurchase}
        >
          {pending ? "BUYING..." : `BUY WAFFLE $${price}`}
        </FancyBorderButton>
      </div>
    </div>
  );
};
