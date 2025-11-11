import { Suspense } from "react";
// import { BottomNav } from "@/components/BottomNav";
import { Spinner } from "@/components/ui/spinner";
import Header from "@/components/Header";

export default function TicketLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col text-white ">
      <Header />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <Spinner />
          </div>
        }
      >
        {children}
      </Suspense>
      {/* <BottomNav /> */}
    </div>
  );
}
