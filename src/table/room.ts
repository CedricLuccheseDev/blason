import {
  ACESFilmicToneMapping,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  PCFShadowMap,
  PMREMGenerator,
  PointLight,
  SRGBColorSpace,
  Scene,
  WebGLRenderer,
} from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { Vector3 } from 'three'

// The room round the table: the renderer (it throws where there is no
// WebGL, and the home stands as a plain menu), the dark beyond the candle,
// the candle's light and its shadows, a soft fill so that the near things
// read.

/** The renderer; a phone's draws at most one and a half pixels to the point, to spare its battery. */
export function makeRenderer(phone: boolean) {
  const renderer = new WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(
    Math.min(phone ? 1.5 : 2, window.devicePixelRatio || 1),
  )
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.95
  renderer.outputColorSpace = SRGBColorSpace
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFShadowMap
  // The candle's shadows are drawn again only when a thing moves (motion.ts).
  renderer.shadowMap.autoUpdate = false
  renderer.shadowMap.needsUpdate = true
  return renderer
}

/** The scene, dark beyond the candle's reach, the room's reflections on the gilt. */
export function makeScene(renderer: WebGLRenderer) {
  const scene = new Scene()
  scene.background = new Color(0x0f0804)
  scene.fog = new Fog(0x0f0804, 170, 330)
  const pm = new PMREMGenerator(renderer)
  scene.environment = pm.fromScene(new RoomEnvironment(renderer), 0.04).texture
  pm.dispose()
  return scene
}

/** The candle's light at its flame, casting the shadows; a fill and the sky's. */
export function lights(scene: Scene, at: Vector3, power: number) {
  const key = new PointLight(0xffb469, power, 0, 1.75)
  key.position.copy(at)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.camera.near = 1
  key.shadow.camera.far = 320
  key.shadow.bias = -0.002
  key.shadow.normalBias = 0.04
  key.shadow.radius = 5
  const fill = new DirectionalLight(0xffe0b8, 0.2)
  fill.position.set(40, 120, 140)
  scene.add(key, fill, new HemisphereLight(0xffd6a0, 0x1c0f07, 0.14))
  return key
}
