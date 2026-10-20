import { VerifyEmail } from "./VerifyEmail";

export const metadata = { title: "Conferma email" };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <VerifyEmail token={token ?? ""} />;
}
