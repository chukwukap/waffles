import { MiniAppManifest } from "@coinbase/onchainkit/minikit";
import { env } from "@/lib/env";

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig: MiniAppManifest = {
  // Only include accountAssociation if all env vars are set
  ...(env.accountAssociation.header &&
    env.accountAssociation.payload &&
    env.accountAssociation.signature && {
      accountAssociation: {
        header: env.accountAssociation.header,
        payload: env.accountAssociation.payload,
        signature: env.accountAssociation.signature,
      },
    }),
  miniapp: {
    version: "1",
    name: "Waffles",
    subtitle: "Waffles",
    description:
      "The internet's most addictive social pattern recognition game",
    screenshotUrls: [
      `${env.rootUrl}/images/screenshots/1.jpg`,
      `${env.rootUrl}/images/screenshots/2.jpg`,
      `${env.rootUrl}/images/screenshots/3.jpg`,
    ],
    iconUrl: `${env.rootUrl}/icon.png`,
    splashImageUrl: `${env.rootUrl}/icon.png`,
    splashBackgroundColor: "#000000",
    homeUrl: `${env.rootUrl}${env.homeUrlPath}`,
    webhookUrl: `${env.rootUrl}/api/webhook/notify`,
    primaryCategory: "games",
    tags: ["waffles", "games", "social", "fun"],
    heroImageUrl: `${env.rootUrl}/images/hero-image.png`,
    tagline: "Play daily social games",
    ogTitle: "Waffles",
    ogDescription:
      "The internet's most addictive social pattern recognition game",
    ogImageUrl: `${env.rootUrl}/og.png`,
  },
  // @ts-ignore
  baseBuilder: {
    allowedAddresses: ["0xd584F8079192E078F0f3237622345E19360384A2"],
  },
};
