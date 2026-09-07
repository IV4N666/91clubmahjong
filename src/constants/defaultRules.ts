import { RuleSettings } from '../types/mahjong';

export const DEFAULT_RULES: RuleSettings = {
  minFan: 5, // 默认 5 番起胡 (马来西亚三人麻将标准)
  maxFan: 10, // 默认 10 番封顶 (满胡)
  basePrice: 0.50, // 默认底价 RM 0.50 (可切换 RM 0.20, RM 1.00, RM 2.00 等)
  multiplierType: 'linear', // 默认 几番几底 (1番=1底，7番=7×底价，超过10番爆番收20×底价)
  baoFanThreshold: 10, // 超过 10 番算爆番
  baoFanMultiplier: 20, // 爆番得 20 倍底价 (20底)
  customTierTable: [
    { fan: 5, amount: 1.00 },
    { fan: 6, amount: 2.00 },
    { fan: 7, amount: 4.00 },
    { fan: 8, amount: 8.00 },
    { fan: 9, amount: 16.00 },
    { fan: 10, amount: 32.00 },
    { fan: 11, amount: 40.00 },
    { fan: 12, amount: 50.00 },
    { fan: 13, amount: 64.00 },
    { fan: 14, amount: 80.00 },
    { fan: 15, amount: 100.00 },
    { fan: 16, amount: 128.00 },
  ],
  shooterPaysAll: true, // 出冲者一人全包 (大马三人麻将常见玩法：一人出冲包两家钱)
  enableAnimalBiteBonus: true, // 咬到奖励 (猫吃老鼠，鸡吃蜈蚣)
  animalBiteCashAmount: 1.00, // 咬到即时现金 RM 1.00
  flowerSetFan: 4, // 一套花 (四季或四君子) 维基标准奖励 4 番
  allAnimalsFan: 5, // 抓齐四只动物 5 番
  noFeiBonusFan: 1, // 清飞 (无飞牌胡牌) 额外奖励 1 番
  fourFeiWinFan: 10, // 4只飞牌直接满胡 (10番)
  noFlowerBaoFan: 10, // 无花(清花)爆番，默认 10 番 (满胡)
  faceTileFan: 1, // 每张人头牌计 1 番 (维基百科标准)
  allHonorsFan: 10, // 全字牌/全大炮 默认 10 番 (满胡爆番)
  bigFourWindsFan: 10, // 大四喜 默认 10 番 (满胡爆番)
  littleFourWindsFan: 10, // 小四喜 默认 10 番 (满胡爆番)
  fourKongsFan: 10, // 十八罗汉(四杠子) 默认 10 番 (满胡爆番)
  fourConcealedPungsFan: 10, // 坎坎胡(四暗刻) 默认 10 番 (满胡爆番)
  flowerHuFan: 10, // 花胡(八仙过海) 默认 10 番 (满胡爆番)
  tianHuFan: 10, // 天胡 默认 10 番 (满胡爆番)
  diHuFan: 10, // 地胡 默认 10 番 (满胡爆番)
  pureAllChowsFan: 4, // 全筒子平胡 默认 4 番 (维基百科标准)
  yaoJiuFan: 1, // 幺九 默认 1 番 (维基百科标准)
  daDongNanXiFan: 5, // 大东南西 默认 5 番
  xiaoDongNanXiFan: 3, // 小东南西 默认 3 番
  feiCalculationMode: 'cash', // 默认飞牌不算番，直接算现金 (如RM 0.50/张或RM 1.00/张)
  feiCashAmount: 0.50, // 默认每张飞牌 RM 0.50 (可自由编辑)
  enableKongImmediateCash: true, // 默认开杠即刻收钱
  kongImmediateFan: 2, // 默认开杠收 2 番的钱 (例如底价 0.20 即收 0.40)
  halfFlushFan: 2, // 混一色 (半色) 默认 2 番
  fullFlushFan: 4, // 清一色 (全色) 默认 4 番
  allPongsFan: 2, // 碰碰胡 (对对胡) 默认 2 番
  pureStraightFan: 2, // 一条龙 (1-9筒) 默认 2 番
  bigThreeDragonsFan: 10, // 大三元 默认 10 番 (维基百科爆番)
  smallThreeDragonsFan: 3, // 小三元 默认 3 番
  sevenPairsFan: 5, // 七对子 默认 5 番
  thirteenOrphansFan: 10, // 十三幺 默认 10 番 (满胡)
  nineGatesFan: 10, // 九莲宝灯 (九子连环) 默认 10 番 (满胡)
  menqingFan: 1, // 门清 默认 1 番
  zimoFan: 1, // 自摸 额外默认 1 番
  kongBloomFan: 1, // 杠上开花 默认 1 番
  robbingKongFan: 1, // 抢杠 默认 1 番
  lastTileFan: 1, // 海底捞月/捞沙 默认 1 番
  animalBiteFan: 1, // 动物咬到 默认 1 番
  // 默认全部开启 (玩家可随意打勾/去勾)
  enableHalfFlush: true,
  enableFullFlush: true,
  enableAllPongs: true,
  enablePureStraight: true,
  enableSmallThreeDragons: true,
  enableBigThreeDragons: true,
  enableSevenPairs: true,
  enableThirteenOrphans: true,
  enableNineGates: true,
  enableAllHonors: true,
  enableBigFourWinds: true,
  enableLittleFourWinds: true,
  enableFourKongs: true,
  enableFourConcealedPungs: true,
  enableFlowerHu: true,
  enableTianHuDiHu: true,
  enablePureAllChows: true,
  enableYaoJiu: true,
  enableDaDongNanXi: true,
  enableXiaoDongNanXi: true,
  enableMenqing: true,
  enableZimoBonus: true,
  enableKongBloom: true,
  enableRobbingKong: true,
  enableLastTile: true,
  enableFlowerSet: true,
  enableAllAnimals: true,
  enableNoFeiBonus: true,
  enableFourFeiWin: true,
  enableNoFlowerBaoFan: true,
};

// 预设筹码底价供用户一键选择
export const PRESET_BASE_PRICES = [0.10, 0.20, 0.50, 1.00, 2.00, 5.00, 10.00];

// 预设飞牌单价供用户一键选择
export const PRESET_FEI_PRICES = [0.20, 0.50, 1.00, 2.00, 5.00];

// 经典阶梯倍数 (5番=1倍, 6番=2倍, 7番=3倍, 8番=4倍, 9番=5倍, 10番=6倍...)
export function getClassicTierMultiplier(fan: number): number {
  if (fan < 5) return 0;
  switch (fan) {
    case 5: return 1;
    case 6: return 2;
    case 7: return 3;
    case 8: return 4;
    case 9: return 5;
    case 10: return 6;
    case 11: return 8;
    case 12: return 10;
    case 13: return 12;
    case 14: return 15;
    case 15: return 20;
    case 16: return 25;
    default: return Math.max(1, fan - 4);
  }
}
