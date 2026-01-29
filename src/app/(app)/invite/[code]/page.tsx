import { redirect } from "next/navigation";

interface Props {
    params: Promise<{ code: string }>;
}

/**
 * Invite code redirect route.
 * 
 * When users visit /invite/ABC123, this route redirects them to
 * /redeem?code=ABC123 which opens the Waffles app with the code pre-filled.
 */
export default async function InviteCodePage({ params }: Props) {
    const { code } = await params;

    // Redirect to redeem page with the code as a query parameter
    redirect(`/redeem?code=${encodeURIComponent(code.toUpperCase())}`);
}
