import { MahjongTileData } from '../types/mahjong';

// 1-9 筒 (Circles)
export const TONG_TILES: MahjongTileData[] = [
  { id: 'tong_1', category: 'tong', value: 1, nameZh: '一筒', nameEn: '1 Dot', color: '#dc2626' },
  { id: 'tong_2', category: 'tong', value: 2, nameZh: '二筒', nameEn: '2 Dots', color: '#2563eb' },
  { id: 'tong_3', category: 'tong', value: 3, nameZh: '三筒', nameEn: '3 Dots', color: '#2563eb' },
  { id: 'tong_4', category: 'tong', value: 4, nameZh: '四筒', nameEn: '4 Dots', color: '#2563eb' },
  { id: 'tong_5', category: 'tong', value: 5, nameZh: '五筒', nameEn: '5 Dots', color: '#dc2626' },
  { id: 'tong_6', category: 'tong', value: 6, nameZh: '六筒', nameEn: '6 Dots', color: '#2563eb' },
  { id: 'tong_7', category: 'tong', value: 7, nameZh: '七筒', nameEn: '7 Dots', color: '#dc2626' },
  { id: 'tong_8', category: 'tong', value: 8, nameZh: '八筒', nameEn: '8 Dots', color: '#2563eb' },
  { id: 'tong_9', category: 'tong', value: 9, nameZh: '九筒', nameEn: '9 Dots', color: '#2563eb' },
];

// 风牌 (Winds)
export const WIND_TILES: MahjongTileData[] = [
  { id: 'wind_east', category: 'wind', value: 'east', nameZh: '东风', nameEn: 'East Wind', color: '#1e293b' },
  { id: 'wind_south', category: 'wind', value: 'south', nameZh: '南风', nameEn: 'South Wind', color: '#1e293b' },
  { id: 'wind_west', category: 'wind', value: 'west', nameZh: '西风', nameEn: 'West Wind', color: '#1e293b' },
  { id: 'wind_north', category: 'wind', value: 'north', nameZh: '北风', nameEn: 'North Wind', color: '#1e293b' },
];

// 三元牌 (Dragons)
export const DRAGON_TILES: MahjongTileData[] = [
  { id: 'dragon_zhong', category: 'dragon', value: 'zhong', nameZh: '红中', nameEn: 'Red Dragon', color: '#dc2626' },
  { id: 'dragon_fa', category: 'dragon', value: 'fa', nameZh: '发财', nameEn: 'Green Dragon', color: '#15803d' },
  { id: 'dragon_bai', category: 'dragon', value: 'bai', nameZh: '白板', nameEn: 'White Dragon', color: '#0284c7' },
];

// 飞牌 (Jokers / Fei)
export const FEI_TILES: MahjongTileData[] = [
  { id: 'fei_1', category: 'fei', value: 1, nameZh: '飞牌', nameEn: 'Joker (Fei)', color: '#b45309' },
  { id: 'fei_2', category: 'fei', value: 2, nameZh: '飞牌', nameEn: 'Joker (Fei)', color: '#b45309' },
  { id: 'fei_3', category: 'fei', value: 3, nameZh: '飞牌', nameEn: 'Joker (Fei)', color: '#b45309' },
  { id: 'fei_4', category: 'fei', value: 4, nameZh: '飞牌', nameEn: 'Joker (Fei)', color: '#b45309' },
];

// 花牌 (Flowers: 四季 + 四君子)
export const FLOWER_TILES: MahjongTileData[] = [
  // 四季
  { id: 'flower_chun', category: 'flower', value: 'chun', nameZh: '春', nameEn: 'Spring', flowerNumber: 1, color: '#dc2626' },
  { id: 'flower_xia', category: 'flower', value: 'xia', nameZh: '夏', nameEn: 'Summer', flowerNumber: 2, color: '#dc2626' },
  { id: 'flower_qiu', category: 'flower', value: 'qiu', nameZh: '秋', nameEn: 'Autumn', flowerNumber: 3, color: '#dc2626' },
  { id: 'flower_dong', category: 'flower', value: 'dong', nameZh: '冬', nameEn: 'Winter', flowerNumber: 4, color: '#dc2626' },
  // 四君子
  { id: 'flower_mei', category: 'flower', value: 'mei', nameZh: '梅', nameEn: 'Plum', flowerNumber: 1, color: '#2563eb' },
  { id: 'flower_lan', category: 'flower', value: 'lan', nameZh: '兰', nameEn: 'Orchid', flowerNumber: 2, color: '#2563eb' },
  { id: 'flower_ju', category: 'flower', value: 'ju', nameZh: '菊', nameEn: 'Chrysanthemum', flowerNumber: 3, color: '#2563eb' },
  { id: 'flower_zhu', category: 'flower', value: 'zhu', nameZh: '竹', nameEn: 'Bamboo', flowerNumber: 4, color: '#2563eb' },
];

// 动物牌 (Animals: 猫、老鼠、鸡、蜈蚣)
export const ANIMAL_TILES: MahjongTileData[] = [
  { id: 'animal_cat', category: 'animal', value: 'cat', nameZh: '猫', nameEn: 'Cat', animalPair: 'animal_rat', color: '#ea580c' },
  { id: 'animal_rat', category: 'animal', value: 'rat', nameZh: '老鼠', nameEn: 'Rat', animalPair: 'animal_cat', color: '#64748b' },
  { id: 'animal_rooster', category: 'animal', value: 'rooster', nameZh: '公鸡', nameEn: 'Rooster', animalPair: 'animal_centipede', color: '#b91c1c' },
  { id: 'animal_centipede', category: 'animal', value: 'centipede', nameZh: '蜈蚣', nameEn: 'Centipede', animalPair: 'animal_rooster', color: '#7c3aed' },
];

// 小丑牌 (Joker tiles: 4张 Joker，大马三人麻将 84 张标准牌，不分男女)
export const FACE_TILES: MahjongTileData[] = [
  { id: 'face_joker_1', category: 'face', value: 'joker', nameZh: 'Joker', nameEn: 'Joker', color: '#7c3aed' },
  { id: 'face_joker_2', category: 'face', value: 'joker', nameZh: 'Joker', nameEn: 'Joker', color: '#7c3aed' },
  { id: 'face_joker_3', category: 'face', value: 'joker', nameZh: 'Joker', nameEn: 'Joker', color: '#7c3aed' },
  { id: 'face_joker_4', category: 'face', value: 'joker', nameZh: 'Joker', nameEn: 'Joker', color: '#7c3aed' },
];

// 全集字典 (共84张大马三人麻将标准牌)
export const ALL_TILES_MAP: Record<string, MahjongTileData> = {};
[
  ...TONG_TILES,
  ...WIND_TILES,
  ...DRAGON_TILES,
  ...FEI_TILES,
  ...FLOWER_TILES,
  ...ANIMAL_TILES,
  ...FACE_TILES,
].forEach(tile => {
  ALL_TILES_MAP[tile.id] = tile;
});

// 快速根据 id 获取牌数据
export function getTileById(id: string): MahjongTileData {
  if (ALL_TILES_MAP[id]) return ALL_TILES_MAP[id];
  // 兼容旧版人头牌 id
  if (id.startsWith('face_male') || id.startsWith('face_female') || id.startsWith('face_joker')) {
    return FACE_TILES[0];
  }
  // 兼容飞牌简写
  if (id.startsWith('fei')) return FEI_TILES[0];
  // 默认兜底
  return { id, category: 'tong', value: 1, nameZh: '未知', nameEn: 'Unknown' };
}

// 检查两只动物是否咬到 (猫吃老鼠，鸡吃蜈蚣)
export function isAnimalBite(animal1Id: string, animal2Id: string): boolean {
  if ((animal1Id === 'animal_cat' && animal2Id === 'animal_rat') ||
      (animal1Id === 'animal_rat' && animal2Id === 'animal_cat')) {
    return true;
  }
  if ((animal1Id === 'animal_rooster' && animal2Id === 'animal_centipede') ||
      (animal1Id === 'animal_centipede' && animal2Id === 'animal_rooster')) {
    return true;
  }
  return false;
}
