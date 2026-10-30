import type { Legend } from '../legend'

// A Westeros drawn by our own hand: a long land from the cold north to a hot
// south, a great wall across its north, a narrow neck where a bight bites in
// from the east and a bay from the west, bays and capes down its eastern
// coast, a southern land behind its own mountains, a sea between it and the
// storm coast, islands off its shores. A frame of 500 by 1000 units, x to
// the east, y to the south.

const westeros: Legend = {
  width: 500,
  height: 1000,
  cols: 150,
  land: [
    [
      [60, 0],
      [470, 0],
      [460, 100],
      [440, 180],
      [452, 250],
      [420, 300],
      [372, 328],
      [300, 352],
      [262, 372],
      [300, 392],
      [360, 393],
      [440, 402],
      [470, 430],
      [482, 480],
      [460, 535],
      [420, 558],
      [390, 585],
      [372, 600],
      [425, 622],
      [478, 642],
      [470, 690],
      [472, 722],
      [430, 742],
      [382, 760],
      [335, 780],
      [420, 795],
      [470, 838],
      [452, 862],
      [400, 880],
      [330, 870],
      [260, 852],
      [200, 832],
      [152, 800],
      [128, 762],
      [108, 700],
      [88, 622],
      [80, 560],
      [100, 520],
      [92, 480],
      [112, 432],
      [150, 402],
      [170, 370],
      [120, 346],
      [72, 330],
      [32, 300],
      [60, 262],
      [42, 202],
      [70, 160],
      [52, 100],
    ],
    // The iron isles, in the western bay.
    [
      [66, 404],
      [102, 398],
      [112, 426],
      [80, 437],
    ],
    [
      [46, 442],
      [72, 440],
      [74, 462],
      [50, 462],
    ],
    // The dragon's isle, off the eastern bay.
    [
      [438, 564],
      [464, 565],
      [462, 588],
      [440, 586],
    ],
    // The sapphire isle, off the storm coast.
    [
      [480, 694],
      [498, 697],
      [497, 720],
      [481, 716],
    ],
    // The southern isle of the vines.
    [
      [92, 804],
      [126, 798],
      [132, 826],
      [98, 832],
    ],
  ],
  lakes: [
    // The great lake of the river lands, its isle at its heart.
    [
      [222, 518],
      [256, 514],
      [264, 540],
      [240, 554],
      [218, 541],
    ],
  ],
  ranges: [
    // The wall across the north, its gates the passes.
    [
      [70, 62],
      [200, 64],
      [300, 61],
      [452, 58],
    ],
    // The frozen fangs beyond it.
    [
      [72, 12],
      [112, 30],
      [146, 46],
    ],
    // The mountains of the high vale.
    [
      [396, 474],
      [436, 452],
      [458, 492],
    ],
    // The red mountains before the south.
    [
      [150, 796],
      [220, 786],
      [290, 791],
      [330, 802],
    ],
    // The hills of the gold west.
    [
      [120, 470],
      [150, 520],
      [140, 570],
    ],
  ],
  rivers: [
    // The three-forked river, to the eastern bay.
    [
      [230, 420],
      [282, 470],
      [330, 522],
      [386, 576],
    ],
    // The rush, to the king's bay.
    [
      [180, 560],
      [282, 580],
      [370, 598],
    ],
    // The great river of the south-west.
    [
      [222, 640],
      [150, 690],
      [110, 700],
    ],
    // The white knife, to the bight.
    [
      [300, 200],
      [322, 300],
      [302, 350],
    ],
    // The green blood of the south.
    [
      [300, 812],
      [380, 852],
      [420, 874],
    ],
  ],
}

export default westeros
