import { Providers } from "@/components/providers";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <Providers>
        <main className="h-dvh flex flex-col overflow-hidden app-background">
            {children}
        </main>
    </Providers>;
}
