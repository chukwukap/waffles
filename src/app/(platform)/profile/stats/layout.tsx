import { SubHeader } from "@/components/ui/SubHeader";
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
