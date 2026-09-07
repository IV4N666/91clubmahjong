import { MahjongTileData, Meld, WaitingTileInfo, DiscardSuggestion, ShantenAnalysis } from '../types/mahjong';
import { TONG_TILES, WIND_TILES, DRAGON_TILES, getTileById } from '../constants/tiles';

// 所有可能用于胡牌的常规牌 (1-9筒、东南西北、中发白)
export const REGULAR_WINNING_CANDIDATES: MahjongTileData[] = [
  ...TONG_TILES,
  ...WIND_TILES,
  ...DRAGON_TILES,
];

// 将牌转换为内部简写标记以高效计算
// 1-9筒: 1-9
// 东南西北: 11, 12, 13, 14
// 中发白: 21, 22, 23
// 飞牌: 99
export function tileToCode(tile: MahjongTileData): number {
  if (tile.category === 'fei') return 99;
  if (tile.category === 'tong') return Number(tile.value);
  if (tile.category === 'wind') {
    switch (tile.value) {
      case 'east': return 11;
      case 'south': return 12;
      case 'west': return 13;
      case 'north': return 14;
    }
  }
  if (tile.category === 'dragon') {
    switch (tile.value) {
      case 'zhong': return 21;
      case 'fa': return 22;
      case 'bai': return 23;
    }
  }
  return 0;
}

export function codeToTile(code: number): MahjongTileData {
  if (code === 99) return getTileById('fei_1');
  if (code >= 1 && code <= 9) return getTileById(`tong_${code}`);
  if (code === 11) return getTileById('wind_east');
  if (code === 12) return getTileById('wind_south');
  if (code === 13) return getTileById('wind_west');
  if (code === 14) return getTileById('wind_north');
  if (code === 21) return getTileById('dragon_zhong');
  if (code === 22) return getTileById('dragon_fa');
  if (code === 23) return getTileById('dragon_bai');
  return getTileById('tong_1');
}

/**
 * 递归分解常规牌型 (顺子/刻子 + 雀头)，考虑飞牌 (百搭 99)
 */
function canFormMelds(counts: Map<number, number>, feiCount: number, neededMelds: number): boolean {
  if (neededMelds === 0) {
    // 检查是否所有牌已清空
    for (const [, cnt] of counts.entries()) {
      if (cnt > 0) return false;
    }
    return true;
  }

  // 找到当前最小的有牌的 code
  let firstCode = 0;
  for (const [code, cnt] of counts.entries()) {
    if (cnt > 0) {
      firstCode = code;
      break;
    }
  }

  if (firstCode === 0) {
    // 没有常规牌了，剩下的全用飞牌凑 (3张飞 = 1刻)
    return feiCount >= neededMelds * 3;
  }

  const currentCount = counts.get(firstCode) || 0;

  // 尝试 1: 组成刻子 (AAA)
  // 1a: 用 3 张自身
  if (currentCount >= 3) {
    counts.set(firstCode, currentCount - 3);
    if (canFormMelds(counts, feiCount, neededMelds - 1)) return true;
    counts.set(firstCode, currentCount);
  }
  // 1b: 用 2 张自身 + 1 飞
  if (currentCount >= 2 && feiCount >= 1) {
    counts.set(firstCode, currentCount - 2);
    if (canFormMelds(counts, feiCount - 1, neededMelds - 1)) return true;
    counts.set(firstCode, currentCount);
  }
  // 1c: 用 1 张自身 + 2 飞
  if (currentCount >= 1 && feiCount >= 2) {
    counts.set(firstCode, currentCount - 1);
    if (canFormMelds(counts, feiCount - 2, neededMelds - 1)) return true;
    counts.set(firstCode, currentCount);
  }

  // 尝试 2: 组成顺子 (ABC) - 仅限筒子 (1-9)
  if (firstCode >= 1 && firstCode <= 7) {
    const c1 = counts.get(firstCode) || 0;
    const c2 = counts.get(firstCode + 1) || 0;
    const c3 = counts.get(firstCode + 2) || 0;

    // 2a: 纯 ABC
    if (c1 >= 1 && c2 >= 1 && c3 >= 1) {
      counts.set(firstCode, c1 - 1);
      counts.set(firstCode + 1, c2 - 1);
      counts.set(firstCode + 2, c3 - 1);
      if (canFormMelds(counts, feiCount, neededMelds - 1)) return true;
      counts.set(firstCode, c1);
      counts.set(firstCode + 1, c2);
      counts.set(firstCode + 2, c3);
    }
    // 2b: A + B + 飞 (相当于缺 C)
    if (c1 >= 1 && c2 >= 1 && feiCount >= 1) {
      counts.set(firstCode, c1 - 1);
      counts.set(firstCode + 1, c2 - 1);
      if (canFormMelds(counts, feiCount - 1, neededMelds - 1)) return true;
      counts.set(firstCode, c1);
      counts.set(firstCode + 1, c2);
    }
    // 2c: A + 飞 + C (相当于卡张嵌张)
    if (c1 >= 1 && c3 >= 1 && feiCount >= 1) {
      counts.set(firstCode, c1 - 1);
      counts.set(firstCode + 2, c3 - 1);
      if (canFormMelds(counts, feiCount - 1, neededMelds - 1)) return true;
      counts.set(firstCode, c1);
      counts.set(firstCode + 2, c3);
    }
  }

  // 2d: A(8) + B(9) + 飞
  if (firstCode === 8) {
    const c8 = counts.get(8) || 0;
    const c9 = counts.get(9) || 0;
    if (c8 >= 1 && c9 >= 1 && feiCount >= 1) {
      counts.set(8, c8 - 1);
      counts.set(9, c9 - 1);
      if (canFormMelds(counts, feiCount - 1, neededMelds - 1)) return true;
      counts.set(8, c8);
      counts.set(9, c9);
    }
  }

  return false;
}

/**
 * 检验一手牌是否已胡牌 (考虑立牌 + 副露 + 飞牌)
 */
export function checkIsWin(handTiles: MahjongTileData[], melds: Meld[]): boolean {
  // 过滤出普通手牌与飞牌 (花牌和动物不计入14张手牌)
  const regularTiles: MahjongTileData[] = [];
  let feiCount = 0;

  for (const t of handTiles) {
    if (t.category === 'fei') {
      feiCount++;
    } else if (t.category === 'tong' || t.category === 'wind' || t.category === 'dragon') {
      regularTiles.push(t);
    }
  }

  // 大马三人麻将特殊规则：手握 4 张飞牌 (满天飞 / 全飞) 直接胡牌！
  if (feiCount >= 4) {
    return true;
  }

  const meldCount = melds.length;
  const neededMelds = 4 - meldCount;
  const expectedTotalTiles = neededMelds * 3 + 2;

  // 手牌总数检查 (立牌 + 飞牌应该等于 3*neededMelds + 2)
  if (regularTiles.length + feiCount !== expectedTotalTiles) {
    return false;
  }

  // 1. 检查特殊牌型：拉飞十三幺 (1筒、9筒、东南西北、中发白 + 飞 + 1对子)
  if (melds.length === 0 && checkThirteenOrphans(regularTiles, feiCount)) {
    return true;
  }

  // 2. 检查特殊牌型：七对子 (7 pairs)
  if (melds.length === 0 && checkSevenPairs(regularTiles, feiCount)) {
    return true;
  }

  // 3. 检查常规胡牌：4面子 + 1雀头
  // 构建牌计数 Map
  const counts = new Map<number, number>();
  // 排序 code 保证遍历有序
  const sortedCodes = regularTiles.map(tileToCode).sort((a, b) => a - b);
  for (const code of sortedCodes) {
    counts.set(code, (counts.get(code) || 0) + 1);
  }

  // 尝试每一个牌作为雀头 (Pair)
  const uniqueCodes = Array.from(counts.keys());

  // 方式 A: 用两张真实牌作为雀头
  for (const pairCode of uniqueCodes) {
    const c = counts.get(pairCode) || 0;
    if (c >= 2) {
      counts.set(pairCode, c - 2);
      if (canFormMelds(counts, feiCount, neededMelds)) {
        return true;
      }
      counts.set(pairCode, c);
    }
  }

  // 方式 B: 用一张真实牌 + 一张飞牌作为雀头
  if (feiCount >= 1) {
    for (const pairCode of uniqueCodes) {
      const c = counts.get(pairCode) || 0;
      if (c >= 1) {
        counts.set(pairCode, c - 1);
        if (canFormMelds(counts, feiCount - 1, neededMelds)) {
          return true;
        }
        counts.set(pairCode, c);
      }
    }
  }

  // 方式 C: 用两张飞牌作为雀头
  if (feiCount >= 2) {
    if (canFormMelds(counts, feiCount - 2, neededMelds)) {
      return true;
    }
  }

  return false;
}

/**
 * 检查十三幺 (Thirteen Orphans)
 */
function checkThirteenOrphans(regularTiles: MahjongTileData[], feiCount: number): boolean {
  if (regularTiles.length + feiCount !== 14) return false;

  // 十三幺的目标牌: 1筒, 9筒, 东, 南, 西, 北, 中, 发, 白 (共9种，每种至少1张，其中一种有2张)
  const targetCodes = [1, 9, 11, 12, 13, 14, 21, 22, 23];
  const countMap = new Map<number, number>();
  for (const t of regularTiles) {
    const code = tileToCode(t);
    if (!targetCodes.includes(code)) return false; // 含有非幺九字牌，不可能十三幺
    countMap.set(code, (countMap.get(code) || 0) + 1);
  }

  let missingCount = 0;
  let hasPair = false;

  for (const target of targetCodes) {
    const cnt = countMap.get(target) || 0;
    if (cnt === 0) {
      missingCount++;
    } else if (cnt >= 2) {
      hasPair = true;
    }
  }

  // 如果飞牌足够填补缺失的牌，且有多余飞或自然对子作为雀头
  let remainingFei = feiCount - missingCount;
  if (remainingFei < 0) return false;

  if (!hasPair) {
    remainingFei--; // 用飞当对子
  }

  return remainingFei >= 0;
}

/**
 * 检查七对子 (Seven Pairs)
 */
function checkSevenPairs(regularTiles: MahjongTileData[], feiCount: number): boolean {
  if (regularTiles.length + feiCount !== 14) return false;

  const countMap = new Map<number, number>();
  for (const t of regularTiles) {
    const code = tileToCode(t);
    countMap.set(code, (countMap.get(code) || 0) + 1);
  }

  let pairs = 0;
  let singles = 0;

  for (const [, cnt] of countMap.entries()) {
    pairs += Math.floor(cnt / 2);
    if (cnt % 2 === 1) {
      singles++;
    }
  }

  // 每张单牌需要 1 张飞凑成对子
  if (feiCount >= singles) {
    const extraFei = feiCount - singles;
    pairs += singles + Math.floor(extraFei / 2);
    return pairs >= 7;
  }

  return false;
}

/**
 * 听牌分析器 (当手牌为 13 张，或者打出一张后剩 13 张)
 * 遍历所有可能牌，测试加上哪张牌能胡
 */
export function findWaitingTiles(handTiles: MahjongTileData[], melds: Meld[]): MahjongTileData[] {
  const waiting: MahjongTileData[] = [];
  const testCandidates = REGULAR_WINNING_CANDIDATES;

  for (const candidate of testCandidates) {
    const testHand = [...handTiles, candidate];
    if (checkIsWin(testHand, melds)) {
      waiting.push(candidate);
    }
  }

  return waiting;
}

/**
 * 计算向听数 (Shanten) 的简易估算器
 * 0 = 听牌, 1 = 一向听, 2 = 二向听...
 */
export function estimateShanten(handTiles: MahjongTileData[], melds: Meld[]): number {
  // 如果直接能胡
  if (checkIsWin(handTiles, melds)) {
    return -1;
  }

  // 如果 13 张牌能听
  const waits = findWaitingTiles(handTiles, melds);
  if (waits.length > 0) {
    return 0; // 听牌
  }

  // 估算一向听：如果手牌有 14 张，打掉某一张后能进入听牌，则当前手牌为一向听
  if (handTiles.length === 14) {
    for (let i = 0; i < handTiles.length; i++) {
      const copy = [...handTiles];
      copy.splice(i, 1);
      const w = findWaitingTiles(copy, melds);
      if (w.length > 0) {
        return 1; // 一向听
      }
    }
  }

  // 二向听或更多
  return 2;
}

/**
 * 新手出牌建议引擎 (14张牌时推荐打哪张)
 */
export function analyzeDiscards(handTiles: MahjongTileData[], melds: Meld[]): DiscardSuggestion[] {
  if (handTiles.length !== 14) return [];

  const suggestions: DiscardSuggestion[] = [];

  // 对手牌中每一种不同的牌进行舍牌模拟
  const evaluatedMap = new Set<string>();

  for (let i = 0; i < handTiles.length; i++) {
    const tile = handTiles[i];
    if (evaluatedMap.has(tile.id)) continue;
    evaluatedMap.add(tile.id);

    // 飞牌通常绝不建议新手直接打掉！
    if (tile.category === 'fei') {
      suggestions.push({
        tile,
        tileIndex: i,
        shantenAfter: 3,
        waitingTilesCount: 0,
        potentialWaitingTiles: [],
        expectedFan: 0,
        reasonZh: '飞牌是百搭神牌，建议保留在手作为万能牌或凑番！',
        reasonEn: 'Fei is a wildcard. Never discard it casually!',
        isRecommended: false,
      });
      continue;
    }

    const handAfterDiscard = [...handTiles];
    handAfterDiscard.splice(i, 1);

    const waitingTiles = findWaitingTiles(handAfterDiscard, melds);

    if (waitingTiles.length > 0) {
      // 打掉此牌后直接进入【听牌】！
      // 估算进张数量 (通常每种牌 4 张，扣除自己手里已有的)
      let totalOuts = 0;
      for (const w of waitingTiles) {
        const inHandCount = handAfterDiscard.filter(t => t.id === w.id).length;
        totalOuts += Math.max(0, 4 - inHandCount);
      }

      suggestions.push({
        tile,
        tileIndex: i,
        shantenAfter: 0,
        waitingTilesCount: totalOuts,
        potentialWaitingTiles: waitingTiles,
        expectedFan: 6, // 预估基准
        reasonZh: `打出后立即进入听牌！叫胡【${waitingTiles.map(w => w.nameZh).join('、')}】，共约 ${totalOuts} 张机会！`,
        reasonEn: `Ting ready! Waiting for: ${waitingTiles.map(w => w.nameEn).join(', ')} (${totalOuts} outs).`,
        isRecommended: false,
      });
    } else {
      // 没能直接听牌，测试一向听有效进张
      let potentialUkeire = 0;
      for (const candidate of REGULAR_WINNING_CANDIDATES) {
        const test14 = [...handAfterDiscard, candidate];
        for (let j = 0; j < test14.length; j++) {
          const test13 = [...test14];
          test13.splice(j, 1);
          if (findWaitingTiles(test13, melds).length > 0) {
            potentialUkeire++;
            break;
          }
        }
      }

      suggestions.push({
        tile,
        tileIndex: i,
        shantenAfter: 1,
        waitingTilesCount: potentialUkeire,
        potentialWaitingTiles: [],
        expectedFan: 5,
        reasonZh: `打出后保持一向听，摸进 ${potentialUkeire} 种有效牌即可进入听牌。`,
        reasonEn: `1-away from Ting. ${potentialUkeire} tiles can advance your hand.`,
        isRecommended: false,
      });
    }
  }

  // 按照听牌状态 (shantenAfter 升序)、进张总数 (降序) 排序
  suggestions.sort((a, b) => {
    if (a.shantenAfter !== b.shantenAfter) {
      return a.shantenAfter - b.shantenAfter;
    }
    return b.waitingTilesCount - a.waitingTilesCount;
  });

  if (suggestions.length > 0) {
    suggestions[0].isRecommended = true;
  }

  return suggestions;
}

/**
 * 综合分析新手手牌状态
 */
export function getFullShantenAnalysis(handTiles: MahjongTileData[], melds: Meld[]): ShantenAnalysis {
  const isWin = checkIsWin(handTiles, melds);
  if (isWin) {
    return {
      currentShanten: -1,
      isTing: false,
      waitingTiles: [],
      discardSuggestions: [],
      statusMessageZh: '恭喜！当前手牌已经胡牌（可计算番数与账单）！',
      statusMessageEn: 'Congratulations! This hand is already a winning hand!',
    };
  }

  if (handTiles.length === 13) {
    const waits = findWaitingTiles(handTiles, melds);
    const waitingInfo: WaitingTileInfo[] = waits.map(tile => {
      const inHand = handTiles.filter(t => t.id === tile.id).length;
      return {
        tile,
        potentialFan: 5,
        remainingCount: Math.max(0, 4 - inHand),
        winReasonZh: `胡【${tile.nameZh}】`,
      };
    });

    return {
      currentShanten: waits.length > 0 ? 0 : 1,
      isTing: waits.length > 0,
      waitingTiles: waitingInfo,
      discardSuggestions: [],
      statusMessageZh: waits.length > 0
        ? `您正在听牌！在等【${waits.map(w => w.nameZh).join('、')}】胡牌！`
        : '当前手牌暂未听牌，建议摸牌后参考出牌建议。',
      statusMessageEn: waits.length > 0
        ? `You are ready to win (Ting)! Waiting for ${waits.map(w => w.nameEn).join(', ')}.`
        : 'Not yet in Ting.',
    };
  }

  if (handTiles.length === 14) {
    const discards = analyzeDiscards(handTiles, melds);
    const best = discards[0];
    return {
      currentShanten: best ? best.shantenAfter : 2,
      isTing: false,
      waitingTiles: [],
      discardSuggestions: discards,
      statusMessageZh: best && best.shantenAfter === 0
        ? `建议打出【${best.tile.nameZh}】，打出后即可听牌！`
        : '请查看下方推荐舍牌，选最佳路径胡牌。',
      statusMessageEn: best && best.shantenAfter === 0
        ? `Recommended: Discard ${best.tile.nameEn} to enter Ting!`
        : 'Review discard suggestions below.',
    };
  }

  return {
    currentShanten: 2,
    isTing: false,
    waitingTiles: [],
    discardSuggestions: [],
    statusMessageZh: `手牌目前有 ${handTiles.length} 张，请凑齐 13 张（听牌）或 14 张（出牌/胡牌）。`,
    statusMessageEn: `Currently ${handTiles.length} tiles in hand.`,
  };
}
