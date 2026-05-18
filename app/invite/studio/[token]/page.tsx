import { StudioInviteAcceptClient } from "./StudioInviteAcceptClient";

type PageProps = { params: Promise<{ token: string }> };

export default async function StudioInvitePage({ params }: PageProps) {
  const { token } = await params;
  return (
    <main className="min-h-screen bg-background text-foreground">
      <StudioInviteAcceptClient token={token} />
    </main>
  );
}
