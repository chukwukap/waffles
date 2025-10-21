"use client";

import { useEffect, useMemo, useState } from "react";

const UA_MOBILE_REGEX =
  /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop|Mobile/i;

export function useIsMobile() {
  const [vw, setVw] = useState<number | null>(null);
  const [ua, setUa] = useState<string>("");

  useEffect(() => {
    // viewport width
    const update = () => setVw(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    setUa(navigator.userAgent || "");
  }, []);

  // heuristics: UA OR small viewport
  return useMemo(() => {
    const uaLooksMobile = UA_MOBILE_REGEX.test(ua);
    const viewportLooksMobile = (vw ?? 0) <= 900; // tweak threshold as you like
    return uaLooksMobile || viewportLooksMobile;
  }, [ua, vw]);
}
