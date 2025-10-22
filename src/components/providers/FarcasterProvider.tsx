"use client";
import { ReactNode } from "react";
import { useFarcaster } from "@/hooks/useFarcaster";

export default function FarcasterProvider({
  children,
}: {
  children: ReactNode;
}) {
  useFarcaster();
  return <>{children}</>;
}
