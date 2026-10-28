import { outline, paint, speckle } from './canvas'

// The cards' stock: a face with its gilt, its suit pips and its vignette (its
// words are HTML, laid over it), the common back, gules with a gilt lattice
// and the shield; and the player's card, his shield on it.

const [W, H] = [600, 846]
type Image = HTMLImageElement | null

/** A card's face: cream stock, three lines of frame, the vignette and the pips. */
export function cardFrontCanvas(pip: Image, art: Image) {
  return paint(W, H, (g) => {
    const gr = g.createLinearGradient(0, 0, W * 0.4, H)
    gr.addColorStop(0, '#fbf5e6')
    gr.addColorStop(1, '#efe1c0')
    g.fillStyle = gr
    g.fillRect(0, 0, W, H)
    speckle(g, W, H, 0.035, 13)
    const vg = g.createRadialGradient(
      W / 2,
      H / 2,
      W * 0.35,
      W / 2,
      H / 2,
      W * 0.85,
    )
    vg.addColorStop(0, 'rgba(120,80,20,0)')
    vg.addColorStop(1, 'rgba(120,80,20,0.22)')
    g.fillStyle = vg
    g.fillRect(0, 0, W, H)
    outline(g, [8, 8, W - 16, H - 16, 34], 4, '#6b4a12')
    outline(g, [14, 14, W - 28, H - 28, 30], 6, '#d9a41e')
    outline(g, [30, 30, W - 60, H - 60, 22], 3, 'rgba(138,95,15,0.75)')
    if (art) {
      g.save()
      g.beginPath()
      g.roundRect(48, 92, 504, 255, 22)
      g.clip()
      g.drawImage(art, 48, 92, 504, 255)
      g.restore()
      outline(g, [48, 92, 504, 255, 22], 3, 'rgba(43,30,18,0.45)')
    }
    if (pip) {
      g.drawImage(pip, 40, 30, 54, 54)
      g.save()
      g.translate(W - 40, H - 30)
      g.rotate(Math.PI)
      g.drawImage(pip, 0, 0, 54, 54)
      g.restore()
    }
  })
}

/** The back every card shares: gules, a gilt lattice, the shield in an oval. */
export function cardBackCanvas(shield: Image) {
  return paint(W, H, (g) => {
    const gr = g.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, H * 0.6)
    gr.addColorStop(0, '#9a2a20')
    gr.addColorStop(1, '#5d1712')
    g.fillStyle = '#f7eedb'
    g.fillRect(0, 0, W, H)
    g.fillStyle = gr
    g.beginPath()
    g.roundRect(26, 26, W - 52, H - 52, 22)
    g.fill()
    g.save()
    g.clip()
    g.strokeStyle = 'rgba(217,164,30,0.38)'
    g.lineWidth = 2.5
    for (let i = -H; i < W + H; i += 46) {
      g.beginPath()
      g.moveTo(i, 0)
      g.lineTo(i + H, H)
      g.moveTo(i, H)
      g.lineTo(i + H, 0)
      g.stroke()
    }
    g.fillStyle = 'rgba(244,210,119,0.55)'
    for (let y = 26; y < H; y += 46)
      for (let x = 26 + ((y / 46) % 2 ? 23 : 0); x < W; x += 46) {
        g.beginPath()
        g.arc(x, y, 3, 0, Math.PI * 2)
        g.fill()
      }
    g.restore()
    outline(g, [26, 26, W - 52, H - 52, 22], 6, '#d9a41e')
    outline(g, [42, 42, W - 84, H - 84, 14], 2.5, '#d9a41e')
    g.fillStyle = '#5d1712'
    g.beginPath()
    g.ellipse(W / 2, H / 2, 132, 160, 0, 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = '#d9a41e'
    g.lineWidth = 5
    g.stroke()
    if (shield) g.drawImage(shield, W / 2 - 84, H / 2 - 104, 168, 206)
    speckle(g, W, H, 0.03, 17)
  })
}

/** The player's card: vellum, ink and gilt frames, his shield on the left. */
export function tagCanvas(shield: Image) {
  return paint(900, 324, (g, w, h) => {
    g.fillStyle = '#f6eedb'
    g.fillRect(0, 0, w, h)
    speckle(g, w, h, 0.035, 19)
    outline(g, [3, 3, w - 6, h - 6, 18], 6, '#2b1e12')
    outline(g, [16, 16, w - 32, h - 32, 10], 3.5, '#d9a41e')
    if (shield) g.drawImage(shield, 50, 54, 180, 216)
  })
}
