import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { PageTitle } from "@/components/ui";

export const metadata = { title: "Password dimenticata" };

export default function ForgotPasswordPage() {
  return (
    <>
      <PageTitle>Password dimenticata</PageTitle>
      <ForgotPasswordForm />
    </>
  );
}
