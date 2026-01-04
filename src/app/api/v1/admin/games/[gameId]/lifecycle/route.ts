/**
 * Admin Game Lifecycle API
 *
 * GET  - Get lifecycle status
 * POST - Execute lifecycle action (rank or publish)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import {
  getGameLifecycleStatus,
  rankGame,
  publishResults,
  previewRanking,
  type GameLifecycleStatus,
  type RankResult,
  type PublishResult,
} from "@/lib/game/lifecycle";

type Params = { gameId: string };

// ============================================================================
// GET - Get Lifecycle Status
// ============================================================================

export async function GET(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { gameId } = await context.params;

  if (!gameId) {
    return NextResponse.json({ error: "Game ID required" }, { status: 400 });
  }

  const status = await getGameLifecycleStatus(gameId);

  if (!status) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  // Include preview if can rank
  let preview = null;
  if (status.canRank) {
    preview = await previewRanking(gameId);
  }

  return NextResponse.json({ ...status, preview });
}

// ============================================================================
// POST - Execute Action
// ============================================================================

interface ActionRequest {
  action: "rank" | "publish";
}

type ActionResponse =
  | {
      success: true;
      result: RankResult | PublishResult;
      newStatus: GameLifecycleStatus;
    }
  | { success: false; error: string };

export async function POST(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { gameId } = await context.params;

  if (!gameId) {
    return NextResponse.json({ error: "Game ID required" }, { status: 400 });
  }

  let body: ActionRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { action } = body;

  if (!action || !["rank", "publish"].includes(action)) {
    return NextResponse.json(
      { error: "Invalid action. Must be 'rank' or 'publish'" },
      { status: 400 }
    );
  }

  try {
    let result: RankResult | PublishResult;

    switch (action) {
      case "rank":
        result = await rankGame(gameId);
        break;
      case "publish":
        result = await publishResults(gameId);
        break;
    }

    // Get updated status
    const newStatus = await getGameLifecycleStatus(gameId);

    const response: ActionResponse = {
      success: true,
      result,
      newStatus: newStatus!,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(`[Lifecycle API] ${action} error:`, error);

    const response: ActionResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Action failed",
    };

    return NextResponse.json(response, { status: 400 });
  }
}
