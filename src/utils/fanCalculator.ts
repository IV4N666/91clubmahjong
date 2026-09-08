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
import {
  checkIsWin,
  checkNineGates,
  checkThirteenOrphans,
  checkSevenPairs,
  checkIsAllPongs,
  checkAllHonors,
  checkBigFourWinds,
  checkLittleFourWinds,
  checkPureAllChows,
  checkYaoJiu,
  checkDaDongNanXi,
  checkXiaoDongNanXi,
} from './mahjongEngine';

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
  const isWin = checkIsWin(allHandTiles, melds, rules);

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

  if ((rules.enableFourFeiWin ?? true) && feiInHandCount >= 4) {
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
    } else if ((rules.enableNoFeiBonus ?? true) && rules.noFeiBonusFan > 0 && isWin) {
      fanItems.push({
        id: 'no_fei',
        nameZh: '无飞 (清飞)',
        nameEn: 'Zero Jokers (Clean Hand)',
        fan: rules.noFeiBonusFan,
        descriptionZh: `手中一张飞牌都没用，纯正胡牌奖励 +${rules.noFeiBonusFan} 番！`,
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
    } else if ((rules.enableNoFeiBonus ?? true) && rules.noFeiBonusFan > 0 && isWin) {
      fanItems.push({
        id: 'no_fei',
        nameZh: '无飞 (清飞)',
        nameEn: 'Zero Jokers (Clean Hand)',
        fan: rules.noFeiBonusFan,
        descriptionZh: `手中一张飞牌都没用，纯正胡牌奖励 +${rules.noFeiBonusFan} 番！`,
        descriptionEn: 'Won without using any Fei jokers.',
        category: 'fei',
      });
    }
  }

  // ----------------------------------------------------
  // 3. 基本赢牌状况番
  // ----------------------------------------------------
  if ((rules.enableZimoBonus ?? true) && winningConditions.isZimo) {
    const zimoFan = rules.zimoFan ?? 1;
    fanItems.push({
      id: 'zimo',
      nameZh: '自摸',
      nameEn: 'Self-Drawn (Zimo)',
      fan: zimoFan,
      descriptionZh: `自己摸到胡牌，额外加 ${zimoFan} 番，且两家皆需付钱！`,
      descriptionEn: `Self-drawn winning tile (+${zimoFan} Fan).`,
      category: 'base',
    });
  }

  // 门清 (无副露，或全部暗杠)
  const hasExposedMelds = melds.some(m => m.type !== 'kong_concealed');
  const baseMenqingFan = rules.menqingFan ?? 1;
  if ((rules.enableMenqing ?? true) && !hasExposedMelds && baseMenqingFan > 0) {
    const finalMenqingFan = winningConditions.isZimo ? baseMenqingFan + 1 : baseMenqingFan;
    fanItems.push({
      id: 'menqing',
      nameZh: '门清',
      nameEn: 'All Concealed',
      fan: finalMenqingFan,
      descriptionZh: winningConditions.isZimo
        ? `门清自摸，胡牌极具威慑力 (+${finalMenqingFan} 番)！`
        : `全手牌未曾吃碰露面 (+${finalMenqingFan} 番)！`,
      descriptionEn: `Hand completely concealed without exposed melds (+${finalMenqingFan} Fan).`,
      category: 'base',
    });
  }

  if ((rules.enableKongBloom ?? true) && winningConditions.isKongBloom) {
    const kongBloomFan = rules.kongBloomFan ?? 1;
    fanItems.push({
      id: 'kong_bloom',
      nameZh: '杠上开花',
      nameEn: 'Kong Bloom',
      fan: kongBloomFan,
      descriptionZh: `开杠补牌时摸到胡牌 (+${kongBloomFan} 番)。`,
      descriptionEn: `Winning on replacement tile after a Kong (+${kongBloomFan} Fan).`,
      category: 'base',
    });
  }

  if ((rules.enableRobbingKong ?? true) && winningConditions.isRobbingKong) {
    const robbingKongFan = rules.robbingKongFan ?? 1;
    fanItems.push({
      id: 'robbing_kong',
      nameZh: '抢杠',
      nameEn: 'Robbing the Kong',
      fan: robbingKongFan,
      descriptionZh: `别家加杠时正好胡该张牌 (+${robbingKongFan} 番)。`,
      descriptionEn: `Winning by robbing an opponent’s Kong (+${robbingKongFan} Fan).`,
      category: 'base',
    });
  }

  if ((rules.enableLastTile ?? true) && winningConditions.isLastTileDraw) {
    const lastTileFan = rules.lastTileFan ?? 1;
    fanItems.push({
      id: 'last_tile_draw',
      nameZh: '海底捞月',
      nameEn: 'Last Tile Win (Draw)',
      fan: lastTileFan,
      descriptionZh: `摸到底池最后一张牌胡牌 (+${lastTileFan} 番)。`,
      descriptionEn: `Winning on the very last tile of the wall (+${lastTileFan} Fan).`,
      category: 'base',
    });
  }

  if ((rules.enableLastTile ?? true) && winningConditions.isLastTileDiscard) {
    const lastTileFan = rules.lastTileFan ?? 1;
    fanItems.push({
      id: 'last_tile_discard',
      nameZh: '海底捞沙',
      nameEn: 'Last Tile Win (Discard)',
      fan: lastTileFan,
      descriptionZh: `别家打出底池最后一张牌时胡牌 (+${lastTileFan} 番)。`,
      descriptionEn: `Winning on the very last discarded tile (+${lastTileFan} Fan).`,
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
  // 4. 花牌、动物牌与人头牌 (Flowers, Animals & Face Tiles)
  // ----------------------------------------------------
  const animals = flowerAndAnimals.filter(t => t.category === 'animal');
  const flowers = flowerAndAnimals.filter(t => t.category === 'flower');
  const faces = flowerAndAnimals.filter(t => t.category === 'face');

  // 小丑牌 (Joker 每张计一番，大马三人麻将标准规则)
  if (faces.length > 0) {
    const faceFan = (rules.faceTileFan ?? 1) * faces.length;
    fanItems.push({
      id: 'faces_count',
      nameZh: `小丑牌 (${faces.length}张 Joker)`,
      nameEn: `Joker Tiles (${faces.length})`,
      fan: faceFan,
      descriptionZh: `摸得【${faces.map(f => f.nameZh).join('、')}】，每张 Joker 牌计 ${rules.faceTileFan ?? 1} 番。`,
      descriptionEn: `Joker bonus tiles captured (+${faceFan} Fan).`,
      category: 'flower',
    });
  }

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

  // 关键修复：只有在勾选 enableAnimalBiteBonus 规则时，才计算咬到番数和即时现金！
  if (rules.enableAnimalBiteBonus) {
    const biteFan = rules.animalBiteFan ?? 1;
    if (hasCat && hasRat) {
      biteCount++;
      if (biteFan > 0) {
        fanItems.push({
          id: 'bite_cat_rat',
          nameZh: '猫抓老鼠 (咬到！)',
          nameEn: 'Cat eats Rat (Bite!)',
          fan: biteFan,
          descriptionZh: `猫遇到老鼠天生一对咬到！加 ${biteFan} 番，且桌上每家需立即给现金红包！`,
          descriptionEn: `Cat pairs with Rat! +${biteFan} Fan and instant cash payout.`,
          category: 'flower',
        });
      }
    }

    if (hasRooster && hasCentipede) {
      biteCount++;
      if (biteFan > 0) {
        fanItems.push({
          id: 'bite_rooster_centipede',
          nameZh: '鸡啄蜈蚣 (咬到！)',
          nameEn: 'Rooster eats Centipede (Bite!)',
          fan: biteFan,
          descriptionZh: `大公鸡啄蜈蚣成双成对！加 ${biteFan} 番，且桌上每家需立即给现金红包！`,
          descriptionEn: `Rooster pairs with Centipede! +${biteFan} Fan and instant cash payout.`,
          category: 'flower',
        });
      }
    }
  }

  // 抓齐四兽 (4 animals)
  if ((rules.enableAllAnimals ?? true) && animals.length === 4) {
    fanItems.push({
      id: 'all_animals',
      nameZh: '齐抓四兽 (大满贯)',
      nameEn: 'All 4 Animals Complete',
      fan: rules.allAnimalsFan,
      descriptionZh: `猫、老鼠、公鸡、蜈蚣四神兽全部聚齐，奖励大满贯 ${rules.allAnimalsFan} 番！`,
      descriptionEn: `All four animals collected (+${rules.allAnimalsFan} Fan).`,
      category: 'flower',
    });
  }

  // 花牌计番：支持维基百科正统门风花 (seat_matching) 与 休闲规则摸花全计番 (all_flowers)
  if (flowers.length > 0) {
    if (rules.flowerScoringMode === 'seat_matching') {
      const seat = winningConditions.playerSeat || 'east';
      const scoringFlowers: MahjongTileData[] = [];
      const nonScoringFlowers: MahjongTileData[] = [];

      flowers.forEach(f => {
        const num = f.flowerNumber;
        if (num === 4) {
          // 4号冬/竹等于北，由于三人麻将无北位玩家，任何玩家获得均计一番
          scoringFlowers.push(f);
        } else if (num === 1 && seat === 'east') {
          scoringFlowers.push(f);
        } else if (num === 2 && seat === 'south') {
          scoringFlowers.push(f);
        } else if (num === 3 && seat === 'west') {
          scoringFlowers.push(f);
        } else {
          nonScoringFlowers.push(f);
        }
      });

      if (scoringFlowers.length > 0) {
        fanItems.push({
          id: 'flowers_seat_matching',
          nameZh: `门风花牌 (${scoringFlowers.length}只)`,
          nameEn: `Seat Flowers (${scoringFlowers.length})`,
          fan: scoringFlowers.length,
          descriptionZh: `吻合门风花牌【${scoringFlowers.map(f => f.nameZh).join('、')}】（1春梅=东、2夏兰=南、3秋菊=西、4冬竹=任何玩家），计 ${scoringFlowers.length} 番（维基百科标准）。${nonScoringFlowers.length > 0 ? ` [非本门花：${nonScoringFlowers.map(f => f.nameZh).join('、')}不计番]` : ''}`,
          descriptionEn: `Seat matching flowers (+${scoringFlowers.length} Fan).`,
          category: 'flower',
        });
      }
    } else {
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
  }

  // 一套花 (春夏秋冬 or 梅兰竹菊)
  const seasons = flowers.filter(f => ['flower_chun', 'flower_xia', 'flower_qiu', 'flower_dong'].includes(f.id));
  const plants = flowers.filter(f => ['flower_mei', 'flower_lan', 'flower_zhu', 'flower_ju'].includes(f.id));

  if ((rules.enableFlowerSet ?? true) && seasons.length === 4) {
    fanItems.push({
      id: 'set_seasons',
      nameZh: '一套花 (四季：春夏秋冬)',
      nameEn: 'Full Season Flowers (1-4)',
      fan: rules.flowerSetFan,
      descriptionZh: `集齐春、夏、秋、冬完整一套花 (+${rules.flowerSetFan} 番，维基百科标准4番)！`,
      descriptionEn: `Complete set of 4 seasons (+${rules.flowerSetFan} Fan).`,
      category: 'flower',
    });
  }

  if ((rules.enableFlowerSet ?? true) && plants.length === 4) {
    fanItems.push({
      id: 'set_plants',
      nameZh: '一套花 (四君子：梅兰竹菊)',
      nameEn: 'Full Plant Flowers (1-4)',
      fan: rules.flowerSetFan,
      descriptionZh: `集齐梅、兰、竹、菊完整一套花 (+${rules.flowerSetFan} 番，维基百科标准4番)！`,
      descriptionEn: `Complete set of 4 plants (+${rules.flowerSetFan} Fan).`,
      category: 'flower',
    });
  }

  // 花胡 (八仙过海 / All 8 Flowers - 维基百科爆番 10 番)
  if ((rules.enableFlowerHu ?? true) && seasons.length === 4 && plants.length === 4 && isWin) {
    const flowerHuFan = rules.flowerHuFan ?? 10;
    fanItems.push({
      id: 'flower_hu',
      nameZh: '花胡 (八仙过海 / 爆番)',
      nameEn: 'All 8 Flowers (Flower Hu)',
      fan: flowerHuFan,
      descriptionZh: `起手拿齐八张春夏秋冬梅兰竹菊，达成大马三人麻将花胡爆番 (+${flowerHuFan} 番)！`,
      descriptionEn: `Captured all 8 flowers (Spring, Summer, Autumn, Winter, Plum, Orchid, Bamboo, Chrysanthemum) (+${flowerHuFan} Fan).`,
      category: 'flower',
    });
  }

  // 无花 (清花爆番 / 满胡 - No flowers / seasons / faces / animals)
  // 维基百科大马三人麻将标准规则：No flowers / seasons / faces / animals: 10 番 (爆番 / 满胡)
  const hasNoBonusTiles = flowerAndAnimals.length === 0;
  if ((rules.enableNoFlowerBaoFan ?? true) && hasNoBonusTiles && isWin) {
    const noFlowerFan = rules.noFlowerBaoFan ?? 10;
    fanItems.push({
      id: 'no_flowers',
      nameZh: '无花 (爆番)',
      nameEn: 'No Flowers (Limit Hand)',
      fan: noFlowerFan,
      descriptionZh: `整局未摸任何花牌、动物牌与人头牌，达成经典无花爆番（维基百科标准：直接满胡 +${noFlowerFan} 番）！`,
      descriptionEn: `Won without any flowers, seasons, faces, or animals (Wikipedia Limit Hand: +${noFlowerFan} Fan).`,
      category: 'flower',
    });
  }

  // ----------------------------------------------------
  // 5. 牌型与色相 (Suits & Hand Patterns)
  // ----------------------------------------------------
  let handPatternZh = '普通胡';
  let handPatternEn = 'Regular Win';

  if ((rules.enableNoFlowerBaoFan ?? true) && hasNoBonusTiles && isWin) {
    handPatternZh = '无花爆番';
    handPatternEn = 'No Flowers (Limit Hand)';
  }

  // 清一色 (全色 - 纯筒子，无任何风牌与三元牌)
  const hasOnlyTong = allGameTiles.every(t => t.category === 'tong' || t.category === 'fei');
  // 混一色 (半色 - 筒子 + 字牌)
  const hasTongAndHonors = tongTiles.length > 0 && (windTiles.length > 0 || dragonTiles.length > 0);

  const fullFlushFan = rules.fullFlushFan ?? 4;
  const halfFlushFan = rules.halfFlushFan ?? 2;

  if ((rules.enableFullFlush ?? true) && hasOnlyTong && tongTiles.length >= 8) {
    handPatternZh = '清一色 (全色)';
    handPatternEn = 'Full Flush (Pure Dots)';
    fanItems.push({
      id: 'full_flush',
      nameZh: '清一色 (全色)',
      nameEn: 'Full Flush',
      fan: fullFlushFan,
      descriptionZh: `整手牌全是纯筒子，无任何字牌！(+${fullFlushFan} 番)`,
      descriptionEn: `Entire hand consists solely of dots (+${fullFlushFan} Fan).`,
      category: 'suit',
    });
  } else if ((rules.enableHalfFlush ?? true) && hasTongAndHonors) {
    handPatternZh = '混一色 (半色)';
    handPatternEn = 'Half Flush';
    fanItems.push({
      id: 'half_flush',
      nameZh: '混一色 (半色)',
      nameEn: 'Half Flush',
      fan: halfFlushFan,
      descriptionZh: `筒子牌搭配东南西北或中发白字牌 (+${halfFlushFan} 番)。`,
      descriptionEn: `Dots combined with honors (+${halfFlushFan} Fan).`,
      category: 'suit',
    });
  }

  // 九莲宝灯 (Nine Gates / 九子连环 - 门清特殊牌型)
  const nonFeiHandTiles = handTiles.filter(t => t.category !== 'fei');
  const nineGatesCheck = checkNineGates(nonFeiHandTiles, feiInHandCount);
  if ((rules.enableNineGates ?? true) && melds.length === 0 && nineGatesCheck.isNineGates) {
    const nineGatesFan = rules.nineGatesFan ?? 10;
    const isPure = nineGatesCheck.isPure;
    fanItems.push({
      id: 'nine_gates',
      nameZh: isPure ? '纯正九莲宝灯 (爆番)' : '九莲宝灯 (九子连环)',
      nameEn: isPure ? 'Pure Nine Gates (Max Fan)' : 'Nine Gates (Chuuren Poutou)',
      fan: nineGatesFan,
      descriptionZh: isPure
        ? `门清纯正无飞 1112345678999 绝世九子连环，大马三人麻将直接满胡爆番 (+${nineGatesFan} 番)！`
        : `门清纯筒子 1112345678999 达成九莲宝灯 (+${nineGatesFan} 番)！`,
      descriptionEn: `Nine Gates special limit hand pattern (+${nineGatesFan} Fan).`,
      category: 'special',
    });
    handPatternZh = isPure ? '纯正九莲宝灯' : '九莲宝灯';
    handPatternEn = isPure ? 'Pure Nine Gates' : 'Nine Gates';
  }

  // 十三幺 (Thirteen Orphans - 门清特殊牌型)
  if ((rules.enableThirteenOrphans ?? true) && melds.length === 0 && checkThirteenOrphans(nonFeiHandTiles, feiInHandCount)) {
    const thirteenOrphansFan = rules.thirteenOrphansFan ?? 10;
    fanItems.push({
      id: 'thirteen_orphans',
      nameZh: '十三幺 (国士无双)',
      nameEn: 'Thirteen Orphans',
      fan: thirteenOrphansFan,
      descriptionZh: `1筒、9筒、东南西北、中发白聚齐，绝世十三幺 (+${thirteenOrphansFan} 番)！`,
      descriptionEn: `Thirteen Orphans special hand pattern (+${thirteenOrphansFan} Fan).`,
      category: 'special',
    });
    handPatternZh = '十三幺';
    handPatternEn = 'Thirteen Orphans';
  }

  // 七对子 (Seven Pairs - 门清特殊牌型)
  if ((rules.enableSevenPairs ?? true) && melds.length === 0 && checkSevenPairs(nonFeiHandTiles, feiInHandCount)) {
    const sevenPairsFan = rules.sevenPairsFan ?? 5;
    fanItems.push({
      id: 'seven_pairs',
      nameZh: '七对子 (小七对)',
      nameEn: 'Seven Pairs',
      fan: sevenPairsFan,
      descriptionZh: `门清手牌由 7 个对子组成 (+${sevenPairsFan} 番)！`,
      descriptionEn: `Hand consisting of seven pairs (+${sevenPairsFan} Fan).`,
      category: 'special',
    });
    if (handPatternZh === '普通胡') {
      handPatternZh = '七对子';
      handPatternEn = 'Seven Pairs';
    }
  }

  // 天胡 / 地胡 (维基百科 10 番爆番)
  if ((rules.enableTianHuDiHu ?? true) && winningConditions.isTianHu && isWin) {
    const tianHuFan = rules.tianHuFan ?? 10;
    fanItems.push({
      id: 'tian_hu',
      nameZh: '天胡 (爆番)',
      nameEn: 'Heavenly Hand (Tian Hu)',
      fan: tianHuFan,
      descriptionZh: `庄家起手配牌即成胡，神乎其技天胡爆番 (+${tianHuFan} 番)！`,
      descriptionEn: `Dealer wins on the initial deal (+${tianHuFan} Fan).`,
      category: 'special',
    });
    handPatternZh = '天胡';
    handPatternEn = 'Heavenly Hand';
  } else if ((rules.enableTianHuDiHu ?? true) && winningConditions.isDiHu && isWin) {
    const diHuFan = rules.diHuFan ?? 10;
    fanItems.push({
      id: 'di_hu',
      nameZh: '地胡 (爆番)',
      nameEn: 'Earthly Hand (Di Hu)',
      fan: diHuFan,
      descriptionZh: `闲家在第一巡自摸或起手听牌吃胡，地胡爆番 (+${diHuFan} 番)！`,
      descriptionEn: `Non-dealer wins on the first drawn tile (+${diHuFan} Fan).`,
      category: 'special',
    });
    handPatternZh = '地胡';
    handPatternEn = 'Earthly Hand';
  }

  // 全字牌 / 全大炮 (All Honours - 维基百科 10 番爆番)
  if ((rules.enableAllHonors ?? true) && isWin && checkAllHonors(handTiles, melds)) {
    const allHonorsFan = rules.allHonorsFan ?? 10;
    fanItems.push({
      id: 'all_honors',
      nameZh: '全字牌 (全大炮 / 爆番)',
      nameEn: 'All Honours (Tsuuiisou)',
      fan: allHonorsFan,
      descriptionZh: `整副牌全是字牌（东南西北、中发白），大马维基百科经典爆番 (+${allHonorsFan} 番)！`,
      descriptionEn: `Entire hand composed solely of honour tiles (+${allHonorsFan} Fan).`,
      category: 'special',
    });
    handPatternZh = '全字牌 (全大炮)';
    handPatternEn = 'All Honours';
  }

  // 大四喜 / 小四喜 (Big & Little Four Winds - 维基百科 10 番爆番)
  if ((rules.enableBigFourWinds ?? true) && isWin && checkBigFourWinds(handTiles, melds)) {
    const bigFourWindsFan = rules.bigFourWindsFan ?? 10;
    fanItems.push({
      id: 'big_four_winds',
      nameZh: '大四喜 (爆番)',
      nameEn: 'Big Four Winds',
      fan: bigFourWindsFan,
      descriptionZh: `东南西北四组风牌刻子全齐，大四喜大满贯爆番 (+${bigFourWindsFan} 番)！`,
      descriptionEn: `Triplets of all four winds (+${bigFourWindsFan} Fan).`,
      category: 'special',
    });
    handPatternZh = '大四喜';
    handPatternEn = 'Big Four Winds';
  } else if ((rules.enableLittleFourWinds ?? true) && isWin && checkLittleFourWinds(handTiles, melds)) {
    const littleFourWindsFan = rules.littleFourWindsFan ?? 10;
    fanItems.push({
      id: 'little_four_winds',
      nameZh: '小四喜 (爆番)',
      nameEn: 'Little Four Winds',
      fan: littleFourWindsFan,
      descriptionZh: `三组风牌刻子加一组风牌对子，大马维基百科爆番 (+${littleFourWindsFan} 番)！`,
      descriptionEn: `Three wind triplets and one wind pair (+${littleFourWindsFan} Fan).`,
      category: 'special',
    });
    if (handPatternZh === '普通胡') {
      handPatternZh = '小四喜';
      handPatternEn = 'Little Four Winds';
    }
  } else if ((rules.enableDaDongNanXi ?? true) && isWin && checkDaDongNanXi(handTiles, melds)) {
    // 大东南西 (除了北风外的三组风牌刻子)
    const daDongNanXiFan = rules.daDongNanXiFan ?? 5;
    fanItems.push({
      id: 'da_dong_nan_xi',
      nameZh: '大东南西',
      nameEn: 'Big Three Winds (East South West)',
      fan: daDongNanXiFan,
      descriptionZh: `集结东、南、西三组风牌刻子 (+${daDongNanXiFan} 番，维基百科常见自定义规则)！`,
      descriptionEn: `Three triplets of East, South, and West winds (+${daDongNanXiFan} Fan).`,
      category: 'special',
    });
  } else if ((rules.enableXiaoDongNanXi ?? true) && isWin && checkXiaoDongNanXi(handTiles, melds)) {
    // 小东南西 (除了北风外的两组风牌刻子 + 一组雀头)
    const xiaoDongNanXiFan = rules.xiaoDongNanXiFan ?? 3;
    fanItems.push({
      id: 'xiao_dong_nan_xi',
      nameZh: '小东南西',
      nameEn: 'Little Three Winds (East South West)',
      fan: xiaoDongNanXiFan,
      descriptionZh: `集结东、南、西中两组风牌刻子加一组对子雀头 (+${xiaoDongNanXiFan} 番)！`,
      descriptionEn: `Two triplets and one pair of East, South, and West winds (+${xiaoDongNanXiFan} Fan).`,
      category: 'special',
    });
  }

  // 十八罗汉 (四个杠胡牌 - 维基百科 10 番爆番)
  const totalKongsCount = melds.filter(m => m.type === 'kong_exposed' || m.type === 'kong_concealed').length;
  if ((rules.enableFourKongs ?? true) && isWin && totalKongsCount === 4) {
    const fourKongsFan = rules.fourKongsFan ?? 10;
    fanItems.push({
      id: 'four_kongs',
      nameZh: '十八罗汉 (四杠胡牌 / 爆番)',
      nameEn: 'Four Kongs (Eighteen Luohan)',
      fan: fourKongsFan,
      descriptionZh: `一人开出 4 组杠牌胡牌，大马维基百科满胡爆番 (+${fourKongsFan} 番)！`,
      descriptionEn: `Winning hand composed of 4 Kongs (+${fourKongsFan} Fan).`,
      category: 'special',
    });
    handPatternZh = '十八罗汉';
    handPatternEn = 'Four Kongs';
  }

  // 坎坎胡 (四暗刻 - 维基百科 10 番爆番，门清靠自摸摸齐4组暗刻)
  if ((rules.enableFourConcealedPungs ?? true) && isWin && melds.length === 0 && winningConditions.isZimo && checkIsAllPongs(allHandTiles, melds)) {
    const fourConcealedPungsFan = rules.fourConcealedPungsFan ?? 10;
    fanItems.push({
      id: 'four_concealed_pungs',
      nameZh: '坎坎胡 (四暗刻 / 爆番)',
      nameEn: 'Four Concealed Triplets',
      fan: fourConcealedPungsFan,
      descriptionZh: `门清全靠自摸摸齐 4 组暗刻，大马维基百科经典爆番 (+${fourConcealedPungsFan} 番)！`,
      descriptionEn: `Four concealed triplets won by self-draw (+${fourConcealedPungsFan} Fan).`,
      category: 'special',
    });
    handPatternZh = '坎坎胡 (四暗刻)';
    handPatternEn = 'Four Concealed Triplets';
  }

  // 全筒子平胡 (四组顺子纯筒子 - 维基百科 4 番：全筒子3番 + 平和1番)
  if ((rules.enablePureAllChows ?? true) && isWin && checkPureAllChows(handTiles, melds)) {
    const pureAllChowsFan = rules.pureAllChowsFan ?? 4;
    fanItems.push({
      id: 'pure_all_chows',
      nameZh: '全筒子平胡 (清平胡)',
      nameEn: 'Pure Dots All Chows',
      fan: pureAllChowsFan,
      descriptionZh: `四组纯筒子顺子加一对筒子眼：全筒子(3番) + 平和(1番) = 4番（维基百科标准牌型）！`,
      descriptionEn: `All chows in pure dots suit (+${pureAllChowsFan} Fan).`,
      category: 'special',
    });
    if (handPatternZh === '普通胡') {
      handPatternZh = '全筒子平胡';
      handPatternEn = 'Pure Dots All Chows';
    }
  }

  // 碰碰胡 (All Pongs - 全部由刻子/杠子组成，无顺子)
  const hasChow = melds.some(m => m.type === 'chow');
  const isAllPongs = checkIsAllPongs(allHandTiles, melds) || (!hasChow && melds.length >= 2);
  const allPongsFan = rules.allPongsFan ?? 2;
  if ((rules.enableAllPongs ?? true) && isAllPongs) {
    fanItems.push({
      id: 'all_pongs',
      nameZh: '碰碰胡 (对对胡)',
      nameEn: 'All Pongs (Triplets)',
      fan: allPongsFan,
      descriptionZh: `整手牌全由碰牌刻子与杠子组成 (+${allPongsFan} 番)！`,
      descriptionEn: `Hand composed entirely of triplets/quads (+${allPongsFan} Fan).`,
      category: 'suit',
    });
    if (handPatternZh === '普通胡') {
      handPatternZh = '碰碰胡';
      handPatternEn = 'All Pongs';
    }
  }

  // 幺九 (混幺九 - 维基百科 +1 番：对对胡全由1筒、9筒与字牌组成)
  if ((rules.enableYaoJiu ?? true) && isWin && checkYaoJiu(handTiles, melds)) {
    const yaoJiuFan = rules.yaoJiuFan ?? 1;
    fanItems.push({
      id: 'yao_jiu',
      nameZh: '幺九 (混幺九)',
      nameEn: 'All Terminals & Honours',
      fan: yaoJiuFan,
      descriptionZh: `对对胡牌型全由一筒、九筒与字牌组成，额外加 ${yaoJiuFan} 番（维基百科标准）。`,
      descriptionEn: `All triplets made of 1, 9, or honours (+${yaoJiuFan} Fan).`,
      category: 'suit',
    });
  }

  // 大三元 / 小三元 (维基百科：大三元为 10 番爆番牌型)
  const zhongCount = allGameTiles.filter(t => t.id === 'dragon_zhong').length;
  const faCount = allGameTiles.filter(t => t.id === 'dragon_fa').length;
  const baiCount = allGameTiles.filter(t => t.id === 'dragon_bai').length;

  const dragonTriplets = [zhongCount >= 3, faCount >= 3, baiCount >= 3].filter(Boolean).length;
  const dragonPairs = [zhongCount >= 2, faCount >= 2, baiCount >= 2].filter(Boolean).length;

  const bigThreeDragonsFan = rules.bigThreeDragonsFan ?? 10;
  const smallThreeDragonsFan = rules.smallThreeDragonsFan ?? 3;

  if ((rules.enableBigThreeDragons ?? true) && dragonTriplets === 3) {
    fanItems.push({
      id: 'big_three_dragons',
      nameZh: '大三元 (爆番)',
      nameEn: 'Big Three Dragons',
      fan: bigThreeDragonsFan,
      descriptionZh: `红中、发财、白板三组刻子全齐，大马维基百科满胡爆番 (+${bigThreeDragonsFan} 番)！`,
      descriptionEn: `Triplets of all three dragons (+${bigThreeDragonsFan} Fan).`,
      category: 'special',
    });
    handPatternZh = '大三元';
  } else if ((rules.enableSmallThreeDragons ?? true) && dragonTriplets === 2 && dragonPairs === 3) {
    fanItems.push({
      id: 'little_three_dragons',
      nameZh: '小三元',
      nameEn: 'Little Three Dragons',
      fan: smallThreeDragonsFan,
      descriptionZh: `两组中发白刻子加一组中发白对子雀头 (+${smallThreeDragonsFan} 番)。`,
      descriptionEn: `Two dragon triplets and one dragon pair (+${smallThreeDragonsFan} Fan).`,
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

  // 门风与圈风刻子 (维基百科大马三人麻将权威规则：
  // 1. 圈风永远为东，任何玩家持东风刻子均计 1 番；庄家(东家)拿到东风计两番(圈风+门风)。
  // 2. 闲家吻合门风(南位南风、西位西风)计 1 番。
  // 3. 三人麻将没有第四位玩家，所以北风任何玩家都可以计一番！)
  const eastCount = allGameTiles.filter(t => t.id === 'wind_east').length;
  const southCount = allGameTiles.filter(t => t.id === 'wind_south').length;
  const westCount = allGameTiles.filter(t => t.id === 'wind_west').length;
  const northCount = allGameTiles.filter(t => t.id === 'wind_north').length;

  if (eastCount >= 3) {
    if (winningConditions.playerSeat === 'east') {
      fanItems.push({
        id: 'east_wind_dealer',
        nameZh: '东风刻子 (圈风+门风 2番)',
        nameEn: 'East Wind Triplet (Prevailing + Seat Wind)',
        fan: 2,
        descriptionZh: '庄家东位持东风刻子，双重吻合圈风与门风，计 2 番（维基百科标准）。',
        descriptionEn: 'East wind triplet for dealer (+2 Fan).',
        category: 'suit',
      });
    } else {
      fanItems.push({
        id: 'round_wind_east',
        nameZh: '圈风刻子 (东风)',
        nameEn: 'Prevailing East Wind Triplet',
        fan: 1,
        descriptionZh: '持圈风东风刻子 (+1 番)。',
        descriptionEn: 'Matching prevailing East wind triplet (+1 Fan).',
        category: 'suit',
      });
    }
  }

  if (winningConditions.playerSeat === 'south' && southCount >= 3) {
    fanItems.push({
      id: 'seat_wind_south',
      nameZh: '正风 / 门风刻子 (南风)',
      nameEn: 'Seat South Wind Triplet',
      fan: 1,
      descriptionZh: '自身南位吻合门风南风刻子 (+1 番)。',
      descriptionEn: 'Matching seat South wind triplet (+1 Fan).',
      category: 'suit',
    });
  }

  if (winningConditions.playerSeat === 'west' && westCount >= 3) {
    fanItems.push({
      id: 'seat_wind_west',
      nameZh: '正风 / 门风刻子 (西风)',
      nameEn: 'Seat West Wind Triplet',
      fan: 1,
      descriptionZh: '自身西位吻合门风西风刻子 (+1 番)。',
      descriptionEn: 'Matching seat West wind triplet (+1 Fan).',
      category: 'suit',
    });
  }

  // 北风刻子 (三人麻将无第四位玩家，任何玩家获得北风刻子均计一番)
  if (northCount >= 3) {
    fanItems.push({
      id: 'wind_north_any',
      nameZh: '北风刻子 (任何玩家计一番)',
      nameEn: 'North Wind Triplet',
      fan: 1,
      descriptionZh: '三人麻将无北位玩家，任何玩家获得北风刻子均计一番（维基百科标准）。',
      descriptionEn: 'North wind triplet for any player (+1 Fan).',
      category: 'suit',
    });
  }

  // 一条龙 (1-9 筒手牌全齐)
  const pureStraightFan = rules.pureStraightFan ?? 2;
  const has1to9Tong = [1, 2, 3, 4, 5, 6, 7, 8, 9].every(v =>
    allGameTiles.some(t => t.category === 'tong' && t.value === v)
  );
  if ((rules.enablePureStraight ?? true) && has1to9Tong) {
    fanItems.push({
      id: 'one_dragon',
      nameZh: '一条龙 (纯筒龙)',
      nameEn: 'Pure Dragon (1-9 Dots)',
      fan: pureStraightFan,
      descriptionZh: `手中持有一至九筒完整连贯龙型 (+${pureStraightFan} 番)！`,
      descriptionEn: `Complete 1-9 dots sequence (+${pureStraightFan} Fan).`,
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
  let isBaoFan = false;

  if (rules.multiplierType === 'linear') {
    // 几番几底模式：1番 = 1倍底价 (如 7番 = 7 * base)；超过 10 番或达成爆番牌型算爆番，得 20 * base
    const baoFanThreshold = rules.baoFanThreshold ?? 10;
    const baoFanMultiplier = rules.baoFanMultiplier ?? 20;

    const hasLimitHand = fanItems.some(
      item =>
        item.id === 'no_flowers' ||
        item.id === 'four_fei' ||
        item.id === 'thirteen_orphans' ||
        item.id === 'nine_gates' ||
        item.id === 'all_honors' ||
        item.id === 'big_four_winds' ||
        item.id === 'little_four_winds' ||
        item.id === 'big_three_dragons' ||
        item.id === 'four_kongs' ||
        item.id === 'four_concealed_pungs' ||
        item.id === 'flower_hu' ||
        item.id === 'tian_hu' ||
        item.id === 'di_hu'
    );

    if (totalFan > baoFanThreshold || (hasLimitHand && totalFan >= baoFanThreshold)) {
      isBaoFan = true;
      scorePerUnit = Number((basePrice * baoFanMultiplier).toFixed(2));
    } else {
      scorePerUnit = Number((basePrice * effectiveFan).toFixed(2));
    }
  } else if (rules.multiplierType === 'exponential') {
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
  let otherPays = 0;
  let eachPayIfZimo = 0;
  let winnerReceivedTotal = 0;

  const payoutMode = rules.payoutMode || (rules.shooterPaysAll ? 'shooter_full_2x' : 'shooter_only_1x');

  if (winningConditions.isZimo) {
    // 自摸：另外两家每个人都要付出 scorePerUnit + extraBountiesPerPlayer
    eachPayIfZimo = Number((scorePerUnit + extraBountiesPerPlayer).toFixed(2));
    winnerReceivedTotal = Number((eachPayIfZimo * 2).toFixed(2));
  } else {
    // 出冲 (放铳)
    if (payoutMode === 'shooter_full_3x') {
      // 维基百科放铳包牌制：放铳玩家一人支付吃胡番数 x3，另一位玩家无需支付
      shooterPays = Number((scorePerUnit * 3 + extraBountiesPerPlayer * 2).toFixed(2));
      otherPays = 0;
      winnerReceivedTotal = shooterPays;
    } else if (payoutMode === 'shooter_ratio') {
      // 维基百科放铳比例制：放铳玩家支付吃胡番数 x2，另一位玩家支付吃胡番数 x1
      shooterPays = Number((scorePerUnit * 2 + extraBountiesPerPlayer).toFixed(2));
      otherPays = Number((scorePerUnit * 1 + extraBountiesPerPlayer).toFixed(2));
      winnerReceivedTotal = Number((shooterPays + otherPays).toFixed(2));
    } else if (payoutMode === 'shooter_full_2x') {
      // 现代大马常见包两家：放铳玩家一人包两家赔 2x，另一位玩家无需支付
      shooterPays = Number((scorePerUnit * 2 + extraBountiesPerPlayer * 2).toFixed(2));
      otherPays = 0;
      winnerReceivedTotal = shooterPays;
    } else {
      // shooter_only_1x: 仅放铳玩家付 1x，另一位玩家付 0
      shooterPays = Number((scorePerUnit * 1 + extraBountiesPerPlayer * 2).toFixed(2));
      otherPays = 0;
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
  const fanLabel = isBaoFan
    ? `${totalFan}番 (爆番${rules.baoFanMultiplier ?? 20}底)`
    : `${effectiveFan}番`;
  if (winningConditions.isZimo) {
    ruleSummary = `自摸 ${fanLabel}（底 RM ${basePrice.toFixed(2)}）：两家各付 RM ${eachPayIfZimo.toFixed(2)}，赢家总收 RM ${winnerReceivedTotal.toFixed(2)}${bonusNote}。`;
  } else if (payoutMode === 'shooter_full_3x') {
    ruleSummary = `出冲 ${fanLabel}（维基包牌制 3×）：放炮者一人包全场付 3 倍 RM ${shooterPays.toFixed(2)}，赢家总收 RM ${winnerReceivedTotal.toFixed(2)}${bonusNote}。`;
  } else if (payoutMode === 'shooter_ratio') {
    ruleSummary = `出冲 ${fanLabel}（维基比例制 2:1）：放炮者付 2 倍 RM ${shooterPays.toFixed(2)}，闲家付 1 倍 RM ${otherPays.toFixed(2)}，赢家总收 RM ${winnerReceivedTotal.toFixed(2)}${bonusNote}。`;
  } else if (payoutMode === 'shooter_full_2x') {
    ruleSummary = `出冲 ${fanLabel}（包两家 2×）：放炮者一人包两家付 RM ${shooterPays.toFixed(2)}${bonusNote}。`;
  } else {
    ruleSummary = `出冲 ${fanLabel}：放炮者单付 RM ${shooterPays.toFixed(2)}${bonusNote}。`;
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
      otherPays,
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
