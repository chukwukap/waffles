import { SubHeader } from "@/components/ui/SubHeader";
export default function WaitlistTasksLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <SubHeader title="QUESTS" />
            {children}
        </>
    );
}
