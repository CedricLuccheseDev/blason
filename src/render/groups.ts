import { Container } from 'pixi.js'

// How the scene's layers are drawn (scene.ts): each its own render group,
// and every piece they hold left out of the drawing while it lies off the
// screen.

/** Containers drawn as one render group, their batches kept until their own structure changes. */
export function group(...children: Array<Container>) {
  const c = new Container({ isRenderGroup: true })
  c.addChild(...children)
  return c
}

/** Every piece the layers hold may be left out of the drawing while it lies off the screen (pixi's culler, client.ts): a work, a man, a banner, a name. Marked each frame, the new ones with the rest. */
export function cullable(world: Container) {
  for (const band of world.children)
    for (const layer of band.children)
      for (const piece of layer.children) piece.cullable = true
}
