import { GameHeader } from "./game/_components/GameHeader";

export default function PlatformLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <GameHeader />
            {children}
        </>
    );
}
