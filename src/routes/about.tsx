import { createFileRoute } from '@tanstack/react-router'
import {
  ScreenDiagram,
  SeedDiagram,
  StepDiagram,
} from '~/components/about/Diagrams'
import { useLocale } from '~/i18n'
import { aboutEn, aboutFr } from '~/i18n/about'
import { getLocale } from '~/i18n/locale'
import { SITE_URL } from '~/lib/site'

// "How it works": the land from a seed, the step of a game, from the state
// to the screen, what is not there yet. The text lives in src/i18n/about.ts,
// the diagrams in components/about/Diagrams.tsx.
export const Route = createFileRoute('/about')({
  loader: async () => ({ locale: await getLocale() }),
  head: ({ loaderData }) => {
    const m = loaderData?.locale === 'fr' ? aboutFr : aboutEn
    return {
      meta: [
        { title: `${m.title}, Blason` },
        { name: 'description', content: m.lead },
      ],
      links: [{ rel: 'canonical', href: `${SITE_URL}/about` }],
    }
  },
  component: AboutPage,
})

const DIAGRAMS = {
  seed: SeedDiagram,
  step: StepDiagram,
  screen: ScreenDiagram,
}

function AboutPage() {
  const m = useLocale() === 'fr' ? aboutFr : aboutEn
  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-20">
      <h1 className="rise-in font-display text-3xl font-bold tracking-tight">
        {m.title}
      </h1>
      <p className="rise-in stagger-1 mt-4 text-base text-dim">{m.lead}</p>
      <div className="rise-in stagger-2 mt-12 grid grid-cols-1 gap-x-12 gap-y-14 lg:grid-cols-2">
        {m.sections.map((section) => {
          const Diagram = section.diagram ? DIAGRAMS[section.diagram] : null
          return (
            <section key={section.heading}>
              <h2 className="font-display text-xl font-bold tracking-tight lg:text-2xl">
                {section.heading}
              </h2>
              {Diagram ? (
                // On a phone the diagram keeps a readable size and scrolls
                // sideways rather than shrinking its words away.
                <div className="mt-4 overflow-x-auto border border-hairline bg-card p-3 text-ink">
                  <div className="min-w-[480px]">
                    <Diagram t={m.t} />
                  </div>
                </div>
              ) : null}
              {section.body.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-3 text-base leading-relaxed text-dim"
                >
                  {paragraph}
                </p>
              ))}
            </section>
          )
        })}
      </div>
    </main>
  )
}
