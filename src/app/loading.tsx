import { SplashScreen } from "@/components/ui/SplashScreen";

/**
 * Loading UI specific to the '/game' route segment.
 * Displays while the Server Component (`page.tsx`) for this route is fetching data.
 * Leverages the existing SplashScreen component.
 */
export default function Loading() {
  return <SplashScreen />;
}
