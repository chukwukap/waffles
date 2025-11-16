import { SubHeader } from "../_components/SubHeader";
export default function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SubHeader title="ALL-TIME STATS" />
      {children}
    </>
  );
}
