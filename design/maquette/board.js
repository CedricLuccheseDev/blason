// A board's page (planches.mjs inlines it after frame.js): its head and its
// foot, its screens, each a frame of the game at its real size (frameDocument)
// scaled to its place, and once they are laid out, its notes: each set in
// the column on the left at the height of what it names, as near as the
// notes above it allow, and a line drawn from its number to that piece, read
// in the frame by its selector (the frame is a document of the same origin)
// or given in the frame's own pixels; on the phone, the same number laid on
// the same piece. A board of the interface's system shows its pieces
// (pieces.tsx) as the game's components drew them, on the board itself, the
// bar and the lords' list put in their places from a capture. When all is
// drawn, the body says so (data-ready), and what could not be found is
// listed in window.missing.

const data = JSON.parse(document.getElementById('data').textContent)
const { board } = data

/** The board's grid, as board.css draws it: the notes' column (its words, then its numbers), the body's top and bottom. */
const GRID = {
  margin: 64,
  notes: 340,
  marker: 32,
  gap: 40,
  top: 212,
  bottom: 996,
  width: 1920,
}
/** Where a note's line leaves: its number's right side. */
const LEAVES = GRID.margin + GRID.notes + 14 + GRID.marker
/** Where the screens stand: right of the notes' numbers, to the margin; the lines turn just before. */
const AREA = { left: LEAVES + 36, right: GRID.width - GRID.margin }
const KNEE = AREA.left - 16
/** Room under the screens for their captions. */
const CAPTION = 36
/** Between two notes, at the least; the marker's middle under a note's top. */
const NOTE_GAP = 22
const MARKER_Y = 15

window.missing = []

const element = (tag, className, text) => {
  const made = document.createElement(tag)
  if (className) made.className = className
  if (text !== undefined) made.textContent = text
  return made
}

/** Words set as French is: no line begins with its colon or its semicolon; and the figures in Alegreya Sans, IM Fell's own reading as letters. */
function words(tag, className, text) {
  const made = element(tag, className)
  const french = text.replace(/ ([:;?!])/g, '\u00a0$1')
  for (const [i, part] of french.split(/(\d+(?:[ \u00a0]\d+)*)/).entries())
    made.append(i % 2 ? element('span', 'figure', part) : part)
  return made
}

function head() {
  const top = element('header', 'head')
  const titles = element('div', 'titles')
  titles.append(words('h1', null, board.title), words('p', null, board.line))
  top.append(element('div', 'number', board.number), titles)
  const foot = element('footer', 'foot')
  foot.append(
    element('span', 'mark', 'Blason'),
    element('span', 'when', data.when),
  )
  document.body.append(
    element('div', 'edge'),
    top,
    element('div', 'rule'),
    foot,
  )
}

/** What a screen shows of its frame: all of it, or the part it is cropped to ([x, y, width, height] in the frame's pixels), a detail shown larger. */
function viewOf(spec) {
  const [x, y, width, height] = spec.crop ?? [
    0,
    0,
    spec.frame.width,
    spec.frame.height,
  ]
  return { x, y, width, height }
}

/** The screens' places on the board ({ x, y, k }, k the scale): those given as [x, y, height], the others in a row, as tall as each other and as large as the area allows. */
function place(screens) {
  const row = screens.filter((s) => !s.box).map(viewOf)
  const room = AREA.right - AREA.left - GRID.gap * (row.length - 1)
  const ratio = row.reduce((sum, v) => sum + v.width / v.height, 0)
  const height = Math.min(GRID.bottom - GRID.top - CAPTION, room / ratio)
  const width = row.reduce(
    (sum, v) => sum + (height * v.width) / v.height,
    GRID.gap * (row.length - 1),
  )
  let x = AREA.left + (AREA.right - AREA.left - width) / 2
  const y = GRID.top + (GRID.bottom - GRID.top - CAPTION - height) / 2
  return screens.map((s) => {
    const view = viewOf(s)
    if (s.box) return { x: s.box[0], y: s.box[1], k: s.box[2] / view.height }
    const at = { x, y, k: height / view.height }
    x += view.width * at.k + GRID.gap
    return at
  })
}

/** A screen laid on the board: its frame's document in an iframe, loaded, scaled to its place and moved to the part it shows. */
function screen(spec, at) {
  const { width, height } = spec.frame
  const view = viewOf(spec)
  const box = element('div', spec.bare ? 'screen bare' : 'screen')
  Object.assign(box.style, {
    left: `${at.x}px`,
    top: `${at.y}px`,
    width: `${view.width * at.k}px`,
    height: `${view.height * at.k}px`,
  })
  const iframe = element('iframe')
  iframe.width = String(width)
  iframe.height = String(height)
  iframe.style.transform = `translate(${-view.x * at.k}px, ${-view.y * at.k}px) scale(${at.k})`
  iframe.setAttribute('tabindex', '-1')
  box.append(iframe)
  document.body.append(box)
  if (spec.caption) {
    const caption = words('div', 'size', spec.caption)
    Object.assign(caption.style, {
      left: `${at.x}px`,
      top: `${at.y + view.height * at.k + 12}px`,
    })
    document.body.append(caption)
  }
  const loaded = new Promise((resolve) => {
    iframe.addEventListener('load', resolve, { once: true })
  })
  iframe.srcdoc = frameDocument(spec.frame, {
    page: data.page,
    css: data.css,
    extra: spec.extra ?? '',
  })
  return loaded.then(async () => {
    await iframe.contentDocument.fonts.ready
    return { iframe, at, view }
  })
}

/** A point of a frame on the board: a piece found by its selector (the first of several that matches), at `anchor` of its box (its left middle by default), or a point in the frame's pixels. */
function pointOf(shown, [index, target, anchor = [0, 0.5]]) {
  const { iframe, at, view } = shown[index]
  let x
  let y
  if (Array.isArray(target) && typeof target[0] === 'number') [x, y] = target
  else {
    const selectors = Array.isArray(target) ? target : [target]
    const doc = iframe.contentDocument
    const piece = selectors
      .map((s) => doc.querySelector(s))
      .find((found) => found && found.getClientRects().length > 0)
    if (!piece) return null
    const r = piece.getBoundingClientRect()
    x = r.left + r.width * anchor[0]
    y = r.top + r.height * anchor[1]
  }
  return { x: at.x + (x - view.x) * at.k, y: at.y + (y - view.y) * at.k }
}

/** The notes' tops: each at the height of what it names, pushed down below the one above, then all lifted should the last run past the body. */
function stack(wanted, heights) {
  const tops = []
  let floor = GRID.top
  for (const [i, want] of wanted.entries()) {
    tops[i] = Math.max(want, floor)
    floor = tops[i] + heights[i] + NOTE_GAP
  }
  let ceiling = GRID.bottom
  for (let i = tops.length - 1; i >= 0; i--) {
    tops[i] = Math.min(tops[i], ceiling - heights[i])
    ceiling = tops[i] - NOTE_GAP
  }
  return tops
}

const SVG = 'http://www.w3.org/2000/svg'
function svg(tag, attributes) {
  const made = document.createElementNS(SVG, tag)
  for (const [name, value] of Object.entries(attributes))
    made.setAttribute(name, String(value))
  return made
}

function marker(n, className = 'marker') {
  return element('span', className, String(n))
}

/** Whether two segments cross. */
function cross([a, b], [c, d]) {
  const side = (p, q, r) =>
    Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x))
  return side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0
}

/** Every order of n notes. */
function* orders(n, head = []) {
  if (head.length === n) yield head
  for (let i = 0; i < n; i++)
    if (!head.includes(i)) yield* orders(n, [...head, i])
}

/** Whether a segment runs over a box ({ left, top, right, bottom }). */
function over([a, b], box) {
  const inside = (p) =>
    p.x > box.left && p.x < box.right && p.y > box.top && p.y < box.bottom
  if (inside(a) || inside(b)) return true
  const corners = [
    { x: box.left, y: box.top },
    { x: box.right, y: box.top },
    { x: box.right, y: box.bottom },
    { x: box.left, y: box.bottom },
  ]
  return corners.some((c, i) => cross([a, b], [c, corners[(i + 1) % 4]]))
}

/** Whether a point lies beyond a piece, right of it and within its height: a line from the column to it would cross the piece. */
const beyond = (point, box) =>
  point.x > box.right && point.y < box.bottom + 8 && point.y > box.top - 8

/** Where a note would rather stand: at the height of what it names; or under a piece its line would cross on the way there, to go round it. */
function wish(note, pieces) {
  const piece = pieces.find((box) => beyond(note.point, box))
  return piece ? piece.bottom + 24 : note.point.y
}

/** A note's line, from its number: along its height to the screens, or past a piece it goes round, then straight to what it names. */
function route(y, point, pieces) {
  const round = pieces.find((box) => beyond(point, box) && y > box.bottom)
  const turn = round ? round.right + 14 : KNEE
  return [{ x: LEAVES, y }, { x: turn, y }, point]
}

/** A line's segments. */
const segments = (line) => line.slice(1).map((b, i) => [line[i], b])

/** The notes' order down the column and their tops: of every order, the one whose lines cross each other least, then the pieces to keep clear, then lean least. */
function arrange(found, heights, pieces) {
  const wishes = found.map((note) => wish(note, pieces))
  let best = null
  for (const order of orders(found.length)) {
    const tops = stack(
      order.map((i) => wishes[i] - MARKER_Y),
      order.map((i) => heights[i]),
    )
    const lines = order.map((i, p) =>
      route(tops[p] + MARKER_Y, found[i].point, pieces),
    )
    const parts = lines.map(segments)
    let crossings = 0
    for (let p = 0; p < parts.length; p++)
      for (let q = p + 1; q < parts.length; q++)
        for (const one of parts[p])
          for (const other of parts[q]) if (cross(one, other)) crossings++
    let covered = 0
    for (const [p, line] of lines.entries())
      for (const box of pieces)
        if (
          !inBox(line.at(-1), box) &&
          parts[p].some((part) => over(part, box))
        )
          covered++
    const lean = lines.reduce(
      (sum, line) => sum + Math.abs(line[1].y - line[2].y),
      0,
    )
    const score = crossings * 1e6 + covered * 1e4 + lean
    if (!best || score < best.score) best = { order, tops, lines, score }
  }
  return best
}

const inBox = (p, box) =>
  p.x >= box.left && p.x <= box.right && p.y >= box.top && p.y <= box.bottom

/** The pieces the lines should keep clear of, on the board: those the screens name (`avoid:`, selectors). */
function keepClear(shown) {
  return board.screens.flatMap((spec, index) =>
    (spec.avoid ?? []).flatMap((selector) => {
      const a = pointOf(shown, [index, selector, [0, 0]])
      const b = pointOf(shown, [index, selector, [1, 1]])
      return a && b ? [{ left: a.x, top: a.y, right: b.x, bottom: b.y }] : []
    }),
  )
}

/** The notes, their lines and their pins, once the screens are laid out. */
function notes(shown) {
  const found = (board.notes ?? []).flatMap((note, i) => {
    const point = pointOf(shown, note.at)
    if (!point) {
      window.missing.push(`${board.name}: note ${i + 1}, ${note.at[1]}`)
      return []
    }
    return [{ ...note, point }]
  })
  const lines = svg('svg', { class: 'leaders', width: 1920, height: 1080 })
  const boxes = found.map((note) => {
    const box = words('div', 'note', note.text)
    document.body.append(box)
    return box
  })
  const {
    order,
    tops,
    lines: routes,
  } = arrange(
    found,
    boxes.map((box) => box.offsetHeight),
    keepClear(shown),
  )
  for (const [p, i] of order.entries()) {
    const note = found[i]
    const n = p + 1
    boxes[i].style.top = `${tops[p]}px`
    boxes[i].append(marker(n))
    const d = `M${routes[p].map(({ x, y }) => `${x} ${y}`).join(' L')}`
    lines.append(
      svg('path', { d, class: 'halo' }),
      svg('path', { d, class: 'line' }),
      svg('circle', {
        cx: note.point.x,
        cy: note.point.y,
        r: 4.5,
        class: 'end',
      }),
    )
    for (const pin of note.pins ?? []) pinOn(shown, pin, n)
  }
  document.body.append(lines)
}

/** A note's number laid on its piece in another screen, kept within that screen. */
function pinOn(shown, [index, target, anchor = [0, 0]], n) {
  const at = pointOf(shown, [index, target, anchor])
  if (!at) {
    window.missing.push(`${board.name}: pin of note ${n}, ${target}`)
    return
  }
  const { at: place, view } = shown[index]
  const { x, y, k } = place
  const { width, height } = view
  const dot = marker(n, 'marker pin')
  dot.style.left = `${Math.min(Math.max(at.x, x + 15), x + width * k - 15)}px`
  dot.style.top = `${Math.min(Math.max(at.y, y + 15), y + height * k - 15)}px`
  document.body.append(dot)
}

/** The cover: the land as key art, the game's name and its line. */
function cover() {
  document.body.classList.add('cover')
  const art = element('div', 'art')
  Object.assign(art.style, {
    backgroundImage: `url("${board.art}")`,
    backgroundSize: board.crop?.size ?? 'cover',
    backgroundPosition: board.crop?.at ?? 'center',
  })
  const name = element('div', 'name')
  const ornament = element('div', 'ornament')
  ornament.append(element('span'))
  name.append(
    words('h1', null, board.title),
    ornament,
    words('p', null, board.line),
  )
  const what = element('div', 'what')
  what.append(element('strong', null, board.what.title))
  what.append(document.createTextNode(board.what.line))
  // The land's own page and frame round it: no edge of the board's.
  document.body.append(art, element('div', 'veil'), name, what)
  return Promise.all([
    document.fonts.ready,
    new Promise((resolve) => {
      const image = new Image()
      image.onload = image.onerror = resolve
      image.src = board.art
    }),
  ])
}

/** The pieces laid on the board itself, at their size as drawn: the HUD's scale at 1, the parchment of the board under them. */
const BARE = `<style>
:root { --hud: 1; }
html, body { background: transparent !important; }
body { margin: 0; min-height: 0 !important; }
</style>`

/** The interface's pieces as a frame: the bar and the lords' list put in their places, from the capture they are taken from. */
function piecesScreen() {
  const { markup, from, slots } = board.pieces
  const doc = new DOMParser().parseFromString(markup, 'text/html')
  const source = new DOMParser().parseFromString(from, 'text/html')
  for (const [slot, selector] of Object.entries(slots)) {
    const piece = source.querySelector(selector)
    const place = doc.querySelector(`[data-slot="${slot}"]`)
    if (piece && place) place.append(piece)
    else window.missing.push(`${board.name}: ${slot}, ${selector}`)
  }
  const width = AREA.right - GRID.margin
  const height = GRID.bottom - GRID.top
  return {
    frame: { hud: doc.body.innerHTML, width, height },
    extra: BARE,
    bare: true,
    at: { x: GRID.margin, y: GRID.top, k: 1 },
  }
}

async function draw() {
  if (board.art) await cover()
  else if (board.pieces) {
    head()
    const spec = piecesScreen()
    await screen(spec, spec.at)
    await document.fonts.ready
  } else {
    head()
    const at = place(board.screens)
    const shown = await Promise.all(
      board.screens.map((spec, i) => screen(spec, at[i])),
    )
    await document.fonts.ready
    notes(shown)
  }
  document.body.dataset.ready = 'yes'
}

draw().catch((error) => {
  window.missing.push(`${board.name}: ${error.message}`)
  document.body.dataset.ready = 'yes'
})
