import { MiniAppManifest } from "@coinbase/onchainkit/minikit";
import { env } from "@/lib/env";
import { HOME_URL_PATH } from "@/lib/constants";

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
    description: "Pattern-matching tournaments built for everyone.",
    screenshotUrls: [
      `${env.rootUrl}/images/screenshots/1.png`,
      `${env.rootUrl}/images/screenshots/2.png`,
      `${env.rootUrl}/images/screenshots/3.png`,
    ],
    iconUrl: `${env.rootUrl}/icon.png`,
    splashImageUrl: `${env.rootUrl}/icon.png`,
    splashBackgroundColor: "#000000",
    homeUrl: `${env.rootUrl}${HOME_URL_PATH}`,
    webhookUrl: `${env.rootUrl}/api/webhook/notify`,
    primaryCategory: "games",
    tags: ["waffles", "games", "social", "fun"],
    heroImageUrl: `${env.rootUrl}/images/hero-image.png`,
    tagline: "Play daily social games",
    ogTitle: "Waffles",
    ogDescription: "Play daily social games",
    ogImageUrl: `${env.rootUrl}/og.png`,
    noindex: false,
  },
  // @ts-ignore
  baseBuilder: {
    allowedAddresses: ["0xd584F8079192E078F0f3237622345E19360384A2"],
  },
};
