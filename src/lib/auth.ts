import { cookies } from "next/headers";

// Get the current user's fid from cookies
export async function getCurrentUserFid(): Promise<number | null> {
  const cookieStore = await cookies();
  const fidCookie = cookieStore.get("fid")?.value;
  console.log("fidCookie", fidCookie);
  if (!fidCookie) return null;
  return Number(fidCookie);
}
