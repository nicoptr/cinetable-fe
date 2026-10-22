import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/ui";
import { apiServer } from "@/lib/api-server";
import { candidaturesClosed, formatDateTime } from "@/lib/format";
import type { Award, Category, CandidatureProgress, CineforumDetail, MyCandidature, SeasonResults, SeasonView } from "@/lib/types";
import { Draft } from "./_draft";
import { FinalNight } from "./_final";
import { NextScreening } from "./_next";
import { Open } from "./_open";
import { SeasonRecap } from "./_recap";
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
  const [s, c] = await Promise.all([
    apiServer<SeasonView>(`/cineforums/${id}/seasons/${seasonId}`),
    apiServer<CineforumDetail>(`/cineforums/${id}`),
  ]);
  const president = s.myRole === "PRESIDENT";
  const base = `/cineforums/${id}/seasons/${seasonId}`;
  const canReveal =
    s.status === "OPEN"
      ? new Date(s.candidaturesCloseAt) <= new Date() && s.candidatures.valid === s.candidatures.expected
      : s.status === "SCREENING" && s.remainingToReveal > 0;
  const final = s.status === "FINAL" || s.status === "DONE";
  const finalNight = final || (president && s.status === "SCREENING" && s.remainingToReveal === 0 && s.program.length > 0);
  const [results, mine, progress, editor] = await Promise.all([
    final ? apiServer<SeasonResults>(`${base}/results`) : null,
    s.status === "OPEN" && s.isParticipant ? apiServer<MyCandidature>(`${base}/candidature`) : null,
    s.status === "OPEN" && president ? apiServer<CandidatureProgress>(`${base}/progress`) : null,
    s.status === "DRAFT" && president ? editorData(id, c) : null,
  ]);
  const label =
    s.status === "OPEN" && new Date(s.candidaturesCloseAt) <= new Date() ? "Candidature chiuse" : finalNight && s.status === "SCREENING" ? "Serata finale" : STATUS[s.status];
  return (
    <>
      <Link href={`/cineforums/${id}`} className="inline-flex min-h-11 items-center text-sm text-muted hover:text-gold print:hidden">
        {c.name}
      </Link>
      <PageTitle>{s.name}</PageTitle>
      <p className="eyebrow mb-1">{label}</p>
      {s.status !== "OPEN" && (
        <p className="mb-6 text-muted">
          {candidaturesClosed(s.status, s.candidaturesCloseAt) ? "Candidature chiuse il" : "Candidature fino al"} {formatDateTime(s.candidaturesCloseAt)}
          {s.finalNightAt && ` · serata finale ${formatDateTime(s.finalNightAt)}`}
        </p>
      )}
      {/* stesso punto dell'albero in OPEN e SCREENING: la busta aperta sopravvive al cambio di stato */}
      {president && (s.status === "OPEN" || s.status === "SCREENING") && <RevealNext base={base} next={s.program.length + 1} available={canReveal && s.nextScreening !== null} />}
      <NextScreening base={president && canReveal ? base : undefined} next={s.nextScreening} />
      {s.status === "DONE" && (
        <div className="mb-8 border-y border-gold py-4 text-center">
          <p className="font-serif text-2xl text-gold">Edizione conclusa</p>
          <Link href={`${base}/summary`} className="mt-2 inline-flex min-h-11 items-center underline underline-offset-4 hover:text-gold">
            Scheda dell&apos;edizione
          </Link>
        </div>
      )}
      {finalNight && (
        <FinalNight
          base={base}
          awards={s.awards}
          films={s.program.map((p) => p.movie)}
          president={president}
          results={results}
        />
      )}
      {s.status === "DRAFT" ? (
        <Draft
          cineforumId={id}
          season={s}
          // le liste servono solo al form di modifica del presidente
          {...editor}
        />
      ) : s.status === "OPEN" ? (
        <Open
          cineforumId={id}
          season={s}
          mine={mine}
          progress={progress}
        />
      ) : (
        <Screening base={base} season={s} />
      )}
      {s.status !== "DRAFT" && <SeasonRecap season={s} />}
    </>
  );
}

async function editorData(id: string, c: CineforumDetail) {
  const [categories, awards] = await Promise.all([
    apiServer<Category[]>(`/cineforums/${id}/categories`),
    apiServer<Award[]>(`/cineforums/${id}/awards`),
  ]);
  return { members: c.members, categories, awards };
}
