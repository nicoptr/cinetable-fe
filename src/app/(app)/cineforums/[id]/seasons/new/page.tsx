import { notFound } from "next/navigation";
import { PageTitle } from "@/components/ui";
import { apiServer } from "@/lib/api-server";
import type { Award, Category, CineforumDetail } from "@/lib/types";
import { SeasonForm } from "../SeasonForm";

export default async function NewSeasonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const c = await apiServer<CineforumDetail>(`/cineforums/${id}`);
  if (c.myRole !== "PRESIDENT") notFound();
  const [categories, awards] = await Promise.all([
    apiServer<Category[]>(`/cineforums/${id}/categories`),
    apiServer<Award[]>(`/cineforums/${id}/awards`),
  ]);
  return (
    <>
      <PageTitle>Nuova edizione</PageTitle>
      <SeasonForm cineforumId={id} categories={categories} awards={awards} members={c.members} />
    </>
  );
}
