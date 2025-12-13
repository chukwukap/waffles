import { SubHeader } from "@/components/ui/SubHeader";
export default function WaitlistQuestsLayout({
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
