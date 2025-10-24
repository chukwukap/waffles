import { MiniAppManifest } from "@coinbase/onchainkit/minikit";
import { env } from "@/lib/env";

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig: MiniAppManifest = {
  accountAssociation: {
    header:
      "eyJmaWQiOjc1NTA3NCwidHlwZSI6ImF1dGgiLCJrZXkiOiIweERBYjk0NWQwODFFMDVlOEM0NzFlNTRGNTE0QURCOUM4NmYzYTJlYTQifQ",
    payload: "eyJkb21haW4iOiJkZGZkNzE2OTczZjUubmdyb2stZnJlZS5hcHAifQ",
    signature:
      "TrxowPCC+bB9M4Hx/0X8F6DSzULWvTU2WhX9U54gz61BRdiNtqVTO2lf4xntItR+IYEfvn+tFcZylhsm7tCsORs=",
  },

  miniapp: {
    version: "1",
    name: "Waffles",
    subtitle: "Waffles",
    description: "Pattern-matching tournaments built for Farcaster.",
    screenshotUrls: [
      `${env.rootUrl}/images/screenshots/1.png`,
      `${env.rootUrl}/images/screenshots/2.png`,
      `${env.rootUrl}/images/screenshots/3.png`,
    ],
    iconUrl: `${env.rootUrl}/icon.png`,
    splashImageUrl: `${env.rootUrl}/images/splash-icon.png`,
    splashBackgroundColor: "#1E1E1E",
    homeUrl: env.rootUrl,
    webhookUrl: `${env.rootUrl}/api/webhook`,
    primaryCategory: "games",
    tags: ["waffles", "games", "social", "fun"],
    heroImageUrl: `${env.rootUrl}/images/splash-icon.png`,
    tagline: "Play daily social games",
    ogTitle: "Waffles",
    ogDescription: "Play daily social games",
    ogImageUrl: `${env.rootUrl}/og.png`,
    noindex: true,
  },
};
