import { ProfileProvider } from "./ProfileProvider";

export default function ProfileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <ProfileProvider>{children}</ProfileProvider>;
}
