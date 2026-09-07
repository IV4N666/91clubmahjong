import {
  MahjongTileData,
  Meld,
  WinningConditions,
  RuleSettings,
  CalculationResult,
  FanItem,
} from '../types/mahjong';
import { isAnimalBite } from '../constants/tiles';
import { getClassicTierMultiplier } from '../constants/defaultRules';
import { checkIsWin } from './mahjongEngine';

export function calculateMahjongScore(
  handTiles: MahjongTileData[], // 手牌 (立牌 + 飞牌)
  melds: Meld[], // 碰、吃、杠
  flowerAndAnimals: MahjongTileData[], // 摸到的花牌与动物牌
  winningConditions: WinningConditions,
  rules: RuleSettings
): CalculationResult {
  const fanItems: FanItem[] = [];
  const warnings: string[] = [];

  const allHandTiles = [...handTiles];
  const isWin = checkIsWin(allHandTiles, melds);

  if (!isWin) {
    warnings.push('当前手牌未满足胡牌结构（需4组面子+1雀头，或十三幺/七对子）。');
  }

  // 1. 统计牌面特征
  const tongTiles: MahjongTileData[] = [];
  const windTiles: MahjongTileData[] = [];
  const dragonTiles: MahjongTileData[] = [];
  const feiTiles: MahjongTileData[] = [];

  // 合并手牌和副露牌以分析花色与字牌
  const allGameTiles: MahjongTileData[] = [...handTiles];
  melds.forEach(m => allGameTiles.push(...m.tiles));

  allGameTiles.forEach(t => {
    if (t.category === 'tong') tongTiles.push(t);
    else if (t.category === 'wind') windTiles.push(t);
    else if (t.category === 'dragon') dragonTiles.push(t);
    else if (t.category === 'fei') feiTiles.push(t);
  });

  const feiInHandCount = handTiles.filter(t => t.category === 'fei').length;

  // ----------------------------------------------------
  // 2. 飞牌 (百搭) 番数 / 现金
  // ----------------------------------------------------
  const isFeiCashMode = rules.feiCalculationMode === 'cash';

  if (feiInHandCount >= 4) {
    fanItems.push({
      id: 'four_fei',
      nameZh: '满天飞 (全飞胡)',
      nameEn: 'All 4 Jokers (Fei)',
      fan: rules.fourFeiWinFan,
      descriptionZh: '摸齐 4 张飞牌百搭，直接大满贯包赢！',
      descriptionEn: 'Holding all 4 Fei jokers is an instant winning hand.',
      category: 'fei',
    });
  } else if (isFeiCashMode) {
    // 飞牌不算番，直接算现金
    if (feiInHandCount > 0) {
      fanItems.push({
        id: 'fei_in_hand_cash',
        nameZh: `飞牌 (${feiInHandCount}张 - 直计现金)`,
        nameEn: `Joker Tiles (${feiInHandCount} - Direct Cash)`,
        fan: 0,
        descriptionZh: `飞牌不算番，每张直接收取现金 RM ${(rules.feiCashAmount ?? 0.50).toFixed(2)}。`,
        descriptionEn: `Fei jokers yield 0 Fan, paying RM ${(rules.feiCashAmount ?? 0.50).toFixed(2)} cash each.`,
        category: 'fei',
      });
    } else if (rules.noFeiBonusFan > 0 && isWin) {
      fanItems.push({
        id: 'no_fei',
        nameZh: '无飞 (清飞)',
        nameEn: 'Zero Jokers (Clean Hand)',
        fan: rules.noFeiBonusFan,
        descriptionZh: '手中一张飞牌都没用，纯正胡牌奖励 +1 番！',
        descriptionEn: 'Won without using any Fei jokers.',
        category: 'fei',
      });
    }
  } else {
    // 传统模式：每张飞牌 +1 番
    if (feiInHandCount > 0) {
      fanItems.push({
        id: 'fei_in_hand',
        nameZh: `飞牌 (${feiInHandCount}张)`,
        nameEn: `Joker Tiles (${feiInHandCount})`,
        fan: feiInHandCount,
        descriptionZh: `手中持飞牌，每张 +1 番。`,
        descriptionEn: `Each Fei joker in hand yields +1 Fan.`,
        category: 'fei',
      });
    } else if (rules.noFeiBonusFan > 0 && isWin) {
      fanItems.push({
        id: 'no_fei',
        nameZh: '无飞 (清飞)',
        nameEn: 'Zero Jokers (Clean Hand)',
        fan: rules.noFeiBonusFan,
        descriptionZh: '手中一张飞牌都没用，纯正胡牌奖励 +1 番！',
        descriptionEn: 'Won without using any Fei jokers.',
        category: 'fei',
      });
    }
  }

  // ----------------------------------------------------
  // 3. 基本赢牌状况番
  // ----------------------------------------------------
  if (winningConditions.isZimo) {
    fanItems.push({
      id: 'zimo',
      nameZh: '自摸',
      nameEn: 'Self-Drawn (Zimo)',
      fan: 1,
      descriptionZh: '自己摸到胡牌，额外加 1 番，且两家皆需付钱！',
      descriptionEn: 'Self-drawn winning tile (+1 Fan).',
      category: 'base',
    });
  }

  // 门清 (无副露，或全部暗杠)
  const hasExposedMelds = melds.some(m => m.type !== 'kong_concealed');
  if (!hasExposedMelds) {
    fanItems.push({
      id: 'menqing',
      nameZh: '门清',
      nameEn: 'All Concealed',
      fan: winningConditions.isZimo ? 2 : 1,
      descriptionZh: winningConditions.isZimo ? '门清自摸，胡牌极具威慑力 (+2 番)！' : '全手牌未曾吃碰露面 (+1 番)！',
      descriptionEn: 'Hand completely concealed without exposed melds.',
      category: 'base',
    });
  }

  if (winningConditions.isKongBloom) {
    fanItems.push({
      id: 'kong_bloom',
      nameZh: '杠上开花',
      nameEn: 'Kong Bloom',
      fan: 1,
      descriptionZh: '开杠补牌时摸到胡牌 (+1 番)。',
      descriptionEn: 'Winning on replacement tile after a Kong.',
      category: 'base',
    });
  }

  if (winningConditions.isRobbingKong) {
    fanItems.push({
      id: 'robbing_kong',
      nameZh: '抢杠',
      nameEn: 'Robbing the Kong',
      fan: 1,
      descriptionZh: '别家加杠时正好胡该张牌 (+1 番)。',
      descriptionEn: 'Winning by robbing an opponent’s Kong.',
      category: 'base',
    });
  }

  if (winningConditions.isLastTileDraw) {
    fanItems.push({
      id: 'last_tile_draw',
      nameZh: '海底捞月',
      nameEn: 'Last Tile Win (Draw)',
      fan: 1,
      descriptionZh: '摸到底池最后一张牌胡牌 (+1 番)。',
      descriptionEn: 'Winning on the very last tile of the wall.',
      category: 'base',
    });
  }

  if (winningConditions.isLastTileDiscard) {
    fanItems.push({
      id: 'last_tile_discard',
      nameZh: '海底捞沙',
      nameEn: 'Last Tile Win (Discard)',
      fan: 1,
      descriptionZh: '别家打出底池最后一张牌时胡牌 (+1 番)。',
      descriptionEn: 'Winning on the very last discarded tile.',
      category: 'base',
    });
  }

  // 杠牌番与即时开杠收钱
  const kongImmediateFan = rules.kongImmediateFan ?? 2;
  const kongCashPerKong = Number((rules.basePrice * kongImmediateFan).toFixed(2));

  melds.forEach(m => {
    if (m.type === 'kong_concealed') {
      const kongRewardDesc = rules.enableKongImmediateCash
        ? ` [即收${kongImmediateFan}番 RM ${kongCashPerKong.toFixed(2)}]`
        : '';
      fanItems.push({
        id: `kong_concealed_${m.id}`,
        nameZh: `暗杠 (${m.tiles[0]?.nameZh || '牌'})${kongRewardDesc}`,
        nameEn: `Concealed Kong${rules.enableKongImmediateCash ? ` (+${kongImmediateFan}F Cash)` : ''}`,
        fan: 2,
        descriptionZh: `手中摸齐 4 张自开暗杠 (+2 番)${rules.enableKongImmediateCash ? `，开杠即刻收 ${kongImmediateFan} 番现金 (RM ${kongCashPerKong.toFixed(2)})` : ''}。`,
        descriptionEn: `Concealed Kong (+2 Fan)${rules.enableKongImmediateCash ? `, instant payout ${kongImmediateFan} Fan cash (RM ${kongCashPerKong.toFixed(2)})` : ''}.`,
        category: 'base',
      });
    } else if (m.type === 'kong_exposed') {
      const kongRewardDesc = rules.enableKongImmediateCash
        ? ` [即收${kongImmediateFan}番 RM ${kongCashPerKong.toFixed(2)}]`
        : '';
      fanItems.push({
        id: `kong_exposed_${m.id}`,
        nameZh: `明杠 (${m.tiles[0]?.nameZh || '牌'})${kongRewardDesc}`,
        nameEn: `Exposed Kong${rules.enableKongImmediateCash ? ` (+${kongImmediateFan}F Cash)` : ''}`,
        fan: 1,
        descriptionZh: `开明杠/补杠 (+1 番)${rules.enableKongImmediateCash ? `，开杠即刻收 ${kongImmediateFan} 番现金 (RM ${kongCashPerKong.toFixed(2)})` : ''}。`,
        descriptionEn: `Exposed Kong (+1 Fan)${rules.enableKongImmediateCash ? `, instant payout ${kongImmediateFan} Fan cash (RM ${kongCashPerKong.toFixed(2)})` : ''}.`,
        category: 'base',
      });
    }
  });

  // ----------------------------------------------------
  // 4. 花牌与动物牌 (Malaysian Flowers & Animals)
  // ----------------------------------------------------
  const animals = flowerAndAnimals.filter(t => t.category === 'animal');
  const flowers = flowerAndAnimals.filter(t => t.category === 'flower');

  // 每只动物 +1 番
  if (animals.length > 0) {
    fanItems.push({
      id: 'animals_count',
      nameZh: `动物牌 (${animals.length}只)`,
      nameEn: `Animals (${animals.length})`,
      fan: animals.length,
      descriptionZh: `摸得【${animals.map(a => a.nameZh).join('、')}】，每只动物 +1 番。`,
      descriptionEn: `Each animal captured yields +1 Fan.`,
      category: 'flower',
    });
  }

  // 动物咬到 (咬花): 猫抓老鼠、公鸡吃蜈蚣
  let biteCount = 0;
  const hasCat = animals.some(a => a.id === 'animal_cat');
  const hasRat = animals.some(a => a.id === 'animal_rat');
  const hasRooster = animals.some(a => a.id === 'animal_rooster');
  const hasCentipede = animals.some(a => a.id === 'animal_centipede');

  if (hasCat && hasRat) {
    biteCount++;
    fanItems.push({
      id: 'bite_cat_rat',
      nameZh: '猫抓老鼠 (咬到！)',
      nameEn: 'Cat eats Rat (Bite!)',
      fan: 1,
      descriptionZh: '猫遇到老鼠天生一对咬到！加 1 番，且桌上每家需立即给现金红包！',
      descriptionEn: 'Cat pairs with Rat! +1 Fan and instant cash payout.',
      category: 'flower',
    });
  }

  if (hasRooster && hasCentipede) {
    biteCount++;
    fanItems.push({
      id: 'bite_rooster_centipede',
      nameZh: '鸡啄蜈蚣 (咬到！)',
      nameEn: 'Rooster eats Centipede (Bite!)',
      fan: 1,
      descriptionZh: '大公鸡啄蜈蚣成双成对！加 1 番，且桌上每家需立即给现金红包！',
      descriptionEn: 'Rooster pairs with Centipede! +1 Fan and instant cash payout.',
      category: 'flower',
    });
  }

  // 抓齐四兽 (4 animals)
  if (animals.length === 4) {
    fanItems.push({
      id: 'all_animals',
      nameZh: '齐抓四兽 (大满贯)',
      nameEn: 'All 4 Animals Complete',
      fan: rules.allAnimalsFan,
      descriptionZh: '猫、老鼠、公鸡、蜈蚣四神兽全部聚齐，奖励大满贯 5 番！',
      descriptionEn: 'All four animals collected (+5 Fan).',
      category: 'flower',
    });
  }

  // 花牌
  if (flowers.length > 0) {
    fanItems.push({
      id: 'flowers_count',
      nameZh: `花牌 (${flowers.length}只)`,
      nameEn: `Flowers (${flowers.length})`,
      fan: flowers.length,
      descriptionZh: `摸得【${flowers.map(f => f.nameZh).join('、')}】，共 ${flowers.length} 番。`,
      descriptionEn: `Flowers collected (${flowers.length} Fan).`,
      category: 'flower',
    });
  }

  // 一套花 (春夏秋冬 or 梅兰竹菊)
  const seasons = flowers.filter(f => ['flower_chun', 'flower_xia', 'flower_qiu', 'flower_dong'].includes(f.id));
  const plants = flowers.filter(f => ['flower_mei', 'flower_lan', 'flower_zhu', 'flower_ju'].includes(f.id));

  if (seasons.length === 4) {
    fanItems.push({
      id: 'set_seasons',
      nameZh: '一套花 (四季：春夏秋冬)',
      nameEn: 'Full Season Flowers (1-4)',
      fan: rules.flowerSetFan,
      descriptionZh: '集齐春、夏、秋、冬完整一套花 (+2 番)！',
      descriptionEn: 'Complete set of 4 seasons (+2 Fan).',
      category: 'flower',
    });
  }

  if (plants.length === 4) {
    fanItems.push({
      id: 'set_plants',
      nameZh: '一套花 (四君子：梅兰竹菊)',
      nameEn: 'Full Plant Flowers (1-4)',
      fan: rules.flowerSetFan,
      descriptionZh: '集齐梅、兰、竹、菊完整一套花 (+2 番)！',
      descriptionEn: 'Complete set of 4 plants (+2 Fan).',
      category: 'flower',
    });
  }

  // ----------------------------------------------------
  // 5. 牌型与色相 (Suits & Hand Patterns)
  // ----------------------------------------------------
  let handPatternZh = '普通胡';
  let handPatternEn = 'Regular Win';

  // 清一色 (全色 - 纯筒子，无任何风牌与三元牌)
  const hasOnlyTong = allGameTiles.every(t => t.category === 'tong' || t.category === 'fei');
  // 混一色 (半色 - 筒子 + 字牌)
  const hasTongAndHonors = tongTiles.length > 0 && (windTiles.length > 0 || dragonTiles.length > 0);

  if (hasOnlyTong && tongTiles.length >= 8) {
    handPatternZh = '清一色 (全色)';
    handPatternEn = 'Full Flush (Pure Dots)';
    fanItems.push({
      id: 'full_flush',
      nameZh: '清一色 (全色)',
      nameEn: 'Full Flush',
      fan: 4,
      descriptionZh: '整手牌全是纯筒子，无任何字牌！(+4 番)',
      descriptionEn: 'Entire hand consists solely of dots (+4 Fan).',
      category: 'suit',
    });
  } else if (hasTongAndHonors) {
    handPatternZh = '混一色 (半色)';
    handPatternEn = 'Half Flush';
    fanItems.push({
      id: 'half_flush',
      nameZh: '混一色 (半色)',
      nameEn: 'Half Flush',
      fan: 2,
      descriptionZh: '筒子牌搭配东南西北或中发白字牌 (+2 番)。',
      descriptionEn: 'Dots combined with honors (+2 Fan).',
      category: 'suit',
    });
  }

  // 碰碰胡 (All Pongs - 全部由刻子/杠子组成，无顺子)
  const hasChow = melds.some(m => m.type === 'chow');
  if (!hasChow && melds.length >= 2) {
    fanItems.push({
      id: 'all_pongs',
      nameZh: '碰碰胡 (对对胡)',
      nameEn: 'All Pongs (Triplets)',
      fan: 2,
      descriptionZh: '整手牌全由碰牌刻子与杠子组成 (+2 番)！',
      descriptionEn: 'Hand composed entirely of triplets/quads (+2 Fan).',
      category: 'suit',
    });
    if (handPatternZh === '普通胡') {
      handPatternZh = '碰碰胡';
      handPatternEn = 'All Pongs';
    }
  }

  // 大三元 / 小三元
  const zhongCount = allGameTiles.filter(t => t.id === 'dragon_zhong').length;
  const faCount = allGameTiles.filter(t => t.id === 'dragon_fa').length;
  const baiCount = allGameTiles.filter(t => t.id === 'dragon_bai').length;

  const dragonTriplets = [zhongCount >= 3, faCount >= 3, baiCount >= 3].filter(Boolean).length;
  const dragonPairs = [zhongCount >= 2, faCount >= 2, baiCount >= 2].filter(Boolean).length;

  if (dragonTriplets === 3) {
    fanItems.push({
      id: 'big_three_dragons',
      nameZh: '大三元',
      nameEn: 'Big Three Dragons',
      fan: 5,
      descriptionZh: '中、发、白三组刻子全齐，大显神通！(+5 番)',
      descriptionEn: 'Triplets of all three dragons (+5 Fan).',
      category: 'special',
    });
    handPatternZh = '大三元';
  } else if (dragonTriplets === 2 && dragonPairs === 3) {
    fanItems.push({
      id: 'little_three_dragons',
      nameZh: '小三元',
      nameEn: 'Little Three Dragons',
      fan: 3,
      descriptionZh: '两组中发白刻子加一组中发白对子雀头 (+3 番)。',
      descriptionEn: 'Two dragon triplets and one dragon pair (+3 Fan).',
      category: 'special',
    });
  } else {
    // 散的三元牌刻子：中、发、白每个刻子 +1 番
    if (zhongCount >= 3) {
      fanItems.push({ id: 'triplet_zhong', nameZh: '红中刻子', nameEn: 'Red Dragon Triplet', fan: 1, descriptionZh: '持红中刻子/杠 (+1 番)', descriptionEn: 'Red Dragon triplet (+1 Fan)', category: 'suit' });
    }
    if (faCount >= 3) {
      fanItems.push({ id: 'triplet_fa', nameZh: '发财刻子', nameEn: 'Green Dragon Triplet', fan: 1, descriptionZh: '持发财刻子/杠 (+1 番)', descriptionEn: 'Green Dragon triplet (+1 Fan)', category: 'suit' });
    }
    if (baiCount >= 3) {
      fanItems.push({ id: 'triplet_bai', nameZh: '白板刻子', nameEn: 'White Dragon Triplet', fan: 1, descriptionZh: '持白板刻子/杠 (+1 番)', descriptionEn: 'White Dragon triplet (+1 Fan)', category: 'suit' });
    }
  }

  // 门风与圈风刻子
  const seatWindId = `wind_${winningConditions.playerSeat}`;
  const roundWindId = `wind_${winningConditions.roundWind}`;
  const seatWindCount = allGameTiles.filter(t => t.id === seatWindId).length;
  const roundWindCount = allGameTiles.filter(t => t.id === roundWindId).length;

  if (seatWindCount >= 3) {
    fanItems.push({
      id: 'seat_wind',
      nameZh: '正风 / 门风刻子',
      nameEn: 'Seat Wind Triplet',
      fan: 1,
      descriptionZh: '自身座位风刻子 (+1 番)。',
      descriptionEn: 'Matching seat wind triplet (+1 Fan).',
      category: 'suit',
    });
  }

  if (roundWindCount >= 3 && seatWindId !== roundWindId) {
    fanItems.push({
      id: 'round_wind',
      nameZh: '圈风刻子',
      nameEn: 'Round Wind Triplet',
      fan: 1,
      descriptionZh: '当前圈风刻子 (+1 番)。',
      descriptionEn: 'Matching round wind triplet (+1 Fan).',
      category: 'suit',
    });
  }

  // 一条龙 (1-9 筒手牌全齐)
  const has1to9Tong = [1, 2, 3, 4, 5, 6, 7, 8, 9].every(v =>
    allGameTiles.some(t => t.category === 'tong' && t.value === v)
  );
  if (has1to9Tong) {
    fanItems.push({
      id: 'one_dragon',
      nameZh: '一条龙 (纯筒龙)',
      nameEn: 'Pure Dragon (1-9 Dots)',
      fan: 2,
      descriptionZh: '手中持有一至九筒完整连贯龙型 (+2 番)！',
      descriptionEn: 'Complete 1-9 dots sequence (+2 Fan).',
      category: 'special',
    });
  }

  // ----------------------------------------------------
  // 6. 汇总计算总番数与封顶
  // ----------------------------------------------------
  const totalFan = fanItems.reduce((sum, item) => sum + item.fan, 0);

  // 检查是否达到起胡要求
  if (totalFan < rules.minFan) {
    warnings.push(`当前只有 ${totalFan} 番，未达到本局 ${rules.minFan} 番起胡要求！`);
  }

  // 有效番数 (应用封顶)
  let effectiveFan = totalFan;
  if (rules.maxFan > 0 && effectiveFan > rules.maxFan) {
    effectiveFan = rules.maxFan;
  }

  // ----------------------------------------------------
  // 7. 结算金额计算 (Payout / RM)
  // ----------------------------------------------------
  const basePrice = rules.basePrice;
  let scorePerUnit = 0;

  if (rules.multiplierType === 'exponential') {
    // 经典翻倍：每多一番翻一倍 (例如5番=1倍, 6番=2倍, 7番=4倍, 8番=8倍...)
    const fanDiff = Math.max(0, effectiveFan - rules.minFan);
    const multiplier = Math.pow(2, fanDiff);
    scorePerUnit = Number((basePrice * multiplier).toFixed(2));
  } else if (rules.multiplierType === 'tier_classic') {
    // 经典阶梯倍数
    const multiplier = getClassicTierMultiplier(effectiveFan);
    scorePerUnit = Number((basePrice * multiplier).toFixed(2));
  } else if (rules.multiplierType === 'custom') {
    // 自定义表格
    const matchedTier = rules.customTierTable.find(t => t.fan === effectiveFan);
    if (matchedTier) {
      scorePerUnit = matchedTier.amount;
    } else {
      scorePerUnit = Number((basePrice * Math.max(1, effectiveFan - rules.minFan + 1)).toFixed(2));
    }
  }

  // 额外即时现金结算：动物咬到、飞牌直接算现金、开杠即时收钱
  const biteCashTotal = rules.enableAnimalBiteBonus ? biteCount * rules.animalBiteCashAmount : 0;
  
  // 飞牌现金 (若开启飞牌不算番、直接算钱模式)
  const feiCashTotal = isFeiCashMode ? Number((feiInHandCount * (rules.feiCashAmount ?? 0.50)).toFixed(2)) : 0;
  
  // 开杠即时收钱 (若开启开杠即时收钱，每组收 N 番钱)
  const exposedKongCount = melds.filter(m => m.type === 'kong_exposed').length;
  const concealedKongCount = melds.filter(m => m.type === 'kong_concealed').length;
  const totalKongCount = exposedKongCount + concealedKongCount;
  const kongCashTotal = rules.enableKongImmediateCash
    ? Number((totalKongCount * kongCashPerKong).toFixed(2))
    : 0;

  // 每位闲家额外需付的现金总和
  const extraBountiesPerPlayer = Number((biteCashTotal + feiCashTotal + kongCashTotal).toFixed(2));

  let shooterPays = 0;
  let eachPayIfZimo = 0;
  let winnerReceivedTotal = 0;

  if (winningConditions.isZimo) {
    // 自摸：另外两家每个人都要付出 scorePerUnit + extraBountiesPerPlayer
    eachPayIfZimo = Number((scorePerUnit + extraBountiesPerPlayer).toFixed(2));
    winnerReceivedTotal = Number((eachPayIfZimo * 2).toFixed(2));
  } else {
    // 出冲 (放铳)
    if (rules.shooterPaysAll) {
      // 出冲者一人包全家 (赔两份番数钱 + 两份额外即时现金)
      shooterPays = Number((scorePerUnit * 2 + extraBountiesPerPlayer * 2).toFixed(2));
      winnerReceivedTotal = shooterPays;
    } else {
      // 仅放铳者付一份番数钱 + 两份额外即时现金
      shooterPays = Number((scorePerUnit + extraBountiesPerPlayer * 2).toFixed(2));
      winnerReceivedTotal = shooterPays;
    }
  }

  // 拼接清晰的结算说明文字
  const bonusItems: string[] = [];
  if (biteCashTotal > 0) bonusItems.push(`咬花 RM ${(biteCashTotal * 2).toFixed(2)}`);
  if (feiCashTotal > 0) bonusItems.push(`飞牌${feiInHandCount}张 RM ${(feiCashTotal * 2).toFixed(2)}`);
  if (kongCashTotal > 0) bonusItems.push(`开杠${totalKongCount}组(${kongImmediateFan}番) RM ${(kongCashTotal * 2).toFixed(2)}`);
  const bonusNote = bonusItems.length > 0 ? `（含额外即时现金：${bonusItems.join('、')}）` : '';

  let ruleSummary = '';
  if (winningConditions.isZimo) {
    ruleSummary = `自摸 ${effectiveFan} 番（底 RM ${basePrice.toFixed(2)}）：两家各付 RM ${eachPayIfZimo.toFixed(2)}，赢家总收 RM ${winnerReceivedTotal.toFixed(2)}${bonusNote}。`;
  } else {
    ruleSummary = `出冲 ${effectiveFan} 番：放炮者${rules.shooterPaysAll ? '一人包赔' : '出冲'}付 RM ${shooterPays.toFixed(2)}${bonusNote}。`;
  }

  return {
    isWin,
    totalFan,
    effectiveFan,
    fanItems,
    payout: {
      basePrice,
      winnerReceivedTotal,
      shooterPays,
      eachPayIfZimo,
      biteBonusEarned: Number((biteCashTotal * 2).toFixed(2)),
      feiCashEarned: Number((feiCashTotal * 2).toFixed(2)),
      kongCashEarned: Number((kongCashTotal * 2).toFixed(2)),
      ruleSummary,
    },
    handPatternNameZh: handPatternZh,
    handPatternNameEn: handPatternEn,
    warnings,
  };
}
