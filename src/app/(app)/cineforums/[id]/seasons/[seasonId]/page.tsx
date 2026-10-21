import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/ui";
import { apiServer } from "@/lib/api-server";
import { formatDateTime } from "@/lib/format";
import type { Award, Category, CandidatureProgress, CineforumDetail, MyCandidature, SeasonResults, SeasonView } from "@/lib/types";
import { Draft } from "./_draft";
import { FinalNight } from "./_final";
import { Open } from "./_open";
import { RevealNext } from "./_reveal";
import { Screening } from "./_screening";

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
  const base = `/cineforums/${id}/seasons/${seasonId}`;
  const canReveal =
    s.status === "OPEN"
      ? new Date(s.candidaturesCloseAt) <= new Date() && s.candidatures.valid === s.candidatures.expected
      : s.status === "SCREENING" && s.remainingToReveal > 0;
  const final = s.status === "FINAL" || s.status === "DONE";
  const finalNight = final || (president && s.status === "SCREENING" && s.remainingToReveal === 0 && s.program.length > 0);
  return (
    <>
      <PageTitle>{s.name}</PageTitle>
      <p className="eyebrow mb-1">{STATUS[s.status]}</p>
      {s.status !== "OPEN" && (
        <p className="mb-6 text-muted">
          Candidature fino al {formatDateTime(s.candidaturesCloseAt)}
          {s.finalNightAt && ` · serata finale ${formatDateTime(s.finalNightAt)}`}
        </p>
      )}
      {/* stesso punto dell'albero in OPEN e SCREENING: la busta aperta sopravvive al cambio di stato */}
      {president && (s.status === "OPEN" || s.status === "SCREENING") && <RevealNext base={base} next={s.program.length + 1} available={canReveal} />}
      {s.status === "DONE" && (
        <div className="mb-8 border-y border-gold py-4 text-center">
          <p className="font-serif text-2xl text-gold">Rassegna conclusa</p>
          <Link href={`${base}/summary`} className="mt-2 inline-flex min-h-11 items-center underline underline-offset-4 hover:text-gold">
            Scheda della rassegna
          </Link>
        </div>
      )}
      {finalNight && (
        <FinalNight
          base={base}
          awards={s.awards}
          president={president}
          results={final ? await apiServer<SeasonResults>(`${base}/results`) : null}
        />
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
        <Screening base={base} season={s} />
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
