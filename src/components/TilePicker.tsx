import React, { useState } from 'react';
import {
  MahjongTileData,
  Meld,
  MeldType,
} from '../types/mahjong';
import {
  TONG_TILES,
  WIND_TILES,
  DRAGON_TILES,
  FEI_TILES,
  FLOWER_TILES,
  ANIMAL_TILES,
  getTileById,
} from '../constants/tiles';
import { MahjongTile } from './MahjongTile';
import { soundFx } from '../utils/soundEffects';
import { PlusCircle, Layers, Sparkles } from 'lucide-react';

interface TilePickerProps {
  onAddTile: (tile: MahjongTileData) => void;
  onAddMeld: (type: MeldType, tiles: MahjongTileData[]) => void;
  onAddFlower: (tile: MahjongTileData) => void;
  onAddDiscardTile?: (tile: MahjongTileData) => void;
  handTiles: MahjongTileData[];
  flowers: MahjongTileData[];
  melds?: Meld[];
  discardPool?: MahjongTileData[];
  lang: 'zh' | 'en';
}

type PickerTab = 'tong' | 'honors' | 'fei' | 'bonus' | 'quick_meld';

export const TilePicker: React.FC<TilePickerProps> = ({
  onAddTile,
  onAddMeld,
  onAddFlower,
  onAddDiscardTile,
  handTiles,
  flowers,
  melds = [],
  discardPool = [],
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<PickerTab>('tong');
  const [targetMode, setTargetMode] = useState<'hand' | 'pool'>('hand');

  // 计算某张牌在手牌、副露、花牌和弃牌池中的综合使用情况
  const getTileStats = (tileId: string) => {
    let inHand = 0;
    handTiles.forEach(t => { if (t.id === tileId) inHand++; });
    flowers.forEach(f => { if (f.id === tileId) inHand++; });

    let inMelds = 0;
    melds.forEach((m: Meld) => m.tiles.forEach((t: MahjongTileData) => { if (t.id === tileId) inMelds++; }));

    let inPool = 0;
    discardPool.forEach(p => { if (p.id === tileId) inPool++; });

    const totalSeen = inHand + inMelds + inPool;
    const remaining = Math.max(0, 4 - totalSeen);
    const isDead = remaining === 0;

    return { inHand, inMelds, inPool, totalSeen, remaining, isDead };
  };

  const handleTileClick = (tile: MahjongTileData) => {
    if (targetMode === 'pool') {
      if (tile.category === 'flower' || tile.category === 'animal') {
        alert(lang === 'zh' ? '花牌与动物牌摸到即补花展示，不打入公共弃牌池！' : 'Flowers and animals are kept, not discarded.');
        return;
      }
      const stats = getTileStats(tile.id);
      if (stats.totalSeen >= 4) {
        alert(lang === 'zh' ? `【${tile.nameZh}】已见4张，无法再打出！` : `All 4 ${tile.nameEn} already seen!`);
        return;
      }
      soundFx.playDiscard();
      if (onAddDiscardTile) {
        onAddDiscardTile(tile);
      }
      return;
    }

    if (tile.category === 'flower' || tile.category === 'animal') {
      onAddFlower(tile);
    } else {
      onAddTile(tile);
    }
  };

  // 一键碰 (三张)
  const handleQuickPong = (tile: MahjongTileData) => {
    soundFx.playMeld();
    onAddMeld('pong', [tile, tile, tile]);
  };

  // 一键明杠 (四张)
  const handleQuickKong = (tile: MahjongTileData, isConcealed: boolean = false) => {
    soundFx.playMeld();
    onAddMeld(isConcealed ? 'kong_concealed' : 'kong_exposed', [tile, tile, tile, tile]);
  };

  // 一键顺子 (例如 1-2-3 筒)
  const handleQuickChow = (startNum: number) => {
    if (startNum < 1 || startNum > 7) return;
    soundFx.playMeld();
    const t1 = getTileById(`tong_${startNum}`);
    const t2 = getTileById(`tong_${startNum + 1}`);
    const t3 = getTileById(`tong_${startNum + 2}`);
    onAddMeld('chow', [t1, t2, t3]);
  };

  return (
    <div className={`border rounded-2xl p-3 sm:p-5 shadow-xl space-y-3 transition-colors ${
      targetMode === 'pool'
        ? 'bg-[#0b2b25] border-teal-500/70 ring-1 ring-teal-500/30'
        : 'bg-[#114028] border-emerald-700/60'
    }`}>
      {/* 操作目标模式切换 (加入手牌 vs 记入公共弃牌池) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-[#061c12] rounded-xl border border-emerald-800">
        <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-emerald-200 shrink-0">
            {lang === 'zh' ? '选牌去向：' : 'Target:'}
          </span>
          <div className="flex items-center gap-1 bg-[#092b1b] p-0.5 rounded-lg border border-emerald-700/60 text-xs flex-1 sm:flex-initial justify-end sm:justify-start">
            <button
              type="button"
              onClick={() => setTargetMode('hand')}
              className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1 rounded-md font-bold transition flex items-center justify-center gap-1 text-xs ${
                targetMode === 'hand'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-emerald-300 hover:text-white'
              }`}
            >
              <span>🀄</span>
              <span>{lang === 'zh' ? '加手牌' : 'Hand'}</span>
            </button>
            <button
              type="button"
              onClick={() => setTargetMode('pool')}
              className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1 rounded-md font-bold transition flex items-center justify-center gap-1 text-xs ${
                targetMode === 'pool'
                  ? 'bg-teal-500 text-slate-950 shadow-md'
                  : 'text-teal-300 hover:text-white'
              }`}
            >
              <span>🌊</span>
              <span>{lang === 'zh' ? '记牌池' : 'Discard'}</span>
              <span className="hidden sm:inline">{lang === 'zh' ? ' (出牌)' : ''}</span>
            </button>
          </div>
        </div>

        <div className="text-[10px] sm:text-[11px] text-emerald-300/80 text-center sm:text-right">
          {targetMode === 'hand'
            ? (lang === 'zh' ? '💡 点击牌面直接放进你的手牌' : 'Click to add to your hand')
            : (lang === 'zh' ? '🌊 点击牌面记入桌面弃牌池，自动扣减剩余张数' : 'Click to add to public table discards')}
        </div>
      </div>

      {/* 选牌选项卡 Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-800/80 pb-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <PlusCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <h3 className="font-mahjong font-bold text-emerald-100 text-sm sm:text-base whitespace-nowrap">
            {lang === 'zh' ? '选牌面板' : 'Tile Picker'}
          </h3>
        </div>

        {/* 标签切换 - 移动端支持水平滑动 */}
        <div className="flex overflow-x-auto no-scrollbar gap-1 bg-[#0c2e1c] p-1 rounded-xl border border-emerald-800 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('tong')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 ${
              activeTab === 'tong'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-emerald-300 hover:text-white'
            }`}
          >
            {lang === 'zh' ? '筒子 (1-9)' : 'Dots'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('honors')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 ${
              activeTab === 'honors'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-emerald-300 hover:text-white'
            }`}
          >
            {lang === 'zh' ? '字牌' : 'Honors'}
            <span className="hidden sm:inline">{lang === 'zh' ? ' (风/龙)' : ''}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fei')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 ${
              activeTab === 'fei'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-amber-300 hover:text-amber-200'
            }`}
          >
            {lang === 'zh' ? '⭐ 飞牌' : 'Fei'}
            <span className="hidden sm:inline">{lang === 'zh' ? ' (百搭)' : ' (Jokers)'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bonus')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 ${
              activeTab === 'bonus'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-emerald-300 hover:text-white'
            }`}
          >
            {lang === 'zh' ? '🌺 花牌动物' : 'Flowers'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quick_meld')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 ${
              activeTab === 'quick_meld'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow'
                : 'text-amber-300 hover:text-white'
            }`}
          >
            {lang === 'zh' ? '⚡ 快捷碰杠' : 'Quick Melds'}
          </button>
        </div>
      </div>

      {/* 选项卡内容 */}
      <div className="min-h-[110px] flex items-center justify-center p-2 bg-[#0c2e1c]/60 rounded-xl border border-emerald-800/60">
        {/* 1. 筒子 */}
        {activeTab === 'tong' && (
          <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 py-1">
            {TONG_TILES.map((t) => {
              const stats = getTileStats(t.id);
              const badge = stats.isDead
                ? '绝'
                : targetMode === 'pool'
                ? (stats.inPool > 0 ? `池${stats.inPool}` : (stats.remaining < 4 ? `剩${stats.remaining}` : undefined))
                : (stats.inHand > 0 ? `手${stats.inHand}` : (stats.remaining < 4 ? `剩${stats.remaining}` : undefined));
              return (
                <MahjongTile
                  key={t.id}
                  tile={t}
                  size="md"
                  badge={badge}
                  disabled={stats.totalSeen >= 4}
                  highlight={targetMode === 'pool' ? stats.inPool > 0 : stats.inHand > 0}
                  onClick={() => handleTileClick(t)}
                />
              );
            })}
          </div>
        )}

        {/* 2. 字牌 (东南西北 + 中发白) */}
        {activeTab === 'honors' && (
          <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 py-1">
            {WIND_TILES.map((t) => {
              const stats = getTileStats(t.id);
              const badge = stats.isDead
                ? '绝'
                : targetMode === 'pool'
                ? (stats.inPool > 0 ? `池${stats.inPool}` : (stats.remaining < 4 ? `剩${stats.remaining}` : undefined))
                : (stats.inHand > 0 ? `手${stats.inHand}` : (stats.remaining < 4 ? `剩${stats.remaining}` : undefined));
              return (
                <MahjongTile
                  key={t.id}
                  tile={t}
                  size="md"
                  badge={badge}
                  disabled={stats.totalSeen >= 4}
                  highlight={targetMode === 'pool' ? stats.inPool > 0 : stats.inHand > 0}
                  onClick={() => handleTileClick(t)}
                />
              );
            })}
            <div className="w-px h-12 bg-emerald-700/60 mx-1 hidden sm:block" />
            {DRAGON_TILES.map((t) => {
              const stats = getTileStats(t.id);
              const badge = stats.isDead
                ? '绝'
                : targetMode === 'pool'
                ? (stats.inPool > 0 ? `池${stats.inPool}` : (stats.remaining < 4 ? `剩${stats.remaining}` : undefined))
                : (stats.inHand > 0 ? `手${stats.inHand}` : (stats.remaining < 4 ? `剩${stats.remaining}` : undefined));
              return (
                <MahjongTile
                  key={t.id}
                  tile={t}
                  size="md"
                  badge={badge}
                  disabled={stats.totalSeen >= 4}
                  highlight={targetMode === 'pool' ? stats.inPool > 0 : stats.inHand > 0}
                  onClick={() => handleTileClick(t)}
                />
              );
            })}
          </div>
        )}

        {/* 3. 飞牌 (百搭) */}
        {activeTab === 'fei' && (
          <div className="flex flex-col items-center gap-3 py-1 text-center">
            <div className="flex items-center gap-3">
              {FEI_TILES.map((t, idx) => {
                const totalFeiUsed = handTiles.filter(tile => tile.category === 'fei').length;
                const isThisUsed = idx < totalFeiUsed;
                return (
                  <MahjongTile
                    key={t.id}
                    tile={t}
                    size="lg"
                    highlight
                    disabled={isThisUsed}
                    onClick={() => handleTileClick(t)}
                  />
                );
              })}
            </div>
            <p className="text-xs text-amber-200/90 max-w-md">
              {lang === 'zh'
                ? '⭐ 飞牌是大马三人麻将的核心！每张飞牌可代替任何筒子或字牌。摸满 4 张飞牌（全飞/满天飞）直接大满贯胡牌！'
                : '⭐ Fei is the Joker wildcard in Malaysian 3P Mahjong. Collecting all 4 Fei triggers an instant win!'}
            </p>
          </div>
        )}

        {/* 4. 花牌与动物 */}
        {activeTab === 'bonus' && (
          <div className="flex flex-col gap-3 py-1 w-full">
            {/* 动物 */}
            <div>
              <div className="text-xs font-bold text-amber-300 mb-1 flex items-center gap-1">
                <span>🐾 动物牌（咬花即时现金奖励）：</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {ANIMAL_TILES.map((t) => {
                  const used = getTileStats(t.id).inHand;
                  return (
                    <div key={t.id} className="flex flex-col items-center">
                      <MahjongTile
                        tile={t}
                        size="md"
                        disabled={used >= 1}
                        onClick={() => handleTileClick(t)}
                      />
                      <span className="text-[10px] text-emerald-300 mt-0.5">
                        {t.id === 'animal_cat' && '咬老鼠'}
                        {t.id === 'animal_rat' && '被猫咬'}
                        {t.id === 'animal_rooster' && '啄蜈蚣'}
                        {t.id === 'animal_centipede' && '被鸡啄'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 四季与四君子 */}
            <div>
              <div className="text-xs font-bold text-emerald-300 mb-1">
                <span>🌸 四季 (春夏秋冬) & 四君子 (梅兰竹菊)：</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {FLOWER_TILES.map((t) => {
                  const used = getTileStats(t.id).inHand;
                  return (
                    <MahjongTile
                      key={t.id}
                      tile={t}
                      size="sm"
                      disabled={used >= 1}
                      onClick={() => handleTileClick(t)}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 5. 快捷碰 / 杠 / 顺子 */}
        {activeTab === 'quick_meld' && (
          <div className="flex flex-col gap-3 w-full py-1 text-xs">
            {/* 快捷顺子 */}
            <div>
              <span className="font-bold text-amber-300 block mb-1.5">
                {lang === 'zh' ? '一键添加顺子 (吃牌)：' : 'Quick Chows (Sequences):'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleQuickChow(num)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-900/90 hover:bg-emerald-700 text-emerald-200 border border-emerald-700 font-bold"
                  >
                    {num}-{num + 1}-{num + 2} 筒
                  </button>
                ))}
              </div>
            </div>

            {/* 快捷碰牌 */}
            <div>
              <span className="font-bold text-amber-300 block mb-1.5">
                {lang === 'zh' ? '一键添加碰牌 (3张刻子)：' : 'Quick Pongs (Triplets):'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {TONG_TILES.slice(0, 9).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleQuickPong(t)}
                    className="px-2 py-1 rounded bg-emerald-950/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700 font-medium"
                  >
                    碰 {t.nameZh}
                  </button>
                ))}
                {DRAGON_TILES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleQuickPong(t)}
                    className="px-2 py-1 rounded bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800 font-medium"
                  >
                    碰 {t.nameZh}
                  </button>
                ))}
              </div>
            </div>

            {/* 快捷杠牌 */}
            <div>
              <span className="font-bold text-amber-300 block mb-1.5">
                {lang === 'zh' ? '一键添加明杠/暗杠 (4张)：' : 'Quick Kongs (4 of a kind):'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {TONG_TILES.slice(0, 5).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleQuickKong(t, false)}
                    className="px-2 py-1 rounded bg-emerald-950/80 hover:bg-emerald-800 text-emerald-300 border border-emerald-700"
                  >
                    明杠 {t.nameZh}
                  </button>
                ))}
                {DRAGON_TILES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleQuickKong(t, true)}
                    className="px-2 py-1 rounded bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800"
                  >
                    暗杠 {t.nameZh}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
