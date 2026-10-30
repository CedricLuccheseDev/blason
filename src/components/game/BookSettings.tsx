import { LEVELS, SETUP_LIMITS, TICKS_PER_SECOND } from '../../../engine'
import { Choices, Stepper } from '../hud/Choices'
import { Note } from '../hud/Text'
import { Head, Invite, Seats, Setting } from './BookParts'
import type { Book, Level } from '../../../engine'
import { useMessages } from '~/i18n'

// The book's right page (GameBook.tsx): the lords seated, the link to invite
// friends, and the settings, each its choices side by side or its count
// between less and more (« les fleches sont toutes petites … + moderne »);
// read only for a guest.

const TEAMS = [0, 2, 3, 4] as const
/** The plantings offered, in seconds, within the setup's bounds. */
const OPENINGS = [10, 20, 30, 45, 60] as const

export function BookSettings({
  book,
  code,
  lobby,
  guest,
  onChange,
}: Readonly<{
  book: Book
  code: string | null
  lobby: boolean
  guest: boolean
  onChange: (book: Book) => void
}>) {
  const m = useMessages().book
  const set = (part: Partial<Book>) => onChange({ ...book, ...part })
  const seconds = Math.round(book.opening / TICKS_PER_SECOND)
  // As many bots as the seats the guests leave.
  const most = SETUP_LIMITS.seats.max - 1 - (book.guests ?? 0)
  // A guest reads the settings; the host sets them.
  const edit = !guest
  return (
    <>
      <Head
        kicker={
          guest
            ? m.seatedGuest(book.bots, book.guests ?? 0)
            : m.seated(book.bots, book.guests ?? 0)
        }
        title={m.lords}
      />
      <Seats book={book} />
      {code && <Invite code={code} />}
      <Setting name={m.bots}>
        <Stepper
          name={m.bots}
          value={book.bots}
          least={0}
          most={most}
          less={m.less}
          more={m.more}
          onCount={edit ? (bots) => set({ bots }) : undefined}
        />
      </Setting>
      <Setting name={m.level}>
        <Choices
          name={m.level}
          value={book.level}
          options={LEVELS.map((level) => ({
            value: level,
            label: m.levels[level],
          }))}
          onPick={edit ? (level: Level) => set({ level }) : undefined}
        />
      </Setting>
      <Setting name={m.teams}>
        <Choices
          name={m.teams}
          value={book.teams}
          options={TEAMS.map((teams) => ({
            value: teams,
            label: teams ? String(teams) : m.none,
          }))}
          onPick={edit ? (teams: number) => set({ teams }) : undefined}
        />
      </Setting>
      <Setting name={m.opening}>
        <Choices
          name={m.opening}
          value={seconds}
          options={OPENINGS.map((s) => ({
            value: s,
            label: m.short(s),
          }))}
          onPick={
            edit
              ? (s: number) => set({ opening: s * TICKS_PER_SECOND })
              : undefined
          }
        />
      </Setting>
      {!lobby && <Note className="text-center">{m.next}</Note>}
    </>
  )
}
