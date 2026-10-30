import type { Legend } from '../legend'

// A Westeros and an Essos drawn by our own hand (« Westeros et essos »): to
// the west a long land from the cold north to a hot south, a great wall
// across its north, a narrow neck where a bight bites in from the east and a
// bay from the west, a southern land behind its own mountains, islands off
// its shores; across a narrow sea, a wide land to the east, its coast of
// free cities facing the first, a bay in its south, a broken peninsula, a
// wall of bones at its far east. A frame of 1600 by 1000 units, x to the
// east, y to the south.

const westeros: Legend = {
  width: 1600,
  height: 1000,
  cols: 320,
  land: [
    [
      [80, 0],
      [490, 0],
      [480, 100],
      [460, 180],
      [472, 250],
      [440, 300],
      [392, 328],
      [320, 352],
      [282, 372],
      [320, 392],
      [380, 393],
      [460, 402],
      [490, 430],
      [502, 480],
      [480, 535],
      [440, 558],
      [410, 585],
      [392, 600],
      [445, 622],
      [498, 642],
      [490, 690],
      [492, 722],
      [450, 742],
      [402, 760],
      [355, 780],
      [440, 795],
      [490, 838],
      [472, 862],
      [420, 880],
      [350, 870],
      [280, 852],
      [220, 832],
      [172, 800],
      [148, 762],
      [128, 700],
      [108, 622],
      [100, 560],
      [120, 520],
      [112, 480],
      [132, 432],
      [170, 402],
      [190, 370],
      [140, 346],
      [92, 330],
      [52, 300],
      [80, 262],
      [62, 202],
      [90, 160],
      [72, 100],
    ],
    // The iron isles, in the western bay.
    [
      [86, 404],
      [122, 398],
      [132, 426],
      [100, 437],
    ],
    [
      [66, 442],
      [92, 440],
      [94, 462],
      [70, 462],
    ],
    // The dragon's isle, off the eastern bay.
    [
      [458, 564],
      [484, 565],
      [482, 588],
      [460, 586],
    ],
    // The sapphire isle, off the storm coast.
    [
      [500, 694],
      [518, 697],
      [517, 720],
      [501, 716],
    ],
    // The southern isle of the vines.
    [
      [112, 804],
      [146, 798],
      [152, 826],
      [118, 832],
    ],
    // Essos, across the narrow sea: its free cities' coast, the grass sea,
    // the bay of slavers in its south, the broken peninsula of the old
    // empire, the bones to the east.
    [
      [640, 180],
      [760, 210],
      [900, 230],
      [1050, 200],
      [1200, 170],
      [1400, 150],
      [1600, 120],
      [1600, 760],
      [1450, 780],
      [1300, 762],
      [1190, 720],
      [1150, 700],
      [1140, 622],
      [1080, 600],
      [1040, 640],
      [1030, 700],
      [1000, 722],
      [982, 800],
      [940, 832],
      [902, 790],
      [880, 722],
      [820, 702],
      [800, 690],
      [742, 690],
      [700, 662],
      [662, 620],
      [650, 560],
      [632, 482],
      [622, 420],
      [600, 362],
      [640, 302],
      [620, 240],
    ],
    // The isle of the secret city, off the north of the free cities.
    [
      [584, 300],
      [604, 296],
      [606, 318],
      [586, 320],
    ],
    // The stepping stones, across the south of the narrow sea.
    [
      [566, 680],
      [584, 676],
      [586, 694],
      [568, 696],
    ],
    [
      [606, 694],
      [626, 690],
      [628, 708],
      [608, 711],
    ],
    [
      [646, 706],
      [664, 702],
      [666, 720],
      [648, 723],
    ],
    // The broken isles of the old empire.
    [
      [944, 856],
      [972, 852],
      [976, 878],
      [948, 882],
    ],
    // The cold isle of the north-east.
    [
      [1250, 60],
      [1400, 72],
      [1410, 118],
      [1260, 120],
    ],
    // The summer isles, south of Westeros.
    [
      [330, 930],
      [400, 924],
      [412, 966],
      [340, 972],
    ],
  ],
  lakes: [
    // The great lake of the river lands, its isle at its heart.
    [
      [242, 518],
      [276, 514],
      [284, 540],
      [260, 554],
      [238, 541],
    ],
  ],
  ranges: [
    // The wall across the north, its gates the passes.
    [
      [90, 62],
      [220, 64],
      [320, 61],
      [472, 58],
    ],
    // The frozen fangs beyond it.
    [
      [92, 12],
      [132, 30],
      [166, 46],
    ],
    // The mountains of the high vale.
    [
      [416, 474],
      [456, 452],
      [478, 492],
    ],
    // The red mountains before the south.
    [
      [170, 796],
      [240, 786],
      [310, 791],
      [350, 802],
    ],
    // The hills of the gold west.
    [
      [140, 470],
      [170, 520],
      [160, 570],
    ],
    // The bones, the east's wall.
    [
      [1360, 300],
      [1400, 420],
      [1430, 540],
      [1450, 650],
    ],
    // The fourteen flames of the broken peninsula.
    [
      [948, 760],
      [988, 790],
    ],
    // The hills of the free cities' hinterland.
    [
      [700, 250],
      [760, 330],
    ],
  ],
  rivers: [
    // The three-forked river, to the eastern bay.
    [
      [250, 420],
      [302, 470],
      [350, 522],
      [406, 576],
    ],
    // The rush, to the king's bay.
    [
      [200, 560],
      [302, 580],
      [390, 598],
    ],
    // The great river of the south-west.
    [
      [242, 640],
      [170, 690],
      [130, 700],
    ],
    // The white knife, to the bight.
    [
      [320, 200],
      [342, 300],
      [322, 350],
    ],
    // The green blood of the south.
    [
      [320, 812],
      [400, 852],
      [440, 874],
    ],
    // The mother of rivers, down to the old city at its mouth.
    [
      [720, 300],
      [760, 420],
      [782, 520],
      [800, 688],
    ],
  ],
}

export default westeros
