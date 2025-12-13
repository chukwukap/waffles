import StatsClient from "./client";

// Server component just renders the client
// All data fetching happens client-side with authenticated API calls
export default function AllTimeStatsPage() {
  return <StatsClient />;
}
