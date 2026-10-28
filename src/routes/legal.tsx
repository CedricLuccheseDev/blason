import { createFileRoute } from '@tanstack/react-router'
import { useLocale } from '~/i18n'
import { legalEn, legalFr } from '~/i18n/legal'
import { getLocale } from '~/i18n/locale'
import { SITE_URL } from '~/lib/site'

// The legal notice (LCEN), a non-professional publisher's. The text lives
// in src/i18n/legal.ts; this route only lays it out. noindex: the page
// exists for visitors, not for search engines.
export const Route = createFileRoute('/legal')({
  loader: async () => ({ locale: await getLocale() }),
  head: ({ loaderData }) => {
    const m = loaderData?.locale === 'fr' ? legalFr : legalEn
    return {
      meta: [
        { title: `${m.title}, Blason` },
        { name: 'robots', content: 'noindex' },
      ],
      links: [{ rel: 'canonical', href: `${SITE_URL}/legal` }],
    }
  },
  component: LegalPage,
})

function LegalPage() {
  const m = useLocale() === 'fr' ? legalFr : legalEn

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-20">
      <h1 className="rise-in font-display text-3xl font-bold tracking-tight">
        {m.title}
      </h1>
      <div className="rise-in stagger-1 mt-12 flex flex-col gap-10">
        {m.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-lg font-semibold">{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="mt-2 text-sm text-dim">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </main>
  )
}
