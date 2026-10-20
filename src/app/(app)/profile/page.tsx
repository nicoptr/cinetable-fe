import { PageTitle } from "@/components/ui";
import { apiServer } from "@/lib/api-server";
import type { Me } from "@/lib/types";
import { PasswordForm, ProfileForm } from "./ProfileForms";

export const metadata = { title: "Profilo" };

export default async function ProfilePage() {
  const me = await apiServer<Me>("/auth/me");
  return (
    <>
      <PageTitle>Profilo</PageTitle>
      <ProfileForm username={me.username} avatarUrl={me.avatarUrl ?? ""} />
      <h2 className="mb-4 mt-10 font-serif text-2xl">Cambia password</h2>
      <PasswordForm />
    </>
  );
}
