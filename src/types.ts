export type SpannerContentHeld = { active: true; reason?: string };
export type SpannerContentNotHeld = {};

export type SpannerContent = SpannerContentHeld | SpannerContentNotHeld;

export type SpannerState = { displayname: string; avatarUrl?: string } | null;

export const SpannerStateEventType = "uk.half-shot.spanner";
