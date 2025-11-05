import Header from "@/components/Header";
export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 overflow-y-auto ">
      <Header />
      {children}
    </div>
  );
}
