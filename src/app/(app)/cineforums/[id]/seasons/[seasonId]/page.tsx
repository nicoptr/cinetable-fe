import { notFound } from "next/navigation";
import { PageTitle } from "@/components/ui";
import { apiServer } from "@/lib/api-server";
import { formatDateTime } from "@/lib/format";
import type { Award, Category, CandidatureProgress, CineforumDetail, MyCandidature, SeasonView } from "@/lib/types";
import { Draft } from "./_draft";
import { Open } from "./_open";

const STATUS: Record<SeasonView["status"], string> = {
  DRAFT: "Bozza",
  OPEN: "Candidature aperte",
  SCREENING: "In proiezione",
  FINAL: "Serata finale",
  DONE: "Conclusa",
};

export default async function SeasonPage({ params }: { params: Promise<{ id: string; seasonId: string }> }) {
  const { id, seasonId } = await params;
  if (!/^\d+$/.test(id) || !/^\d+$/.test(seasonId)) notFound();
  const s = await apiServer<SeasonView>(`/cineforums/${id}/seasons/${seasonId}`);
  const president = s.myRole === "PRESIDENT";
  return (
    <>
      <PageTitle>{s.name}</PageTitle>
      <p className="mb-1">{STATUS[s.status]}</p>
      {s.status !== "OPEN" && (
        <p className="mb-6 text-muted">
          Candidature fino al {formatDateTime(s.candidaturesCloseAt)}
          {s.finalNightAt && ` · serata finale ${formatDateTime(s.finalNightAt)}`}
        </p>
      )}
      {s.status === "DRAFT" ? (
        <Draft
          cineforumId={id}
          season={s}
          // le liste servono solo al form di modifica del presidente
          {...(president && (await editorData(id)))}
        />
      ) : s.status === "OPEN" ? (
        <Open
          cineforumId={id}
          season={s}
          mine={s.isParticipant ? await apiServer<MyCandidature>(`/cineforums/${id}/seasons/${seasonId}/candidature`) : null}
          progress={president ? await apiServer<CandidatureProgress>(`/cineforums/${id}/seasons/${seasonId}/progress`) : null}
        />
      ) : (
        // SCREENING, FINAL e DONE: viste nei task successivi
        <p className="text-muted">Questa fase della rassegna sarà disponibile a breve.</p>
      )}
    </>
  );
}

async function editorData(id: string) {
  const [c, categories, awards] = await Promise.all([
    apiServer<CineforumDetail>(`/cineforums/${id}`),
    apiServer<Category[]>(`/cineforums/${id}/categories`),
    apiServer<Award[]>(`/cineforums/${id}/awards`),
  ]);
  return { members: c.members, categories, awards };
}
