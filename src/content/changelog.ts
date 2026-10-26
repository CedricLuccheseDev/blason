// Release history, written by /dev-release and editable by hand afterwards.
// Newest first. One entry per release, both languages, no commit noise: only
// what changed for the visitor.
export type Release = {
  version: string
  /** ISO date, YYYY-MM-DD. */
  date: string
  en: Array<string>
  fr: Array<string>
}

export const releases: Array<Release> = []
