import { PageTitle, Section } from "@/components/ui";
import { apiServer } from "@/lib/api-server";
import type { Me } from "@/lib/types";
import { PasswordForm, ProfileForm } from "./ProfileForms";

export const metadata = { title: "Profilo" };

export default async function ProfilePage() {
  const me = await apiServer<Me>("/auth/me");
  return (
    <>
      <PageTitle>Profilo</PageTitle>
      <Section>
        <ProfileForm username={me.username} avatarUrl={me.avatarUrl ?? ""} />
      </Section>
      <Section title="Cambia password">
        <PasswordForm />
      </Section>
    </>
  );
}
