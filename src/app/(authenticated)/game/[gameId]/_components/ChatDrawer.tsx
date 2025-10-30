import Image from "next/image";
import { ForwardMessageIcon, MessageIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { ChatWithUser, HydratedUser } from "@/state/types";
import { sendMessageAction } from "@/actions/chat";

// import { cookies } from "next/headers";

// Get the current user's fid from cookies
// export async function getCurrentUserFid(): Promise<number | null> {
//   const cookieStore = await cookies();
//   const fidCookie = cookieStore.get("fid")?.value;
//   if (!fidCookie || isNaN(Number(fidCookie))) return null;
//   return Number(fidCookie);
// }

// // Server data loader for chats
// async function getGameChats(gameId: number): Promise<ChatWithUser[]> {
//   return await prisma.chat.findMany({
//     where: { gameId },
//     orderBy: { createdAt: "asc" },
//     include: {
//       user: {
//         select: {
//           id: true,
//           fid: true,
//           name: true,
//           imageUrl: true,
//         },
//       },
//     },
//   });
// }

// // Form action form handler
async function handleFormSubmit(formData: FormData) {
  const gameId = Number(formData.get("gameId"));
  const message = String(formData.get("message") || "");
  const fid = Number(formData.get("fid"));

  // Optionally allow username/pfpUrl, but the server ignores them for inserts
  // Submit message via server action
  await sendMessageAction({ gameId, message, fid });
  // Tag revalidation happens in the server action itself
}

/**
 * Server Component: Renders chat messages for the current game, and a message form using server action.
 *
 * Expects:
 *   - gameId (from parent page params)
 *   - user (from parent layout, if available and can be passed as prop/context)
 */
export default function ChatDrawer({
  gameId,
  userInfo,
}: {
  gameId: number;
  userInfo: HydratedUser;
}) {
  // Fetch messages server-side
  // const messages = await getGameChats(gameId);
  // const user = await prisma.user.findUnique({
  //   where: { fid },
  //   select: {
  //     fid: true,
  //     name: true,
  //     imageUrl: true,
  //   },
  // });
  // if (!user) {
  //   return null;
  // }

  const messages: ChatWithUser[] = [];

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full max-w-screen-sm mx-auto z-30 pointer-events-none">
      <div
        className="absolute inset-0 flex flex-col justify-end font-display pointer-events-auto"
        style={{ minHeight: "60dvh" }}
      >
        <div className="relative w-full mx-auto flex flex-col rounded-t-2xl app-background noise h-[85vh] max-h-[90dvh] sm:max-h-[600px] min-h-[60dvh] overflow-hidden pointer-events-auto">
          {/* Header */}
          <div className="flex flex-row items-center justify-between px-4 pt-8 pb-3 border-b border-white/5 bg-[#191919] rounded-t-2xl font-body shrink-0">
            <div className="flex flex-row items-center gap-2">
              <MessageIcon />
              <h2
                id="chat-drawer-title"
                className="text-white text-lg md:text-xl select-none"
              >
                lobby CHAT
              </h2>
            </div>
          </div>

          {/* Messages */}
          <div className="flex flex-col items-start gap-3 sm:gap-4 pb-4 pt-6 px-4 flex-1 min-h-0 overflow-y-scroll scrollbar-none w-full">
            {messages.map((msg, idx) => {
              const username = msg.user?.name ?? "anon";
              const avatar = msg.user?.imageUrl ?? null;
              const time = new Date(msg.createdAt).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              });
              const isCurrentUser =
                userInfo &&
                (msg.user?.fid === userInfo.fid || msg.userId === userInfo.fid);

              return (
                <div
                  key={msg.id ?? idx}
                  className={cn(
                    "flex flex-col items-start gap-2 w-full",
                    isCurrentUser && "items-end"
                  )}
                  style={{ order: idx }}
                >
                  {!isCurrentUser && (
                    <div className="flex flex-row items-center gap-1.5 sm:gap-2 min-h-5 mb-0.5">
                      <div className="w-5 h-5 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                        {avatar ? (
                          <Image
                            src={avatar}
                            alt={`${username}'s avatar`}
                            width={20}
                            height={20}
                            className="w-5 h-5 object-cover"
                          />
                        ) : (
                          <span className="text-gray-400 text-xs font-semibold">
                            {username?.[0]?.toUpperCase() ?? "•"}
                          </span>
                        )}
                      </div>
                      <span className="ml-1 font-display font-medium text-[0.92rem] leading-[130%] tracking-[-0.03em] text-white">
                        {username}
                      </span>
                      <span className="mx-1 w-[0.28rem] h-[0.28rem] bg-[#D9D9D9] rounded-full inline-block" />
                      <span className="font-display font-medium text-[0.72rem] leading-[130%] tracking-[-0.03em] text-[#99A0AE]">
                        {time}
                      </span>
                    </div>
                  )}

                  <div
                    className={cn(
                      "max-w-[80%] sm:max-w-[70%] border rounded-[0.75rem] px-4 py-3 flex flex-col justify-center",
                      isCurrentUser
                        ? "bg-blue-600/30 border-blue-500/20 rounded-br-none"
                        : "bg-white/[0.08] border-white/[0.05] rounded-bl-none"
                    )}
                  >
                    <p className="font-display font-medium text-base leading-[130%] tracking-[-0.03em] text-white break-words">
                      {msg.message}
                    </p>
                  </div>
                </div>
              );
            })}
            {/* Not using auto-scroll with useRef because this is now static SSR */}
          </div>

          {/* Message form - now handled with server action */}
          <form
            action={handleFormSubmit}
            method="POST"
            className="flex flex-row items-center bg-[#0E0E0E] px-4 py-5 gap-3 border-t border-white/5 shrink-0"
            style={{
              paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)",
            }}
          >
            <input type="hidden" name="gameId" value={gameId} />
            {userInfo && (
              <>
                <input type="hidden" name="fid" value={userInfo.fid} />
                <input
                  type="hidden"
                  name="username"
                  value={userInfo.name ?? ""}
                />
                <input
                  type="hidden"
                  name="pfpUrl"
                  value={userInfo.imageUrl ?? ""}
                />
              </>
            )}
            <div className="flex items-center bg-white/5 rounded-full flex-1 px-5 py-3">
              <input
                name="message"
                placeholder={
                  userInfo
                    ? "Type a comment..."
                    : "You must be logged in to send messages"
                }
                className="flex-1 bg-transparent outline-none text-white placeholder-white/40 text-base font-display"
                disabled={!userInfo}
                required
                maxLength={500}
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              className="ml-3 bg-[#1B8FF5] rounded-full w-10 h-10 flex items-center justify-center active:scale-95 transition-transform shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shrink-0"
              aria-label="Send message"
              disabled={!userInfo}
            >
              <ForwardMessageIcon />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
