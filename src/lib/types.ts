import type { operations } from "./api-types";

type Ok<K extends keyof operations> = operations[K] extends { responses: { 200: { content: { "application/json": infer T } } } } ? T : never;

export type CineforumItem = Ok<"listMyCineforums">[number];
export type CineforumDetail = Ok<"getCineforum">;
export type MyInvitation = Ok<"listMyInvitations">[number];
export type InviteInfo = Ok<"getInvitationByToken">;
export type Me = Ok<"getMe">;
export type SeasonListItem = Ok<"listSeasons">[number];
export type InvitationView = Ok<"listInvitations">[number];
export type Category = Ok<"listCategories">[number];
export type Award = Ok<"listAwards">[number];
