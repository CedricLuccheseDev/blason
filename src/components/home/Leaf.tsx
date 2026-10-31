import { Link } from '@tanstack/react-router'
import { Foot } from './Foot'
import { Flourish, Frame, Rose } from './Ornaments'
import { usePresses } from './usePresses'
import type { ReactNode } from 'react'
import { Panel, Stack } from '~/components/hud/Layout'
import { Note, Title } from '~/components/hud/Text'

// A leaf of the game's book, for what is read beside the game: the journal
// and its articles, how it works, the legal notice (« les articles on lit
// mal y'a pas de hiérarchie de sections »). The home's page, its frame and
// its rose; the game's name at its head, back to the home; the leaf a sheet
// of the HUD, its title, a line under it, and what it says in the HUD's
// levels (Text.tsx, the articles' prose as .hud-prose); the site's foot.

export function Leaf({
  title,
  line,
  above,
  wide = false,
  children,
}: Readonly<{
  title: string
  /** A line under the title: a date, what the page is. */
  line?: string
  /** Above the title: the way back to a list. */
  above?: ReactNode
  /** A leaf of two columns, for a page with drawings. */
  wide?: boolean
  children: ReactNode
}>) {
  usePresses()
  return (
    <main className="hud relative flex w-full flex-1 flex-col bg-vellum">
      <Frame />
      <Rose className="absolute top-8 right-8 size-28 opacity-25 max-sm:top-6 max-sm:right-6 max-sm:size-14" />
      <div // norm-ok: the leaf's column and its room from the page's edge, as drawn (the HUD's bricks lay what is inside).
        className={`relative mx-auto flex w-full flex-1 flex-col gap-6 px-6 pt-10 pb-6 max-sm:px-4 ${wide ? 'max-w-6xl' : 'max-w-3xl'}`}
      >
        <header>
          <Stack gap="hair" align="center">
            {/* norm-ok: wordmark, not copy */}
            <Link
              to="/"
              className="font-mark text-5xl leading-none text-quill hover:text-gilt-deep max-sm:text-4xl"
            >
              Blason
            </Link>
            <Flourish />
          </Stack>
        </header>
        <Panel page gap="group" className="rise-in">
          <Stack gap="line">
            {above}
            <h1>
              <Title>{title}</Title>
            </h1>
            {line && <Note>{line}</Note>}
          </Stack>
          {children}
        </Panel>
      </div>
      <div // norm-ok: the page's foot, its room from the page's edge as on the home.
        className="relative flex justify-center px-8 pb-6 max-sm:px-6"
      >
        <Foot />
      </div>
    </main>
  )
}
