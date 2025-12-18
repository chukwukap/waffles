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
  TrophyIcon,
  BoltIcon,
  CheckIcon,
  ExclamationCircleIcon,
  ArrowRightIcon,
  InformationCircleIcon,
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

// Theme configurations with enhanced styling
const THEMES = [
  {
    id: "FOOTBALL",
    label: "Football",
    icon: "⚽",
    color: "from-green-500 to-emerald-700",
    bgColor: "bg-green-500",
    glowColor: "shadow-green-500/30",
    description: "Sports trivia",
  },
  {
    id: "MOVIES",
    label: "Movies",
    icon: "🎬",
    color: "from-red-500 to-rose-700",
    bgColor: "bg-red-500",
    glowColor: "shadow-red-500/30",
    description: "Cinema & films",
  },
  {
    id: "ANIME",
    label: "Anime",
    icon: "🎌",
    color: "from-pink-500 to-fuchsia-700",
    bgColor: "bg-pink-500",
    glowColor: "shadow-pink-500/30",
    description: "Japanese animation",
  },
  {
    id: "POLITICS",
    label: "Politics",
    icon: "🏛️",
    color: "from-blue-500 to-indigo-700",
    bgColor: "bg-blue-600",
    glowColor: "shadow-blue-500/30",
    description: "World affairs",
  },
  {
    id: "CRYPTO",
    label: "Crypto",
    icon: "₿",
    color: "from-orange-500 to-amber-600",
    bgColor: "bg-orange-500",
    glowColor: "shadow-orange-500/30",
    description: "Web3 & blockchain",
  },
];

// Preset configurations for quick setup
const PRESETS = [
  {
    id: "quick",
    label: "Quick Game",
    icon: BoltIcon,
    description: "5 min rounds, 50 players",
    values: {
      roundBreakSec: 15,
      maxPlayers: 50,
      entryFee: 1,
      prizePool: 40,
    },
  },
  {
    id: "standard",
    label: "Standard",
    icon: TrophyIcon,
    description: "10 min rounds, 200 players",
    values: {
      roundBreakSec: 20,
      maxPlayers: 200,
      entryFee: 5,
      prizePool: 800,
    },
  },
  {
    id: "premium",
    label: "Premium",
    icon: SparklesIcon,
    description: "15 min rounds, 500 players",
    values: {
      roundBreakSec: 30,
      maxPlayers: 500,
      entryFee: 25,
      prizePool: 10000,
    },
  },
];

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
    initialData?.tierPrices?.[0]?.toString() || "20"
  );
  const [tierPrice2, setTierPrice2] = useState(
    initialData?.tierPrices?.[1]?.toString() || "50"
  );
  const [tierPrice3, setTierPrice3] = useState(
    initialData?.tierPrices?.[2]?.toString() || "100"
  );
  const [prizePool, setPrizePool] = useState(
    initialData?.prizePool?.toString() || ""
  );
  const [roundDuration, setRoundDuration] = useState(
    initialData?.roundBreakSec?.toString() || ""
  );
  const [maxPlayers, setMaxPlayers] = useState(
    initialData?.maxPlayers?.toString() || ""
  );
  const [startsAt, setStartsAt] = useState(
    initialData?.startsAt
      ? new Date(initialData.startsAt).toISOString().slice(0, 16)
      : ""
  );
  const [endsAt, setEndsAt] = useState(
    initialData?.endsAt
      ? new Date(initialData.endsAt).toISOString().slice(0, 16)
      : ""
  );

  // UI state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Use transition for form submission to avoid React warning
  const [isPending, startTransition] = useTransition();

  const currentTheme = useMemo(
    () => THEMES.find((t) => t.id === selectedTheme),
    [selectedTheme]
  );

  // Calculate estimated revenue using highest tier
  const estimatedRevenue = useMemo(() => {
    const fee = parseFloat(tierPrice3) || 0;
    const players = parseInt(maxPlayers) || 0;
    return fee * players;
  }, [tierPrice3, maxPlayers]);

  // Calculate game duration
  const gameDuration = useMemo(() => {
    if (!startsAt || !endsAt) return null;
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} minutes`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
  }, [startsAt, endsAt]);

  const applyPreset = (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setRoundDuration(preset.values.roundBreakSec.toString());
      setMaxPlayers(preset.values.maxPlayers.toString());
      // Set tier prices based on preset entry fee
      const baseFee = preset.values.entryFee;
      setTierPrice1((baseFee * 1).toString());
      setTierPrice2((baseFee * 2.5).toString());
      setTierPrice3((baseFee * 5).toString());
      setPrizePool(preset.values.prizePool.toString());
      setActivePreset(presetId);
    }
  };

  // Form submission handler
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (isEdit) return;

    e.preventDefault();

    // Validation
    if (!selectedTheme) {
      setValidationError("Please select a theme for your game");
      return;
    }
    if (!title.trim()) {
      setValidationError("Please enter a game title");
      return;
    }
    if (!startsAt || !endsAt) {
      setValidationError("Please set both start and end times");
      return;
    }

    setValidationError(null);
    const formData = new FormData(e.currentTarget);
    setPendingFormData(formData);
    setShowConfirmation(true);
  };

  // Confirm game creation - wrapped in startTransition for React 19 compatibility
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

  // Get preview items for confirmation modal
  const getPreviewItems = () => {
    if (!pendingFormData) return [];

    const themeData = THEMES.find((t) => t.id === pendingFormData.get("theme"));
    const tier1 = pendingFormData.get("tierPrice1")?.toString() || "0";
    const tier3 = pendingFormData.get("tierPrice3")?.toString() || "0";
    const prizePoolValue = pendingFormData.get("prizePool")?.toString() || "0";

    return [
      {
        label: "Title",
        value: pendingFormData.get("title")?.toString() || "Untitled",
      },
      {
        label: "Theme",
        value: themeData
          ? `${themeData.icon} ${themeData.label}`
          : "Not selected",
      },
      {
        label: "Ticket Tiers",
        value: `$${tier1} - $${tier3} USDC`,
      },
      {
        label: "Prize Pool",
        value: `$${prizePoolValue} USDC`,
      },
      {
        label: "Starts At",
        value: startsAt ? new Date(startsAt).toLocaleString() : "Not set",
      },
      {
        label: "Max Players",
        value: pendingFormData.get("maxPlayers")?.toString() || "0",
      },
    ];
  };

  // Check form completion percentage
  const completionPercentage = useMemo(() => {
    let filled = 0;
    const total = 10;
    if (title.trim()) filled++;
    if (selectedTheme) filled++;
    if (startsAt) filled++;
    if (endsAt) filled++;
    if (tierPrice1) filled++;
    if (tierPrice2) filled++;
    if (tierPrice3) filled++;
    if (prizePool) filled++;
    if (roundDuration) filled++;
    if (maxPlayers) filled++;
    return Math.round((filled / total) * 100);
  }, [
    title,
    selectedTheme,
    startsAt,
    endsAt,
    tierPrice1,
    tierPrice2,
    tierPrice3,
    prizePool,
    roundDuration,
    maxPlayers,
  ]);

  return (
    <>
      <form
        ref={formRef}
        action={formAction}
        onSubmit={handleFormSubmit}
        className="space-y-8"
      >
        {/* Error Display */}
        {(state && !state.success && "error" in state) || validationError ? (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 animate-in slide-in-from-top-2 duration-300">
            <ExclamationCircleIcon className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">
              {validationError ||
                (state && "error" in state ? state.error : "")}
            </p>
          </div>
        ) : null}

        {/* Progress Indicator */}
        <div className="admin-panel p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/60">Form completion</span>
            <span className="text-sm font-bold text-[#FFC931]">
              {completionPercentage}%
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-[#FFC931] to-[#00CFF2] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Main Form */}
          <div className="xl:col-span-2 space-y-6">
            {/* Theme Selection - Full Width Cards */}
            <section className="admin-panel p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-[#FFC931]/15">
                  <SparklesIcon className="h-5 w-5 text-[#FFC931]" />
                </div>
                <div>
                  <h3 className="font-bold text-white font-display">
                    Choose Theme
                  </h3>
                  <p className="text-sm text-white/50">
                    Select the trivia category
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      setSelectedTheme(theme.id);
                      setValidationError(null);
                    }}
                    className={`relative group p-4 rounded-2xl border-2 transition-all duration-300 ${selectedTheme === theme.id
                        ? `border-white/30 bg-linear-to-br ${theme.color} shadow-lg ${theme.glowColor}`
                        : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                      }`}
                  >
                    {selectedTheme === theme.id && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#14B985] flex items-center justify-center">
                        <CheckIcon className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div className="text-3xl mb-2">{theme.icon}</div>
                    <div className="text-sm font-bold text-white">
                      {theme.label}
                    </div>
                    <div className="text-xs text-white/50 mt-0.5">
                      {theme.description}
                    </div>
                  </button>
                ))}
              </div>
              <input type="hidden" name="theme" value={selectedTheme} />
            </section>

            {/* Title & Description */}
            <section className="admin-panel p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-[#00CFF2]/15">
                  <PuzzlePieceIcon className="h-5 w-5 text-[#00CFF2]" />
                </div>
                <div>
                  <h3 className="font-bold text-white font-display">
                    Game Details
                  </h3>
                  <p className="text-sm text-white/50">
                    Name and describe your game
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-white/70 mb-2"
                  >
                    Game Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-lg placeholder-white/30 focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all font-medium"
                    placeholder="e.g., Friday Night Football Trivia"
                  />
                  <p className="mt-2 text-xs text-white/40">
                    {title.length}/100 characters
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-white/70 mb-2"
                  >
                    Description{" "}
                    <span className="text-white/30">(optional)</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all resize-none"
                    placeholder="Brief description of what players can expect..."
                  />
                </div>
              </div>
            </section>

            {/* Cover Image */}
            <section className="admin-panel p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-[#FB72FF]/15">
                  <PhotoIcon className="h-5 w-5 text-[#FB72FF]" />
                </div>
                <div>
                  <h3 className="font-bold text-white font-display">
                    Cover Image
                  </h3>
                  <p className="text-sm text-white/50">
                    Eye-catching visual for the game card
                  </p>
                </div>
              </div>
              <MediaPicker
                label=""
                name="coverUrl"
                accept="image"
                onSelect={setCoverUrl}
                selectedUrl={coverUrl}
              />
            </section>

            {/* Schedule */}
            <section className="admin-panel p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#14B985]/15">
                    <CalendarIcon className="h-5 w-5 text-[#14B985]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white font-display">
                      Schedule
                    </h3>
                    <p className="text-sm text-white/50">
                      When does the game run?
                    </p>
                  </div>
                </div>
                {gameDuration && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[#14B985]/15 rounded-lg">
                    <ClockIcon className="h-4 w-4 text-[#14B985]" />
                    <span className="text-sm font-medium text-[#14B985]">
                      {gameDuration}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="startsAt"
                    className="block text-sm font-medium text-white/70 mb-2"
                  >
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
                  <label
                    htmlFor="endsAt"
                    className="block text-sm font-medium text-white/70 mb-2"
                  >
                    End Time <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    id="endsAt"
                    name="endsAt"
                    required
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all scheme-dark"
                  />
                </div>
              </div>
            </section>

            {/* Quick Presets */}
            {!isEdit && (
              <section className="admin-panel p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 rounded-xl bg-[#FFC931]/15">
                    <BoltIcon className="h-5 w-5 text-[#FFC931]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white font-display">
                      Quick Presets
                    </h3>
                    <p className="text-sm text-white/50">
                      Start with recommended configurations
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset.id)}
                      className={`relative p-4 rounded-xl border transition-all duration-200 text-left ${activePreset === preset.id
                          ? "border-[#FFC931] bg-[#FFC931]/10"
                          : "border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20"
                        }`}
                    >
                      {activePreset === preset.id && (
                        <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#FFC931] flex items-center justify-center">
                          <CheckIcon className="h-3 w-3 text-black" />
                        </div>
                      )}
                      <preset.icon
                        className={`h-5 w-5 mb-2 ${activePreset === preset.id
                            ? "text-[#FFC931]"
                            : "text-white/60"
                          }`}
                      />
                      <div className="font-bold text-white text-sm">
                        {preset.label}
                      </div>
                      <div className="text-xs text-white/50 mt-0.5">
                        {preset.description}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Economics & Gameplay */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Economics */}
              <section className="admin-panel p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 rounded-xl bg-[#FFC931]/15">
                    <CurrencyDollarIcon className="h-5 w-5 text-[#FFC931]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white font-display">
                      Ticket Tiers
                    </h3>
                    <p className="text-sm text-white/50">Set prices for each tier</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Tier 1 - Bronze */}
                  <div>
                    <label
                      htmlFor="tierPrice1"
                      className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2"
                    >
                      <span className="w-3 h-3 rounded-full bg-gradient-to-br from-orange-600 to-orange-800"></span>
                      Tier 1 (Bronze) <span className="text-white/40">(USDC)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFC931] font-bold">
                        $
                      </span>
                      <input
                        type="number"
                        id="tierPrice1"
                        name="tierPrice1"
                        required
                        value={tierPrice1}
                        onChange={(e) => {
                          setTierPrice1(e.target.value);
                          setActivePreset(null);
                        }}
                        min={0}
                        step="0.01"
                        className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
                        placeholder="20"
                      />
                    </div>
                  </div>

                  {/* Tier 2 - Silver */}
                  <div>
                    <label
                      htmlFor="tierPrice2"
                      className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2"
                    >
                      <span className="w-3 h-3 rounded-full bg-gradient-to-br from-gray-300 to-gray-500"></span>
                      Tier 2 (Silver) <span className="text-white/40">(USDC)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFC931] font-bold">
                        $
                      </span>
                      <input
                        type="number"
                        id="tierPrice2"
                        name="tierPrice2"
                        required
                        value={tierPrice2}
                        onChange={(e) => {
                          setTierPrice2(e.target.value);
                          setActivePreset(null);
                        }}
                        min={0}
                        step="0.01"
                        className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
                        placeholder="50"
                      />
                    </div>
                  </div>

                  {/* Tier 3 - Gold */}
                  <div>
                    <label
                      htmlFor="tierPrice3"
                      className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2"
                    >
                      <span className="w-3 h-3 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600"></span>
                      Tier 3 (Gold) <span className="text-white/40">(USDC)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFC931] font-bold">
                        $
                      </span>
                      <input
                        type="number"
                        id="tierPrice3"
                        name="tierPrice3"
                        required
                        value={tierPrice3}
                        onChange={(e) => {
                          setTierPrice3(e.target.value);
                          setActivePreset(null);
                        }}
                        min={0}
                        step="0.01"
                        className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
                        placeholder="100"
                      />
                    </div>
                  </div>

                  {/* Prize Pool */}
                  <div>
                    <label
                      htmlFor="prizePool"
                      className="block text-sm font-medium text-white/70 mb-2"
                    >
                      Prize Pool <span className="text-white/40">(USDC)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFC931] font-bold">
                        $
                      </span>
                      <input
                        type="number"
                        id="prizePool"
                        name="prizePool"
                        required
                        value={prizePool}
                        onChange={(e) => {
                          setPrizePool(e.target.value);
                          setActivePreset(null);
                        }}
                        min={0}
                        className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Gameplay */}
              <section className="admin-panel p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 rounded-xl bg-[#00CFF2]/15">
                    <ClockIcon className="h-5 w-5 text-[#00CFF2]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white font-display">
                      Gameplay
                    </h3>
                    <p className="text-sm text-white/50">Timing & limits</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="roundBreakSec"
                      className="block text-sm font-medium text-white/70 mb-2"
                    >
                      Round Duration{" "}
                      <span className="text-white/40">(seconds)</span>
                    </label>
                    <input
                      type="number"
                      id="roundBreakSec"
                      name="roundBreakSec"
                      required
                      value={roundDuration}
                      onChange={(e) => {
                        setRoundDuration(e.target.value);
                        setActivePreset(null);
                      }}
                      min={5}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
                      placeholder="15"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="maxPlayers"
                      className="block text-sm font-medium text-white/70 mb-2"
                    >
                      Max Players
                    </label>
                    <div className="relative">
                      <UserGroupIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                      <input
                        type="number"
                        id="maxPlayers"
                        name="maxPlayers"
                        required
                        value={maxPlayers}
                        onChange={(e) => {
                          setMaxPlayers(e.target.value);
                          setActivePreset(null);
                        }}
                        min={2}
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#FFC931]/50 focus:border-[#FFC931] transition-all"
                        placeholder="100"
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Right Column - Live Preview & Summary */}
          <div className="space-y-6">
            {/* Live Preview Card */}
            <div className="admin-panel p-5 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#14B985] animate-pulse" />
                <span className="text-sm font-medium text-white/60">
                  Live Preview
                </span>
              </div>

              {/* Mini Game Card Preview */}
              <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-white/10 to-white/5 border border-white/10">
                {/* Cover Image / Theme Background */}
                <div
                  className={`h-32 relative ${coverUrl
                      ? ""
                      : currentTheme
                        ? `bg-linear-to-br ${currentTheme.color}`
                        : "bg-linear-to-br from-white/10 to-white/5"
                    }`}
                >
                  {coverUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverUrl}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                  )}
                  {!coverUrl && currentTheme && (
                    <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-50">
                      {currentTheme.icon}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />

                  {/* Theme Badge */}
                  {currentTheme && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-lg">
                      <span className="text-sm">{currentTheme.icon}</span>
                      <span className="text-xs font-medium text-white">
                        {currentTheme.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-4">
                  <h4 className="font-bold text-white truncate">
                    {title || "Game Title"}
                  </h4>
                  <p className="text-xs text-white/50 mt-1 line-clamp-2">
                    {description || "Game description will appear here..."}
                  </p>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                    <div>
                      <div className="text-xs text-white/40">Entry Fee</div>
                      <div className="text-lg font-bold text-[#FFC931]">
                        ${tierPrice1 || "0"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white/40">Prize Pool</div>
                      <div className="text-lg font-bold text-[#14B985]">
                        ${prizePool || "0"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Summary */}
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between py-2.5 border-b border-white/10">
                  <span className="text-sm text-white/50">Max Players</span>
                  <span className="text-sm font-bold text-white">
                    {maxPlayers || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5 border-b border-white/10">
                  <span className="text-sm text-white/50">Round Duration</span>
                  <span className="text-sm font-bold text-white">
                    {roundDuration ? `${roundDuration}s` : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5 border-b border-white/10">
                  <span className="text-sm text-white/50">Game Duration</span>
                  <span className="text-sm font-bold text-white">
                    {gameDuration || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-white/50">Est. Revenue</span>
                  <span className="text-sm font-bold text-[#FFC931]">
                    ${estimatedRevenue.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Info Note */}
              <div className="mt-5 p-3 bg-[#FFC931]/10 rounded-xl border border-[#FFC931]/20">
                <div className="flex gap-2">
                  <InformationCircleIcon className="h-4 w-4 text-[#FFC931] shrink-0 mt-0.5" />
                  <p className="text-xs text-white/70">
                    Game will be created on-chain automatically. Players can
                    join once the game goes live.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex items-center justify-between pt-6 border-t border-white/10">
          <Link
            href="/admin/games"
            className="px-6 py-3 text-white/60 font-medium hover:text-white transition-colors"
          >
            ← Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending || completionPercentage < 100}
            className="group inline-flex items-center gap-3 px-8 py-4 bg-linear-to-r from-[#FFC931] to-[#FFD966] text-black font-bold rounded-2xl hover:shadow-lg hover:shadow-[#FFC931]/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[#FFC931] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-display text-lg"
          >
            {isEdit ? "Save Changes" : "Create Game"}
            <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
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
        description="This will create a new trivia game and register it on-chain. Players can join once the game is live."
        confirmText="Create Game"
        cancelText="Go Back"
        variant="warning"
        isLoading={isPending}
        previewItems={getPreviewItems()}
      />
    </>
  );
}
