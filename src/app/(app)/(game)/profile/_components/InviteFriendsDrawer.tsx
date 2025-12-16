import { cn } from "@/lib/utils";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { CopyIcon } from "@/components/icons";
import { Check } from "lucide-react";

// ============================================
// INVITE DRAWER - Currently showing "Coming Soon"
// To enable invite link sharing, uncomment the InviteDrawerActive
// component and use it instead of InviteDrawerComingSoon
// ============================================

interface InviteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  inviteLink: string;
}

// ============================================
// COMING SOON VERSION (Currently Active)
// ============================================
const InviteDrawerComingSoon = ({ isOpen, onClose }: Omit<InviteDrawerProps, "inviteLink">) => {
  // Handle Escape key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      {/* BACKDROP */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-out",
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* DRAWER PANEL */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center justify-end pointer-events-none">
        <div
          className={cn(
            "relative w-full max-w-lg mx-auto bg-white shadow-2xl overflow-hidden",
            "transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1)",
            "border-t-2 border-white/20",
            isOpen
              ? "translate-y-0 pointer-events-auto"
              : "translate-y-full pointer-events-none"
          )}
          style={{
            height: "400px",
            borderTopLeftRadius: "20px",
            borderTopRightRadius: "20px",
          }}
        >
          {/* Background Image */}
          <div className="absolute inset-0 z-0 select-none">
            <Image
              src="/images/share/invite-bg.png"
              alt="Invite Background"
              fill
              className="object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]" />
          </div>

          {/* Drag Handle */}
          <div
            onClick={onClose}
            className="absolute z-20 bg-black/20 rounded-full left-1/2 -translate-x-1/2 cursor-pointer hover:bg-black/30 transition-colors"
            style={{ top: "12px", width: "36px", height: "5px", opacity: 0.4 }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center">
            {/* Chain Icon */}
            <div
              className="relative mb-6 select-none"
              style={{ width: "86.5px", height: "75px" }}
            >
              <Image
                src="/images/illustrations/link-icon.png"
                alt="Link Icon"
                fill
                className="object-contain opacity-50"
              />
            </div>

            {/* Title */}
            <h2
              className="font-body text-[#110047] uppercase mb-4 select-none"
              style={{
                fontSize: "30px",
                lineHeight: "115%",
                maxWidth: "300px",
              }}
            >
              INVITE FRIENDS
            </h2>

            {/* Coming Soon Badge */}
            <div className="bg-[#110047]/10 border border-[#110047]/20 rounded-full px-6 py-2 mb-4">
              <span className="font-display font-semibold text-[18px] text-[#110047] uppercase tracking-wide">
                Coming Soon
              </span>
            </div>

            {/* Description */}
            <p className="font-display font-medium text-[16px] leading-[1.3] text-[#110047]/70 max-w-[280px]">
              Soon you&apos;ll be able to invite friends and earn bonus points!
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

// ============================================
// ORIGINAL VERSION WITH INVITE LINK (Commented Out)
// Uncomment this and use it when ready to enable sharing
// ============================================
/*
const InviteDrawerActive = ({ isOpen, onClose, inviteLink }: InviteDrawerProps) => {
  const [copied, setCopied] = useState(false);

  // Handle Escape key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleCopy = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-out",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center justify-end pointer-events-none">
        <div
          className={cn(
            "relative w-full max-w-lg mx-auto bg-white shadow-2xl overflow-hidden",
            "transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1)",
            "border-t-2 border-white/20",
            isOpen ? "translate-y-0 pointer-events-auto" : "translate-y-full pointer-events-none"
          )}
          style={{
            height: '518px',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
          }}
        >
          <div className="absolute inset-0 z-0 select-none">
            <Image
              src="/images/share/invite-bg.png"
              alt="Invite Background"
              fill
              className="object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]"></div>
          </div>

          <div
            onClick={onClose}
            className="absolute z-20 bg-black/20 rounded-full left-1/2 -translate-x-1/2 cursor-pointer hover:bg-black/30 transition-colors"
            style={{ top: '12px', width: '36px', height: '5px', opacity: 0.4 }}
          />

          <div className="relative z-10 flex flex-col items-center justify-start h-full pt-12 px-6 text-center">
            <div className="relative transition-transform hover:scale-105 duration-300 select-none" style={{ width: '86.5px', height: '75px' }}>
              <Image src="/images/illustrations/link-icon.png" alt="Link Icon" fill className="object-contain" />
            </div>

            <h2
              className="font-body text-[#110047] uppercase mb-8 select-none"
              style={{ fontSize: '30px', lineHeight: '115%', letterSpacing: '0%', maxWidth: '300px' }}
            >
              INVITE FRIENDS TO WAFFLES!
            </h2>

            <div className="relative overflow-hidden w-[30px] h-[30px] rounded-full opacity-100 mb-6 transition-transform hover:scale-105 duration-300 select-none">
              <Image src="/images/icons/farcaster.png" alt="Farcaster Icon" fill className="object-contain" />
            </div>

            <p className="font-display font-medium text-[18px] leading-[1.12] tracking-[-0.03em] text-center text-[#110047] mb-6">
              Add your invite link to your Farcaster bio to earn daily bonus points!
            </p>

            <FancyBorderButton onClick={handleCopy} className="w-full max-w-[340px] h-[52px] px-4 mb-6">
              <span className="font-display font-medium text-[15px] leading-[1.15] tracking-[-0.02em] lowercase text-[#110047] truncate select-none text-center">
                {inviteLink}
              </span>
              <div className="text-[#110047] ml-1">
                {copied ? <Check size={20} className="text-green-500 animate-bounce" /> : <CopyIcon className="opacity-60 group-hover:opacity-100 transition-opacity" />}
              </div>
            </FancyBorderButton>

            <button onClick={handleCopy} className="w-full">
              {copied ? (
                <span className="flex items-center justify-center gap-2 font-body font-normal text-[18px] leading-[1.15] tracking-[-0.02em] text-[#110047]">
                  <Check strokeWidth={3} /> COPIED!
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2 font-body font-normal text-[18px] leading-[1.15] tracking-[-0.02em] text-[#110047]">
                  <CopyIcon strokeWidth={3} fill="#110047" /> COPY LINK
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
*/

// ============================================
// EXPORT - Switch between versions here
// ============================================
// To enable invite link sharing, change this to: export { InviteDrawerActive as InviteDrawer }
export { InviteDrawerComingSoon as InviteDrawer };

// Suppress unused import warnings for commented code
void useState;
void FancyBorderButton;
void CopyIcon;
void Check;