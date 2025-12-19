"use client";

import { useState } from "react";
import { ChatInputBar } from "./ChatInputBar";
import { ChatDrawer } from "./ChatDrawer";

// ==========================================
// MAIN COMPONENT
// ==========================================

/**
 * GameChat - Modular chat component
 *
 * Composes:
 * - ChatInputBar: Inline trigger with active count and input
 * - ChatDrawer: Full-screen slide-up panel with messages
 *
 * Parent component controls layout positioning.
 */
export function GameChat() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <ChatInputBar onOpen={() => setIsOpen(true)} />
      <ChatDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

export default GameChat;
