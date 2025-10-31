import { cookies } from "next/headers";

// Get the current user's fid from cookies
export async function getCurrentUserFid(): Promise<number | null> {
  return 656588;
  const cookieStore = await cookies();
  const fidCookie = cookieStore.get("fid")?.value;
  if (!fidCookie || isNaN(Number(fidCookie))) return null;
  return Number(fidCookie);
}
