import { Providers } from "@/components/providers";
import { SplashProvider } from "@/components/SplashProvider";
import { Metadata } from "next";
import { minikitConfig } from "../../../minikit.config";


export async function generateMetadata(): Promise<Metadata> {
    return {
        title: minikitConfig.miniapp.name,
        description: minikitConfig.miniapp.description,
        other: {
            "fc:frame": JSON.stringify({
                version: minikitConfig.miniapp.version,
                imageUrl: minikitConfig.miniapp.heroImageUrl,
                button: {
                    title: `Play Waffles`,
                    action: {
                        name: `Play now`,
                        type: "launch_frame",
                        url: minikitConfig.miniapp.homeUrl,
                        splashImageUrl: minikitConfig.miniapp.splashImageUrl,
                        splashBackgroundColor: minikitConfig.miniapp.splashBackgroundColor,
                    },
                },
            }),
        },
    };
}

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Providers>
            <SplashProvider duration={2000}>
                <main className="h-dvh flex flex-col overflow-hidden app-background">
                    {children}
                </main>
            </SplashProvider>
        </Providers>
    );
}

