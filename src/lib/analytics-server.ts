import { AnalyticsEvent } from "./analytics";

// Server-side analytics (for server actions)
export async function trackServer(
  event: AnalyticsEvent,
  properties: Record<string, any>
) {
  // Only track in production
  if (process.env.NODE_ENV !== "production") return;

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) return;

  // Use PostHog Node SDK for server-side tracking
  // We use dynamic import to ensure this module is only loaded on the server
  // and to avoid build issues with client-side bundles.
  const { PostHog } = await import("posthog-node");
  const client = new PostHog(apiKey, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
  });

  try {
    client.capture({
      distinctId: properties.fid ? `fid_${properties.fid}` : "server",
      event,
      properties,
    });
    await client.shutdown();
  } catch (error) {
    console.error("Analytics error:", error);
  }
}
