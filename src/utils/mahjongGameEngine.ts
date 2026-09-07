import { MahjongTileData, Meld, RuleSettings, CalculationResult, WinningConditions } from '../types/mahjong';
import { GameTile, GameSeatIndex, GamePlayer } from '../types/game';
import {
  TONG_TILES,
  WIND_TILES,
  DRAGON_TILES,
  FEI_TILES,
  FLOWER_TILES,
  ANIMAL_TILES,
  getTileById,
} from '../constants/tiles';
import { checkIsWin } from './mahjongEngine';
import { calculateMahjongScore } from './fanCalculator';

/**
 * 生成大马三人麻将标准 84 张牌库
 * - 1-9 筒：各 4 张 = 36 张
 * - 东/南/西/北：各 4 张 = 16 张
 * - 中/发/白：各 4 张 = 12 张
 * - 飞牌：4 张
 * - 花牌：春/夏/秋/冬/梅/兰/竹/菊 = 8 张
 * - 动物：猫/鼠/鸡/蜈蚣 = 4 张
 * 总计：84 张
 */
export function generateMalaysia3PDeck(): GameTile[] {
  const deck: GameTile[] = [];

  // 1. 筒子牌 4 份
  TONG_TILES.forEach(tile => {
    for (let i = 0; i < 4; i++) {
      deck.push({ ...tile, uid: `${tile.id}_${i}` });
    }
  });

  // 2. 风牌 4 份
  WIND_TILES.forEach(tile => {
    for (let i = 0; i < 4; i++) {
      deck.push({ ...tile, uid: `${tile.id}_${i}` });
    }
  });

  // 3. 三元牌 4 份
  DRAGON_TILES.forEach(tile => {
    for (let i = 0; i < 4; i++) {
      deck.push({ ...tile, uid: `${tile.id}_${i}` });
    }
  });

  // 4. 飞牌 4 份 (飞1 ~ 飞4)
  FEI_TILES.forEach((tile, i) => {
    deck.push({ ...tile, uid: `${tile.id}_${i}` });
  });

  // 5. 八张花牌 (春夏秋冬, 梅兰竹菊)
  FLOWER_TILES.forEach((tile, i) => {
    deck.push({ ...tile, uid: `${tile.id}_${i}` });
  });

  // 6. 四只动物 (猫, 鼠, 鸡, 蜈蚣)
  ANIMAL_TILES.forEach((tile, i) => {
    deck.push({ ...tile, uid: `${tile.id}_${i}` });
  });

  return deck;
}

/**
 * 洗牌 (Fisher-Yates)
 */
export function shuffleDeck(deck: GameTile[]): GameTile[] {
  const list = [...deck];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/**
 * 手牌理牌排序
 * 顺序：筒子 1-9 -> 风牌 (东南西北) -> 箭牌 (中发白) -> 飞牌 -> 花牌/动物
 */
export function sortHandTiles(tiles: GameTile[]): GameTile[] {
  const orderCategory: Record<string, number> = {
    tong: 1,
    wind: 2,
    dragon: 3,
    fei: 4,
    flower: 5,
    animal: 6,
  };

  const windOrder: Record<string, number> = {
    east: 1,
    south: 2,
    west: 3,
    north: 4,
  };

  const dragonOrder: Record<string, number> = {
    zhong: 1,
    fa: 2,
    bai: 3,
  };

  return [...tiles].sort((a, b) => {
    const catA = orderCategory[a.category] || 99;
    const catB = orderCategory[b.category] || 99;
    if (catA !== catB) return catA - catB;

    if (a.category === 'tong') {
      return Number(a.value) - Number(b.value);
    }
    if (a.category === 'wind') {
      return (windOrder[String(a.value)] || 0) - (windOrder[String(b.value)] || 0);
    }
    if (a.category === 'dragon') {
      return (dragonOrder[String(a.value)] || 0) - (dragonOrder[String(b.value)] || 0);
    }
    return a.id.localeCompare(b.id);
  });
}

/**
 * 补花处理：将手牌中的花牌和动物移入花牌区，并从牌墙末尾依次摸牌补足
 */
export function replaceFlowersInHands(
  hands: GameTile[][],
  flowers: GameTile[][],
  wall: GameTile[]
): {
  hands: GameTile[][];
  flowers: GameTile[][];
  wall: GameTile[];
  totalReplaced: number;
} {
  const newHands = hands.map(h => [...h]);
  const newFlowers = flowers.map(f => [...f]);
  const newWall = [...wall];
  let totalReplaced = 0;

  let hasFlowerToReplace = true;
  while (hasFlowerToReplace && newWall.length > 0) {
    hasFlowerToReplace = false;
    for (let p = 0; p < newHands.length; p++) {
      const regularTiles: GameTile[] = [];
      const flowerTiles: GameTile[] = [];

      for (const tile of newHands[p]) {
        if (tile.category === 'flower' || tile.category === 'animal') {
          flowerTiles.push(tile);
        } else {
          regularTiles.push(tile);
        }
      }

      if (flowerTiles.length > 0) {
        hasFlowerToReplace = true;
        totalReplaced += flowerTiles.length;
        newFlowers[p].push(...flowerTiles);

        // 从牌墙顶/尾摸新牌补足
        const drawnReplacements: GameTile[] = [];
        for (let k = 0; k < flowerTiles.length && newWall.length > 0; k++) {
          const drawn = newWall.pop()!;
          drawnReplacements.push(drawn);
        }
        newHands[p] = [...regularTiles, ...drawnReplacements];
      }
    }
  }

  return {
    hands: newHands.map(h => sortHandTiles(h)),
    flowers: newFlowers,
    wall: newWall,
    totalReplaced,
  };
}

/**
 * 检查当前玩家是否可胡牌
 */
export function checkCanPlayerWin(
  hand: GameTile[],
  melds: Meld[],
  flowers: GameTile[],
  winningTile: GameTile | undefined,
  isZimo: boolean,
  playerSeat: 'east' | 'south' | 'west',
  rules: RuleSettings
): { canWin: boolean; calcResult?: CalculationResult } {
  // 组装用于校验的手牌列表
  const testHand = isZimo
    ? [...hand]
    : winningTile
    ? [...hand, winningTile]
    : [...hand];

  // 必须满足总牌数规则 (手牌 + 副露*3 达到 14 张)
  const totalCount = testHand.length + melds.length * 3;
  if (totalCount < 14) {
    return { canWin: false };
  }

  // 1. 验证是否成胡 (含十三幺、七对、4飞等大马规则)
  const isWin = checkIsWin(testHand, melds, rules);
  if (!isWin) {
    return { canWin: false };
  }

  // 2. 算番校验是否达到起胡番数
  const conditions: WinningConditions = {
    isZimo,
    isConcealed: melds.length === 0,
    isKongBloom: false,
    isRobbingKong: false,
    isLastTileDraw: false,
    isLastTileDiscard: false,
    playerSeat,
    roundWind: 'east',
    isShooterDouble: true,
  };

  const scoreResult = calculateMahjongScore(testHand, melds, flowers, conditions, rules);

  // 检验起胡番数要求
  if (scoreResult.effectiveFan < (rules.minFan ?? 5)) {
    return { canWin: false, calcResult: scoreResult };
  }

  return { canWin: true, calcResult: scoreResult };
}

/**
 * 检查是否可以对某张弃牌进行「碰」
 */
export function checkCanPlayerPong(hand: GameTile[], discardTile: GameTile): boolean {
  if (discardTile.category === 'flower' || discardTile.category === 'animal' || discardTile.category === 'fei') {
    return false;
  }
  const matchingCount = hand.filter(t => t.id === discardTile.id).length;
  return matchingCount >= 2;
}

/**
 * 检查是否可以进行「杠」牌
 * - 明杠 (他人出牌，手中有 3 张)
 * - 暗杠 (自摸轮次，手中有 4 张)
 * - 补杠 (自摸轮次，手中 1 张已碰的牌)
 */
export function checkCanPlayerKong(
  hand: GameTile[],
  melds: Meld[],
  discardTile?: GameTile
): { canKong: boolean; type?: 'ming' | 'an' | 'bu'; targetTileId?: string } {
  // 1. 检查明杠 (他人出牌)
  if (discardTile) {
    if (discardTile.category === 'flower' || discardTile.category === 'animal' || discardTile.category === 'fei') {
      return { canKong: false };
    }
    const matchingCount = hand.filter(t => t.id === discardTile.id).length;
    if (matchingCount >= 3) {
      return { canKong: true, type: 'ming', targetTileId: discardTile.id };
    }
    return { canKong: false };
  }

  // 2. 检查暗杠 (自摸轮次，手牌中有 4 张相同普通牌)
  const idCounts: Record<string, number> = {};
  for (const t of hand) {
    if (t.category !== 'flower' && t.category !== 'animal' && t.category !== 'fei') {
      idCounts[t.id] = (idCounts[t.id] || 0) + 1;
      if (idCounts[t.id] >= 4) {
        return { canKong: true, type: 'an', targetTileId: t.id };
      }
    }
  }

  // 3. 检查补杠 (自摸轮次，已有碰牌副露，且手牌中有该张牌)
  for (const m of melds) {
    if (m.type === 'pong' && m.tiles.length >= 3) {
      const meldTileId = m.tiles[0].id;
      if (hand.some(t => t.id === meldTileId)) {
        return { canKong: true, type: 'bu', targetTileId: meldTileId };
      }
    }
  }

  return { canKong: false };
}

/**
 * 智能电脑 AI 出牌决策
 * 优先顺序：
 * 1. 绝对保留飞牌 (Joker)
 * 2. 丢弃未成对、无法成顺的单张字牌 (东南西北、中发白)
 * 3. 丢弃单张 1/9 边缘筒子
 * 4. 丢弃向听数损失最小的单张
 */
export function chooseSmartAIDiscard(hand: GameTile[], melds: Meld[]): GameTile {
  if (hand.length === 0) return hand[0];
  if (hand.length === 1) return hand[0];

  // 排除飞牌 (飞牌永不主动打出)
  const nonFeiTiles = hand.filter(t => t.category !== 'fei');
  if (nonFeiTiles.length === 0) return hand[0];

  // 统计每种牌出现次数
  const countMap: Record<string, number> = {};
  for (const t of nonFeiTiles) {
    countMap[t.id] = (countMap[t.id] || 0) + 1;
  }

  // 1. 查找孤张风牌或字牌 (只有 1 张)
  const isolatedHonors = nonFeiTiles.filter(
    t => (t.category === 'wind' || t.category === 'dragon') && countMap[t.id] === 1
  );
  if (isolatedHonors.length > 0) {
    // 随机或者打第一张孤张字牌
    return isolatedHonors[0];
  }

  // 2. 查找孤张 1 筒或 9 筒 (边张无相邻 2 或 8)
  const isolatedTerminals = nonFeiTiles.filter(t => {
    if (t.category !== 'tong' || countMap[t.id] > 1) return false;
    const val = Number(t.value);
    if (val === 1 && !nonFeiTiles.some(o => o.category === 'tong' && Number(o.value) === 2)) return true;
    if (val === 9 && !nonFeiTiles.some(o => o.category === 'tong' && Number(o.value) === 8)) return true;
    return false;
  });
  if (isolatedTerminals.length > 0) {
    return isolatedTerminals[0];
  }

  // 3. 寻找任何只有 1 张且两边都不挨着的筒子 (完全独立单张)
  const isolatedDots = nonFeiTiles.filter(t => {
    if (t.category !== 'tong' || countMap[t.id] > 1) return false;
    const val = Number(t.value);
    const hasAdj = nonFeiTiles.some(
      o => o.category === 'tong' && Math.abs(Number(o.value) - val) <= 2 && o.id !== t.id
    );
    return !hasAdj;
  });
  if (isolatedDots.length > 0) {
    return isolatedDots[0];
  }

  // 4. 任意单张牌
  const anySingle = nonFeiTiles.find(t => countMap[t.id] === 1);
  if (anySingle) {
    return anySingle;
  }

  // 5. 兜底打非飞牌的第一张
  return nonFeiTiles[0];
}

/**
 * 智能电脑 AI 碰/杠/胡决策
 */
export function decideAIClaim(
  availableActions: ('pong' | 'kong' | 'win')[],
  hand: GameTile[],
  melds: Meld[],
  discardTile: GameTile
): 'win' | 'kong' | 'pong' | 'pass' {
  if (availableActions.includes('win')) {
    return 'win';
  }
  if (availableActions.includes('kong')) {
    return 'kong';
  }
  if (availableActions.includes('pong')) {
    // 80% 的概率碰牌推进局势
    return Math.random() < 0.85 ? 'pong' : 'pass';
  }
  return 'pass';
}
