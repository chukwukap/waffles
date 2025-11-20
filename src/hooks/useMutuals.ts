import { useState, useEffect } from "react";

export function useMutuals(fid?: number) {
  const [data, setData] = useState<{
    mutuals: Array<{ fid: number; pfpUrl: string | null }>;
    mutualCount: number;
    totalCount: number;
  } | null>(null);

  useEffect(() => {
    if (!fid) return;
    fetch(`/api/mutuals?fid=${fid}&context=waitlist`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .catch(console.error);
  }, [fid]);

  return data;
}
