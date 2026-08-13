import { notFound } from "next/navigation";
import { GuestExperience } from "@/components/guest-experience";
import { getInvitation } from "@/lib/invitations";
import { invitationParamsSchema } from "@/lib/validation";

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const parsedParams = invitationParamsSchema.safeParse(await params);
  if (!parsedParams.success) notFound();
  const { token } = parsedParams.data;
  const invitation = await getInvitation(token);
  if (!invitation || invitation.status !== "active") notFound();

  return <GuestExperience invitation={invitation} />;
}
