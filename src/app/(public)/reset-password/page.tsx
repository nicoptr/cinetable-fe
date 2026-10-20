import { PageTitle } from "@/components/ui";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata = { title: "Nuova password" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <>
      <PageTitle>Nuova password</PageTitle>
      <ResetPasswordForm token={token ?? ""} />
    </>
  );
}
