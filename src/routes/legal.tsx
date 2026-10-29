import { createFileRoute } from '@tanstack/react-router'
import { useLocale } from '~/i18n'
import { legalEn, legalFr } from '~/i18n/legal'
import { getLocale } from '~/i18n/locale'
import { SITE_URL } from '~/lib/site'
import { Leaf } from '~/components/home/Leaf'

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
    <Leaf title={m.title}>
      <div className="hud-prose">
        {m.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </div>
    </Leaf>
  )
}
