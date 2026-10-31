import type { Legend } from '../legend'

// The West of a Middle-earth drawn by our own hand: a great land between a
// sea to the west and the waste to the east, a gulf cutting its north-west,
// a bay opening to the south-west where its great river ends; a long range
// running north to south down its middle, another west to east south of it,
// a dark land ringed by mountains in its south-east, an inland sea beyond.
// A frame of 1000 by 800 units, x to the east, y to the south.

const middle: Legend = {
  width: 1000,
  height: 800,
  cols: 260,
  land: [
    [
      [130, 0],
      [282, 0],
      [292, 108],
      [338, 124],
      [362, 0],
      [1000, 0],
      [1000, 800],
      [470, 800],
      [452, 762],
      [450, 740],
      [500, 728],
      [540, 714],
      [566, 690],
      [560, 680],
      [520, 665],
      [490, 646],
      [470, 656],
      [454, 640],
      [430, 613],
      [380, 601],
      [330, 593],
      [292, 611],
      [276, 590],
      [298, 540],
      [318, 500],
      [330, 466],
      [340, 430],
      [328, 392],
      [300, 371],
      [250, 362],
      [200, 349],
      [160, 331],
      [150, 313],
      [182, 301],
      [242, 296],
      [300, 289],
      [246, 277],
      [182, 272],
      [140, 262],
      [122, 216],
      [112, 140],
      [118, 60],
    ],
  ],
  lakes: [
    // The inland sea of the east.
    [
      [842, 298],
      [902, 288],
      [942, 330],
      [924, 382],
      [862, 384],
      [828, 342],
    ],
    // The bitter lake in the dark land.
    [
      [792, 548],
      [842, 543],
      [852, 574],
      [800, 581],
    ],
    // The long lake below the lonely mountain.
    [
      [752, 192],
      [768, 190],
      [771, 228],
      [756, 230],
    ],
  ],
  ranges: [
    // The misty range, north to south down the middle.
    [
      [562, 60],
      [576, 150],
      [562, 250],
      [550, 330],
      [540, 372],
      [520, 420],
      [502, 452],
    ],
    // The white range, west to east, to the river.
    [
      [420, 575],
      [470, 540],
      [510, 502],
      [560, 500],
      [610, 515],
      [648, 524],
    ],
    // The dark land's north wall.
    [
      [690, 490],
      [760, 480],
      [840, 470],
      [900, 480],
    ],
    // Its west and south walls.
    [
      [690, 495],
      [700, 560],
      [706, 620],
      [760, 632],
      [830, 630],
      [890, 620],
    ],
    // The grey range of the north.
    [
      [570, 92],
      [640, 80],
      [720, 86],
      [780, 96],
    ],
    // The blue range by the western gulf.
    [
      [200, 80],
      [206, 180],
      [216, 258],
      [238, 330],
    ],
    // The iron hills.
    [
      [830, 170],
      [872, 164],
    ],
    // The cold hills of the north-west.
    [
      [430, 92],
      [482, 80],
    ],
  ],
  rivers: [
    // The great river, from the north to the bay.
    [
      [602, 92],
      [620, 200],
      [632, 300],
      [640, 380],
      [652, 452],
      [660, 520],
      [640, 600],
      [600, 660],
      [562, 682],
    ],
    // The river of the little folk's land.
    [
      [420, 200],
      [400, 280],
      [370, 332],
      [330, 386],
    ],
    // The grey flood.
    [
      [500, 402],
      [420, 440],
      [336, 462],
    ],
    // The river of the gap.
    [
      [502, 458],
      [430, 520],
      [298, 562],
    ],
    // The running river, into the inland sea.
    [
      [765, 230],
      [800, 282],
      [846, 322],
    ],
    // The river of the western gulf.
    [
      [232, 200],
      [262, 284],
    ],
  ],
}

export default middle
