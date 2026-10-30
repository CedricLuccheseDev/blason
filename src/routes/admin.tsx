import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Leaf } from '~/components/home/Leaf'
import { Watch } from '~/components/home/Watch'

// The relay watched (« fais un /admin qui monitoring le live les parties en
// cours les joueurs tout ça »): every room it holds, read again every two
// seconds, behind the relay's key. noindex, and linked from nowhere.
export const Route = createFileRoute('/admin')({
  head: () => ({
    meta: [{ title: 'Admin, Blason' }, { name: 'robots', content: 'noindex' }],
  }),
  component: AdminPage,
})

const TITLE = 'Admin'

function AdminPage() {
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  return (
    <Leaf title={TITLE} wide>
      {ready && <Watch />}
    </Leaf>
  )
}
