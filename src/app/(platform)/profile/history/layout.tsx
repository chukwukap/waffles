import { SubHeader } from "../_components/SubHeader";
export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SubHeader title="GAME HISTORY" />
      {children}
    </>
  );
}
