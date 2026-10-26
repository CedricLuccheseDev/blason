import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <main className="flex flex-1 items-center justify-center">
      {/* norm-ok: wordmark, not copy */}
      <h1 className="rise-in font-display text-4xl font-bold tracking-tight">
        App
      </h1>
    </main>
  )
}
