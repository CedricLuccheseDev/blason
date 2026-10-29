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
import { Leaf } from '~/components/home/Leaf'

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
    <Leaf title={m.title} line={m.lead} wide>
      <div className="grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-2">
        {m.sections.map((section) => {
          const Diagram = section.diagram ? DIAGRAMS[section.diagram] : null
          return (
            <section key={section.heading} className="hud-prose">
              <h2>{section.heading}</h2>
              {Diagram ? (
                // On a phone the diagram keeps a readable size and scrolls
                // sideways rather than shrinking its words away.
                <div className="overflow-x-auto border border-quill/30 bg-vellum p-3 text-quill">
                  <div className="min-w-[480px]">
                    <Diagram t={m.t} />
                  </div>
                </div>
              ) : null}
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          )
        })}
      </div>
    </Leaf>
  )
}
