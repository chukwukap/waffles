// import Image from "next/image";
// import { cn } from "@/lib/utils";
// import { fetchChatMessages } from "@/lib/data";
// import { useRef } from "react";

// function AvatarCircle({ src, name }: { src?: string | null; name: string }) {
//   const initial = name?.trim()?.charAt(0)?.toUpperCase() || "•";
//   return src ? (
//     <div className="relative mt-[2px] size-5 shrink-0 overflow-hidden rounded-full ring-1 ring-white/5">
//       <Image src={src} alt={`${name}'s avatar`} fill className="object-cover" />
//     </div>
//   ) : (
//     <div className="grid size-5 shrink-0 place-items-center rounded-full bg-white/10 text-[.65rem] text-white/70 ring-1 ring-white/5">
//       {initial}
//     </div>
//   );
// }

// /**
//  * Displays a scrolling ticker of the latest chat messages as an overlay.
//  * Uses CSS masking for a fade effect at the top.
//  */
// export default async function ChatTickerOverlay({
//   className,
//   maxItems = 4,
//   gameId,
// }: {
//   className?: string;
//   maxItems?: number;
//   gameId: number;
// }) {
//   const messages = await fetchChatMessages(gameId, maxItems);

//   const containerRef = useRef<HTMLDivElement>(null);

//   const items = useMemo(() => {
//     const trimmed = messages.slice(-maxItems);
//     return trimmed.map((m, i) => ({
//       id: m.id ?? `${i}-${m.user?.name}-${m.message?.slice(0, 6)}`,
//       username: m.user?.name ?? "anon",
//       message: m.message ?? "",
//       avatar: m.user?.imageUrl ?? undefined,
//     }));
//   }, [messages, maxItems]);

//   useEffect(() => {
//     const element = containerRef.current;
//     if (element) {
//       element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
//     }
//   }, [items.length]);

//   return (
//     <div
//       aria-hidden="true"
//       className={cn(
//         "pointer-events-none absolute z-20 left-1/2 -translate-x-1/2 w-[min(94vw,40rem)] font-display",
//         className
//       )}
//     >
//       <div
//         ref={containerRef}
//         className="max-h-[7.5rem] overflow-hidden px-2 text-white/60"
//         style={{
//           WebkitMaskImage:
//             "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.1) 10%, rgba(0,0,0,1) 25%, rgba(0,0,0,1) 100%)",
//           maskImage:
//             "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.1) 10%, rgba(0,0,0,1) 25%, rgba(0,0,0,1) 100%)",
//         }}
//       >
//         <ul className="space-y-1.5">
//           {items.map((m) => (
//             <li
//               key={m.id}
//               className="flex items-start gap-2 text-xs sm:text-sm leading-relaxed"
//             >
//               <AvatarCircle src={m.avatar} name={m.username} />
//               <div className="mt-[1px]">
//                 <span className="font-medium text-white/70">{m.username}</span>
//                 <span className="text-white/60">{m.message}</span>
//               </div>
//             </li>
//           ))}
//           <li className="h-2" aria-hidden />
//         </ul>
//       </div>
//     </div>
//   );
// }
