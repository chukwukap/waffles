import { SubHeader } from "@/components/ui/SubHeader";
export default function WaitlistLeaderboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <SubHeader title="LEADERBOARD" />
            {children}
        </>
    );
}
