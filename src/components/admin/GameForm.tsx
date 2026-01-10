"use client";

import { GameActionResult } from "@/actions/admin/games";
import Link from "next/link";
import {
  CalendarIcon,
  CurrencyDollarIcon,
  PuzzlePieceIcon,
  PhotoIcon,
  SparklesIcon,
  ClockIcon,
  UserGroupIcon,
  CheckIcon,
  ExclamationCircleIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import {
  useActionState,
  useState,
  useRef,
  useMemo,
  useTransition,
} from "react";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { ConfirmationModal } from "@/components/admin/ConfirmationModal";
import { THEMES } from "@/lib/constants";

interface GameFormProps {
  action: (
    prevState: GameActionResult | null,
    formData: FormData
  ) => Promise<GameActionResult>;
  initialData?: {
    title: string;
    description?: string | null;
    theme: string;
    coverUrl?: string | null;
    startsAt: Date;
    endsAt: Date;
    tierPrices: number[];
    prizePool: number;
    roundBreakSec: number;
    maxPlayers: number;
  };
  isEdit?: boolean;
}

export function GameForm({
  action,
  initialData,
  isEdit = false,
}: GameFormProps) {
  const [state, formAction] = useActionState<GameActionResult | null, FormData>(
    action,
    null
  );

  // Form state
  const [selectedTheme, setSelectedTheme] = useState(initialData?.theme || "");
  const [coverUrl, setCoverUrl] = useState(initialData?.coverUrl || "");
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [tierPrice1, setTierPrice1] = useState(
    initialData?.tierPrices?.[0]?.toString() || "5"
  );
  const [tierPrice2, setTierPrice2] = useState(
    initialData?.tierPrices?.[1]?.toString() || "25"
  );
  const [tierPrice3, setTierPrice3] = useState(
    initialData?.tierPrices?.[2]?.toString() || "50"
  );
  const [prizePool, setPrizePool] = useState(
    initialData?.prizePool?.toString() || ""
  );
  const [roundDuration, setRoundDuration] = useState(
    initialData?.roundBreakSec?.toString() || "15"
  );
  const [maxPlayers, setMaxPlayers] = useState(
    initialData?.maxPlayers?.toString() || "100"
  );
  const [startsAt, setStartsAt] = useState(
    initialData?.startsAt
      ? new Date(initialData.startsAt).toISOString().slice(0, 16)
      : ""
  );
  // Calculate initial duration if editing
  const initialDuration = initialData?.startsAt && initialData?.endsAt
    ? Math.round((new Date(initialData.endsAt).getTime() - new Date(initialData.startsAt).getTime()) / 60000)
    : 30;
  const [durationMinutes, setDurationMinutes] = useState(initialDuration.toString());

  // UI state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  const currentTheme = useMemo(
    () => THEMES.find((t) => t.id === selectedTheme),
    [selectedTheme]
  );

  // Calculate end time from start + duration
  const calculatedEndsAt = useMemo(() => {
    if (!startsAt || !durationMinutes) return "";
    const start = new Date(startsAt);
    const end = new Date(start.getTime() + parseInt(durationMinutes) * 60000);
    return end.toISOString().slice(0, 16);
  }, [startsAt, durationMinutes]);

  // Display duration text
  const durationDisplay = useMemo(() => {
    const mins = parseInt(durationMinutes);
    if (!mins) return null;
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  }, [durationMinutes]);

  // Form submission handler
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    if (!selectedTheme) {
      setValidationError("Please select a theme");
      return;
    }
    if (!title.trim()) {
      setValidationError("Please enter a game title");
      return;
    }
    if (!coverUrl) {
      setValidationError("Please add a cover image");
      return;
    }
    if (!startsAt) {
      setValidationError("Please set a start time");
      return;
    }
    if (!durationMinutes) {
      setValidationError("Please select a duration");
      return;
    }

    setValidationError(null);
    const formData = new FormData(e.currentTarget);

    // For edit mode, submit directly
    if (isEdit) {
      startTransition(async () => {
        try {
          const result = await action(null, formData);
          if (result?.success) {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
          }
        } catch (err) {
          console.error("Update failed:", err);
        }
      });
      return;
    }

    // For create mode, show confirmation
    setPendingFormData(formData);
    setShowConfirmation(true);
  };

  // Confirm game creation
  const handleConfirmCreate = () => {
    if (!pendingFormData) return;

    startTransition(async () => {
      try {
        await formAction(pendingFormData);
      } finally {
        setShowConfirmation(false);
        setPendingFormData(null);
      }
    });
  };

  // Get preview items for confirmation
  const getPreviewItems = () => {
    if (!pendingFormData) return [];
    const themeData = THEMES.find((t) => t.id === pendingFormData.get("theme"));
    return [
      { label: "Title", value: pendingFormData.get("title")?.toString() || "Untitled" },
      { label: "Theme", value: themeData ? `${themeData.icon} ${themeData.label}` : "—" },
      { label: "Starts", value: startsAt ? new Date(startsAt).toLocaleString() : "—" },
      { label: "Prize Pool", value: `$${pendingFormData.get("prizePool")} USDC` },
    ];
  };

  return (
    <>
      <form
        ref={formRef}
        action={formAction}
        onSubmit={handleFormSubmit}
        className="max-w-3xl mx-auto space-y-8 font-display"
      >
        {/* Error Display */}
        {((state && !state.success && "error" in state) || validationError) && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
            <ExclamationCircleIcon className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">
              {validationError || (state && "error" in state ? state.error : "")}
            </p>
          </div>
        )}

        {/* Success Display */}
        {showSuccess && (
          <div className="p-4 bg-[#14B985]/10 border border-[#14B985]/30 rounded-xl flex items-center gap-3 text-[#14B985]">
            <CheckIcon className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">Game updated successfully!</p>
          </div>
        )}

        {/* 1. Theme Selection */}
        <section className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl bg-[#FFC931]/15">
              <SparklesIcon className="h-5 w-5 text-[#FFC931]" />
            </div>
            <div>
              <h3 className="font-bold text-white">Choose Theme</h3>
              <p className="text-sm text-white/50">What&apos;s this game about?</p>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => {
                  setSelectedTheme(theme.id);
                  setValidationError(null);
                }}
                className={`relative group p-4 rounded-xl border-2 transition-all text-center ${selectedTheme === theme.id
                  ? "border-[#FFC931] bg-[#FFC931]/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                  }`}
              >
                {selectedTheme === theme.id && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#FFC931] flex items-center justify-center">
                    <CheckIcon className="h-3 w-3 text-black" />
                  </div>
                )}
                <div className="text-2xl mb-1">{theme.icon}</div>
                <div className="text-xs font-medium text-white">{theme.label}</div>
              </button>
            ))}
          </div>
          <input type="hidden" name="theme" value={selectedTheme} />
        </section>

        {/* 2. Basic Info */}
        <section className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl bg-[#00CFF2]/15">
              <PuzzlePieceIcon className="h-5 w-5 text-[#00CFF2]" />
            </div>
            <div>
              <h3 className="font-bold text-white">Basic Info</h3>
              <p className="text-sm text-white/50">Name and description</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-white/70 mb-2">
                Game Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
                placeholder="Friday Night Football Trivia"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-white/70 mb-2">
                Description <span className="text-white/30">(optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all resize-none"
                placeholder="Brief description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Cover Image <span className="text-red-400">*</span>
              </label>
              <MediaPicker
                label=""
                name="coverUrl"
                accept="image"
                onSelect={setCoverUrl}
                selectedUrl={coverUrl}
              />
            </div>
          </div>
        </section>

        {/* 3. Schedule */}
        <section className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl bg-[#14B985]/15">
              <CalendarIcon className="h-5 w-5 text-[#14B985]" />
            </div>
            <div>
              <h3 className="font-bold text-white">Schedule</h3>
              <p className="text-sm text-white/50">When does the game start?</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startsAt" className="block text-sm font-medium text-white/70 mb-2">
                Start Time <span className="text-red-400">*</span>
              </label>
              <input
                type="datetime-local"
                id="startsAt"
                name="startsAt"
                required
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all scheme-dark"
              />
            </div>
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-white/70 mb-2">
                Duration <span className="text-red-400">*</span>
              </label>
              <select
                id="duration"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
              >
                <option value="15" className="bg-[#0a0a0b]">15 minutes</option>
                <option value="30" className="bg-[#0a0a0b]">30 minutes</option>
                <option value="45" className="bg-[#0a0a0b]">45 minutes</option>
                <option value="60" className="bg-[#0a0a0b]">1 hour</option>
                <option value="90" className="bg-[#0a0a0b]">1.5 hours</option>
                <option value="120" className="bg-[#0a0a0b]">2 hours</option>
                <option value="180" className="bg-[#0a0a0b]">3 hours</option>
                <option value="240" className="bg-[#0a0a0b]">4 hours</option>
                <option value="360" className="bg-[#0a0a0b]">6 hours</option>
                <option value="720" className="bg-[#0a0a0b]">12 hours</option>
                <option value="1440" className="bg-[#0a0a0b]">24 hours</option>
              </select>
            </div>
          </div>

          {/* Show calculated end time */}
          {startsAt && durationMinutes && (
            <div className="mt-4 p-3 bg-[#14B985]/10 rounded-lg border border-[#14B985]/20">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Game ends at:</span>
                <span className="font-medium text-[#14B985]">
                  {new Date(calculatedEndsAt).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Hidden input for endsAt */}
          <input type="hidden" name="endsAt" value={calculatedEndsAt} />
        </section>

        {/* 4. Pricing & Gameplay - Combined */}
        <section className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl bg-[#FFC931]/15">
              <CurrencyDollarIcon className="h-5 w-5 text-[#FFC931]" />
            </div>
            <div>
              <h3 className="font-bold text-white">Pricing & Settings</h3>
              <p className="text-sm text-white/50">Ticket tiers, prize pool, and limits</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Tier 1 */}
            <div>
              <label htmlFor="tierPrice1" className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-linear-to-br from-orange-600 to-orange-800"></span>
                Bronze
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">$</span>
                <input
                  type="number"
                  id="tierPrice1"
                  name="tierPrice1"
                  required
                  value={tierPrice1}
                  onChange={(e) => setTierPrice1(e.target.value)}
                  min={0}
                  step="0.01"
                  className="w-full pl-7 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
                />
              </div>
            </div>

            {/* Tier 2 */}
            <div>
              <label htmlFor="tierPrice2" className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-linear-to-br from-gray-300 to-gray-500"></span>
                Silver
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">$</span>
                <input
                  type="number"
                  id="tierPrice2"
                  name="tierPrice2"
                  required
                  value={tierPrice2}
                  onChange={(e) => setTierPrice2(e.target.value)}
                  min={0}
                  step="0.01"
                  className="w-full pl-7 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
                />
              </div>
            </div>

            {/* Tier 3 */}
            <div>
              <label htmlFor="tierPrice3" className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-linear-to-br from-yellow-400 to-yellow-600"></span>
                Gold
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">$</span>
                <input
                  type="number"
                  id="tierPrice3"
                  name="tierPrice3"
                  required
                  value={tierPrice3}
                  onChange={(e) => setTierPrice3(e.target.value)}
                  min={0}
                  step="0.01"
                  className="w-full pl-7 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
                />
              </div>
            </div>

            {/* Prize Pool */}
            <div>
              <label htmlFor="prizePool" className="block text-sm font-medium text-white/70 mb-2">
                Prize Pool
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#14B985]">$</span>
                <input
                  type="number"
                  id="prizePool"
                  name="prizePool"
                  required
                  value={prizePool}
                  onChange={(e) => setPrizePool(e.target.value)}
                  min={0}
                  className="w-full pl-7 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Gameplay Settings */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div>
              <label htmlFor="roundBreakSec" className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
                <ClockIcon className="h-4 w-4 text-white/40" />
                Round Break <span className="text-white/40">(sec)</span>
              </label>
              <input
                type="number"
                id="roundBreakSec"
                name="roundBreakSec"
                required
                value={roundDuration}
                onChange={(e) => setRoundDuration(e.target.value)}
                min={5}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
              />
            </div>

            <div>
              <label htmlFor="maxPlayers" className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
                <UserGroupIcon className="h-4 w-4 text-white/40" />
                Max Players
              </label>
              <input
                type="number"
                id="maxPlayers"
                name="maxPlayers"
                required
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(e.target.value)}
                min={2}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
              />
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4">
          <Link
            href="/admin/games"
            className="px-6 py-3 text-white/60 font-medium hover:text-white transition-colors"
          >
            ← Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#FFC931] hover:bg-[#FFD966] text-black font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[#FFC931] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isPending ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {isEdit ? "Saving..." : "Creating..."}
              </>
            ) : (
              <>
                {isEdit ? "Save Changes" : "Create Game"}
                <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => {
          if (!isPending) {
            setShowConfirmation(false);
            setPendingFormData(null);
          }
        }}
        onConfirm={handleConfirmCreate}
        title="Create New Game?"
        description="This will create a new trivia game. Players can join once it goes live."
        confirmText="Create Game"
        cancelText="Go Back"
        variant="warning"
        isLoading={isPending}
        previewItems={getPreviewItems()}
      />
    </>
  );
}
