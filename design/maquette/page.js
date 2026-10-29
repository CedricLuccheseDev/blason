// The maquette's page (build.mjs inlines it after frame.js): each frame a
// document of its own (frameDocument), built from the captures held once in
// the page, at its real size, so that the game's CSS lays the HUD out as the
// game does at that size; then scaled down to its place in the row. A frame
// is built as it comes near the screen; a click opens it large.

const data = JSON.parse(document.getElementById('data').textContent)

const near = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      const frame = entry.target
      frame.querySelector('iframe').srcdoc = frame.build()
      near.unobserve(frame)
    }
  },
  { rootMargin: '600px 0px' },
)

/** Each screen's iframe scaled to the screen's width, as the page's width changes. */
const fit = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const screen = entry.target
    const width = Number(screen.dataset.width)
    screen.style.setProperty('--k', String(screen.clientWidth / width))
  }
})

const large = document.getElementById('large')

/** A frame opened large, as large as the window allows. */
function open(doc, width, height, name) {
  const room = large.querySelector('.large')
  large.querySelector('.large-name').textContent = name
  large.showModal()
  const k = Math.min(room.clientWidth / width, room.clientHeight / height)
  const iframe = document.createElement('iframe')
  iframe.width = String(width)
  iframe.height = String(height)
  iframe.style.transform = `scale(${k})`
  iframe.style.left = `${(room.clientWidth - width * k) / 2}px`
  iframe.srcdoc = doc
  room.replaceChildren(iframe)
}
large.addEventListener('click', (e) => {
  if (e.target === large) large.close()
})

function frameElement(frame, proposal, name) {
  const { width, height } = frame
  const figure = document.createElement('figure')
  figure.className = width < height ? 'frame upright' : 'frame'
  figure.style.setProperty('--aspect', String(width / height))
  const screen = document.createElement('div')
  screen.className = 'screen'
  screen.dataset.width = String(width)
  screen.style.setProperty('--w', String(width))
  screen.style.setProperty('--h', String(height))
  const iframe = document.createElement('iframe')
  iframe.setAttribute('loading', 'lazy')
  iframe.setAttribute('tabindex', '-1')
  iframe.title = `${name}, ${width} × ${height}`
  screen.append(iframe)
  const caption = document.createElement('figcaption')
  caption.textContent = `${width} × ${height}`
  figure.append(screen, caption)
  figure.build = () =>
    frameDocument(frame, { page: data.page, css: data.css, proposal })
  figure.addEventListener('click', () =>
    open(figure.build(), width, height, iframe.title),
  )
  near.observe(figure)
  fit.observe(screen)
  return figure
}

function version(moment, title, line, proposal) {
  const block = document.createElement('div')
  block.className = 'version'
  if (title) {
    const heading = document.createElement('h3')
    heading.textContent = title
    block.append(heading)
  }
  if (line) {
    const words = document.createElement('p')
    words.className = 'line'
    words.textContent = line
    block.append(words)
  }
  const row = document.createElement('div')
  row.className = 'row'
  for (const frame of moment.frames)
    row.append(frameElement(frame, proposal, moment.title))
  block.append(row)
  return block
}

const shown = (proposal, moment) =>
  !proposal.moments || proposal.moments.includes(moment.name)

for (const moment of data.moments) {
  const section = document.createElement('section')
  section.className = 'moment'
  section.id = moment.name
  const heading = document.createElement('h2')
  heading.textContent = moment.title
  const line = document.createElement('p')
  line.className = 'line'
  line.textContent = moment.line
  section.append(heading, line)
  const proposals = data.proposals.filter((p) => shown(p, moment))
  section.append(
    version(moment, proposals.length > 0 ? 'Le jeu' : null, null, null),
  )
  for (const proposal of proposals)
    section.append(
      version(
        moment,
        `Proposition : ${proposal.title}`,
        proposal.line,
        proposal,
      ),
    )
  document.getElementById('moments').append(section)
}
