// import { cookies } from "next/headers";

// Get the current user's fid from cookies (sync style using .then)
// export function getCurrentUserFid(): Promise<number | null> {
//   return cookies().then((cookieStore) => {
//     console.log("cookieStore:", cookieStore.getAll());
//     const fid = cookieStore.get("fid");
//     if (!fid) return null;
//     return Number(fid.value);
//   });
// }
