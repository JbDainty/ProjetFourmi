/** Measured specimen bounds in the unchanged original atlases.
 * A plant may cross an imaginary quadrant: crop the specimen, never the quadrant.
 * [left, top, right, bottom], with a small transparent safety margin at render time.
 */
export const illustrationAtlases = [
  {
    source: require('../../assets/illustrations/prairies.png'),
    width: 1024,
    height: 1536,
    bounds: [
      [26, 17, 497, 754],
      [558, 16, 993, 754],
      [29, 777, 490, 1522],
      [520, 779, 994, 1521],
    ],
  },
  {
    source: require('../../assets/illustrations/sous-bois.png'),
    width: 1086,
    height: 1448,
    bounds: [
      [63, 5, 449, 729],
      [513, 0, 1012, 728],
      [32, 752, 445, 1431],
      [487, 750, 1057, 1414],
    ],
  },
  {
    source: require('../../assets/illustrations/zones-humides.png'),
    width: 1086,
    height: 1448,
    bounds: [
      [65, 6, 495, 686],
      [541, 7, 1059, 686],
      [91, 692, 420, 1442],
      [547, 700, 1064, 1442],
    ],
  },
  {
    source: require('../../assets/illustrations/montagnes.png'),
    width: 1086,
    height: 1448,
    bounds: [
      [14, 13, 522, 674],
      [566, 12, 1074, 675],
      [18, 704, 503, 1426],
      [541, 697, 1057, 1429],
    ],
  },
  {
    source: require('../../assets/illustrations/mediterranee.png'),
    width: 1086,
    height: 1448,
    bounds: [
      [79, 7, 404, 668],
      [532, 33, 1066, 659],
      [24, 678, 506, 1427],
      [544, 684, 1054, 1434],
    ],
  },
] as const;
