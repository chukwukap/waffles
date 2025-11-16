export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="h-dvh flex flex-col overflow-hidden">{children}</main>
  );
}
