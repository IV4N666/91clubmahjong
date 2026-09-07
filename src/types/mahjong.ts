export type TileCategory = 'tong' | 'wind' | 'dragon' | 'fei' | 'flower' | 'animal';

export type WindValue = 'east' | 'south' | 'west' | 'north';
export type DragonValue = 'zhong' | 'fa' | 'bai';
export type FlowerValue = 'chun' | 'xia' | 'qiu' | 'dong' | 'mei' | 'lan' | 'zhu' | 'ju';
export type AnimalValue = 'cat' | 'rat' | 'rooster' | 'centipede';

export interface MahjongTileData {
  id: string; // e.g. 'tong_1', 'wind_east', 'fei_1', 'flower_chun', 'animal_cat'
  category: TileCategory;
  value: number | string; // 1-9 for tong, string for others
  nameZh: string;
  nameEn: string;
  pinyin?: string;
  color?: string; // For rendering text or badge
  flowerNumber?: number; // 1-4 for season/plant matching seat
  animalPair?: string; // 'cat' pairs with 'rat', 'rooster' pairs with 'centipede'
}

export type MeldType = 'chow' | 'pong' | 'kong_exposed' | 'kong_concealed';

export interface Meld {
  id: string;
  type: MeldType;
  tiles: MahjongTileData[];
}

export interface WinningConditions {
  isZimo: boolean; // 自摸
  isConcealed: boolean; // 门清
  isKongBloom: boolean; // 杠上开花
  isRobbingKong: boolean; // 抢杠
  isLastTileDraw: boolean; // 海底捞月
  isLastTileDiscard: boolean; // 海底捞沙
  playerSeat: WindValue; // 自身门风 (通常东家、南家、西家)
  roundWind: WindValue; // 圈风 (通常东风圈)
  isShooterDouble: boolean; // 出冲一人全包
}

export interface FanItem {
  id: string;
  nameZh: string;
  nameEn: string;
  fan: number;
  descriptionZh: string;
  descriptionEn: string;
  category: 'base' | 'suit' | 'special' | 'flower' | 'fei' | 'bonus';
}

export interface RuleSettings {
  minFan: number; // 默认 5 番起胡
  maxFan: number; // 默认 10 番封顶 (0 表示无上限)
  basePrice: number; // 底价 RM，如 0.50 或 1.00
  multiplierType: 'linear' | 'exponential' | 'tier_classic' | 'custom';
  baoFanThreshold?: number; // 爆番门槛番数 (默认 10 番，超过 10 番算爆番)
  baoFanMultiplier?: number; // 爆番倍数 (默认 20 倍底价)
  customTierTable: { fan: number; amount: number }[];
  shooterPaysAll: boolean; // 出冲是否一人包全部
  enableAnimalBiteBonus: boolean; // 猫吃老鼠/鸡吃蜈蚣即时现金奖励
  animalBiteCashAmount: number; // 咬到出钱金额 (例如 RM 1.00)
  flowerSetFan: number; // 一套花番数 (默认 2番或5番)
  allAnimalsFan: number; // 抓齐四只动物番数 (默认 5番)
  noFeiBonusFan: number; // 无飞/清飞加番 (默认 1番)
  fourFeiWinFan: number; // 4只飞满天飞直接胡牌番数 (默认 10番或满胡)
  noFlowerBaoFan: number; // 无花(清花)爆番番数 (默认 10番或满胡)
  // 飞牌结算模式：'cash' (不算番，直接算钱，如RM 0.50/张) 或 'fan' (+1番/张)
  feiCalculationMode: 'cash' | 'fan';
  feiCashAmount: number; // 飞牌单价现金金额 (RM)，支持自由编辑，默认 0.50
  // 开杠即时收钱：开杠立刻收取 N 番价值的现金 (例如底价 0.20 收 2 番 = 0.40)
  enableKongImmediateCash: boolean;
  kongImmediateFan: number; // 开杠收取的番数，默认 2 番
  // 自定义所有牌型与动作番数
  halfFlushFan: number; // 混一色 (半色) 番数，默认 2 番
  fullFlushFan: number; // 清一色 (全色) 番数，默认 4 番
  allPongsFan: number; // 碰碰胡 (对对胡) 番数，默认 2 番
  pureStraightFan: number; // 一条龙 (1-9筒) 番数，默认 2 番
  bigThreeDragonsFan: number; // 大三元 番数，默认 5 番
  smallThreeDragonsFan: number; // 小三元 番数，默认 3 番
  sevenPairsFan: number; // 七对子 番数，默认 5 番
  thirteenOrphansFan: number; // 十三幺 番数，默认 10 番 (满胡)
  menqingFan: number; // 门清 番数，默认 1 番 (0 表示不算门清)
  zimoFan: number; // 自摸 额外番数，默认 1 番
  kongBloomFan: number; // 杠上开花 番数，默认 1 番
  robbingKongFan: number; // 抢杠 番数，默认 1 番
  lastTileFan: number; // 海底捞月/捞沙 番数，默认 1 番
  animalBiteFan: number; // 动物咬到番数，默认 1 番
  // 玩法开关：勾选/取消勾选玩不玩该牌型或规则 (Tick / Untick)
  enableHalfFlush?: boolean; // 混一色开关
  enableFullFlush?: boolean; // 清一色开关
  enableAllPongs?: boolean; // 碰碰胡开关
  enablePureStraight?: boolean; // 一条龙开关
  enableSmallThreeDragons?: boolean; // 小三元开关
  enableBigThreeDragons?: boolean; // 大三元开关
  enableSevenPairs?: boolean; // 七对子开关
  enableThirteenOrphans?: boolean; // 十三幺开关
  enableMenqing?: boolean; // 门清开关
  enableZimoBonus?: boolean; // 自摸额外加番开关
  enableKongBloom?: boolean; // 杠上开花开关
  enableRobbingKong?: boolean; // 抢杠开关
  enableLastTile?: boolean; // 海底捞月/捞沙开关
  enableFlowerSet?: boolean; // 一套花开关
  enableAllAnimals?: boolean; // 齐抓四兽开关
  enableNoFeiBonus?: boolean; // 无飞(清飞)加番开关
  enableFourFeiWin?: boolean; // 4飞满天飞胡牌开关
  enableNoFlowerBaoFan?: boolean; // 无花(清花)爆番开关
}

export interface CalculationResult {
  isWin: boolean;
  totalFan: number;
  effectiveFan: number;
  fanItems: FanItem[];
  payout: {
    basePrice: number;
    winnerReceivedTotal: number;
    shooterPays: number;
    eachPayIfZimo: number;
    biteBonusEarned: number;
    feiCashEarned: number;
    kongCashEarned: number;
    ruleSummary: string;
  };
  handPatternNameZh: string;
  handPatternNameEn: string;
  warnings: string[];
}

export interface WaitingTileInfo {
  tile: MahjongTileData;
  potentialFan: number;
  remainingCount: number; // 基于手牌与牌池计算真实剩余张数
  inPoolCount: number; // 牌池中已打出的张数
  isDeadWait: boolean; // 是否是绝张 (剩余0张)
  winReasonZh: string;
}

export interface DiscardSuggestion {
  tile: MahjongTileData;
  tileIndex: number;
  shantenAfter: number; // 0 = 听牌, 1 = 一向听, 2 = 两向听
  waitingTilesCount: number; // 进张牌总张数
  potentialWaitingTiles: MahjongTileData[];
  expectedFan: number;
  hasDeadWaits?: boolean;
  reasonZh: string;
  reasonEn: string;
  isRecommended: boolean;
}

export interface Player {
  id: string;
  name: string;
  seat?: WindValue;
}

export interface GameRoundRecord {
  id: string;
  roundNumber: number;
  timestamp: number;
  winnerId: string;
  winType: 'zimo' | 'discard';
  shooterId?: string; // 出冲放炮者
  fan: number;
  effectiveFan: number;
  handPattern: string;
  payouts: Record<string, number>; // 每个玩家的收支变化 (赢家正数，付钱者负数)
  totalPot: number; // 赢家总收到金额
  notes?: string;
}

export interface TransferInstruction {
  fromPlayerId: string;
  fromPlayerName: string;
  toPlayerId: string;
  toPlayerName: string;
  amount: number;
}

export interface ShantenAnalysis {
  currentShanten: number; // -1 = 已胡牌, 0 = 听牌, 1 = 一向听...
  isTing: boolean;
  waitingTiles: WaitingTileInfo[];
  discardSuggestions: DiscardSuggestion[];
  statusMessageZh: string;
  statusMessageEn: string;
}

