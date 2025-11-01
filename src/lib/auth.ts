import { cookies } from "next/headers";

// Get the current user's fid from cookies
export async function getCurrentUserFid(): Promise<number | null> {
  const cookieStore = await cookies();
  const fid = cookieStore.get("fid");
  if (!fid) return null;
  return Number(fid.value);
}
