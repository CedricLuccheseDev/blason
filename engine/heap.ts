// A heap of [priority, tile], the smallest first, ties by tile: the order
// an army takes the tiles before it.

type Item = [number, number]

function before(a: Item, b: Item) {
  return a[0] < b[0] || (a[0] === b[0] && a[1] < b[1])
}

function swap(heap: Array<Item>, a: number, b: number) {
  const item = heap[a]
  heap[a] = heap[b]
  heap[b] = item
}

/** A heap of [priority, tile], the smallest first, ties by tile. */
export function push(heap: Array<Item>, item: Item) {
  heap.push(item)
  let i = heap.length - 1
  while (i > 0) {
    const up = (i - 1) >> 1
    if (!before(heap[i], heap[up])) break
    swap(heap, i, up)
    i = up
  }
}

export function pop(heap: Array<Item>): Item | undefined {
  const top = heap.at(0)
  const last = heap.pop()
  if (!top || !last || heap.length === 0) return top
  heap[0] = last
  let i = 0
  for (;;) {
    const l = 2 * i + 1
    let m = i
    if (l < heap.length && before(heap[l], heap[m])) m = l
    if (l + 1 < heap.length && before(heap[l + 1], heap[m])) m = l + 1
    if (m === i) return top
    swap(heap, i, m)
    i = m
  }
}
