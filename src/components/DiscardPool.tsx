import React, { useState } from 'react';
import { MahjongTileData, Meld } from '../types/mahjong';
import { TONG_TILES, WIND_TILES, DRAGON_TILES } from '../constants/tiles';
import { MahjongTile } from './MahjongTile';
import { soundFx } from '../utils/soundEffects';
import {
  Waves,
  Trash2,
  Undo2,
  ChevronDown,
  ChevronUp,
  AlertOctagon,
  Eye,
  Layers,
} from 'lucide-react';

interface DiscardPoolProps {
  discardPool: MahjongTileData[];
  onAddDiscardTile: (tile: MahjongTileData) => void;
  onRemoveDiscardTile: (index: number) => void;
  onClearDiscardPool: () => void;
  handTiles: MahjongTileData[];
  melds: Meld[];
  lang: 'zh' | 'en';
}

export const DiscardPool: React.FC<DiscardPoolProps> = ({
  discardPool,
  onAddDiscardTile,
  onRemoveDiscardTile,
  onClearDiscardPool,
  handTiles,
  melds,
  lang,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [viewMode, setViewMode] = useState<'matrix' | 'river'>('matrix');

  // 计算每张牌在手牌、副露和牌池中出现的总次数
  const getTileStats = (tileId: string) => {
    const inPool = discardPool.filter(t => t.id === tileId).length;
    const inHand = handTiles.filter(t => t.id === tileId).length;
    let inMelds = 0;
    melds.forEach(m => m.tiles.forEach(t => { if (t.id === tileId) inMelds++; }));

    const totalSeen = inPool + inHand + inMelds;
    const remaining = Math.max(0, 4 - totalSeen);
    const isDead = remaining === 0;

    return { inPool, inHand, inMelds, totalSeen, remaining, isDead };
  };

  // 添加一张牌进弃牌池
  const handleAdd = (tile: MahjongTileData) => {
    const stats = getTileStats(tile.id);
    if (stats.totalSeen >= 4) {
      alert(
        lang === 'zh'
          ? `【${tile.nameZh}】已见4张（手牌+副露+牌池已满），牌副中不可能有更多！`
          : `All 4 copies of ${tile.nameEn} have already appeared!`
      );
      return;
    }
    soundFx.playDiscard();
    onAddDiscardTile(tile);
  };

  // 减少一张某牌 (从牌池中移除最新的一张)
  const handleDecrement = (tileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // 寻找牌池中最后一张该牌的索引
    for (let i = discardPool.length - 1; i >= 0; i--) {
      if (discardPool[i].id === tileId) {
        soundFx.playTileClick();
        onRemoveDiscardTile(i);
        return;
      }
    }
  };

  // 撤销最后一次打出的牌
  const handleUndoLast = () => {
    if (discardPool.length === 0) return;
    soundFx.playTileClick();
    onRemoveDiscardTile(discardPool.length - 1);
  };

  // 计算绝张总数
  const playableTiles = [...TONG_TILES, ...WIND_TILES, ...DRAGON_TILES];
  const deadTilesCount = playableTiles.filter(t => getTileStats(t.id).isDead).length;

  return (
    <div className="bg-[#0b2b1b] border border-emerald-600/50 rounded-2xl p-3 sm:p-4 shadow-xl space-y-3">
      {/* 头部导航与统计 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-800/80 pb-2">
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
            <Waves className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mahjong font-bold text-emerald-100 text-sm sm:text-base">
                {lang === 'zh' ? '公共出牌池 (桌面弃牌 / 堂子)' : 'Public Discard Pool'}
              </h3>
              <span className="bg-teal-950 text-teal-300 border border-teal-700/60 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {discardPool.length} {lang === 'zh' ? '张已出' : 'discards'}
              </span>
              {deadTilesCount > 0 && (
                <span className="bg-rose-950 text-rose-300 border border-rose-700/60 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertOctagon className="w-3 h-3 text-rose-400" />
                  {deadTilesCount} {lang === 'zh' ? '种已绝张' : 'dead'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-emerald-300/70">
              {lang === 'zh'
                ? '记录其他人及自己打到桌面的公开牌，系统将自动核算真实剩余张数与绝张！'
                : 'Track discards from opponents to compute accurate live outs and dead waits.'}
            </p>
          </div>
        </div>

        {/* 顶部操作按钮 */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* 切换矩阵 vs 流水 */}
          <div className="flex bg-[#06180f] p-0.5 rounded-lg border border-emerald-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`px-2 py-1 rounded font-bold transition flex items-center gap-1 ${
                viewMode === 'matrix'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-emerald-400 hover:text-white'
              }`}
              title={lang === 'zh' ? '快速记牌矩阵' : 'Quick Grid'}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'zh' ? '快捷记牌' : 'Grid'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('river')}
              className={`px-2 py-1 rounded font-bold transition flex items-center gap-1 ${
                viewMode === 'river'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-emerald-400 hover:text-white'
              }`}
              title={lang === 'zh' ? '打出顺序流水' : 'River Flow'}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'zh' ? '出牌轨迹' : 'River'}</span>
            </button>
          </div>

          {/* 撤销上一张 */}
          {discardPool.length > 0 && (
            <button
              type="button"
              onClick={handleUndoLast}
              className="p-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/80 text-xs flex items-center gap-1 transition"
              title={lang === 'zh' ? '撤销最后一张打出' : 'Undo last discard'}
            >
              <Undo2 className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden md:inline">{lang === 'zh' ? '撤销' : 'Undo'}</span>
            </button>
          )}

          {/* 清空牌池 */}
          {discardPool.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(lang === 'zh' ? '确定要清空桌面公共出牌池吗？' : 'Clear all public discards?')) {
                  onClearDiscardPool();
                }
              }}
              className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-200 border border-rose-800/80 text-xs flex items-center gap-1 transition"
              title={lang === 'zh' ? '清空弃牌池' : 'Clear discard pool'}
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden md:inline">{lang === 'zh' ? '清空' : 'Clear'}</span>
            </button>
          )}

          {/* 折叠开关 */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/50 transition"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 展开的主体内容 */}
      {isExpanded && (
        <div className="space-y-3 pt-1">
          {/* 模式 1: 快捷记牌矩阵 (所有牌排开，点击 +1，快速标记对手出的牌) */}
          {viewMode === 'matrix' && (
            <div className="space-y-2.5">
              {/* 1. 筒子区 (1 - 9 筒) */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-teal-300 mb-1 px-1">
                  <span>● 筒子 (点击牌面直接 +1 张入池)：</span>
                  <span className="text-emerald-400 text-[10px]">
                    {lang === 'zh' ? '池:已打出 | 剩:剩余活张' : 'Pool | Left'}
                  </span>
                </div>
                <div className="flex overflow-x-auto no-scrollbar gap-1.5 sm:grid sm:grid-cols-9 p-0.5">
                  {TONG_TILES.map((tile) => {
                    const stats = getTileStats(tile.id);
                    return (
                      <div
                        key={tile.id}
                        onClick={() => handleAdd(tile)}
                        className={`
                          shrink-0 w-[58px] sm:w-auto relative group flex flex-col items-center justify-between p-1 rounded-xl border transition-all cursor-pointer select-none
                          ${
                            stats.isDead
                              ? 'bg-red-950/40 border-red-800/60 ring-1 ring-red-500/40 opacity-80'
                              : stats.inPool > 0
                              ? 'bg-teal-950/60 border-teal-600/70 hover:bg-teal-900/70 shadow-sm'
                              : 'bg-[#0a2316] border-emerald-800/60 hover:bg-emerald-900/50'
                          }
                          hover:-translate-y-0.5 active:translate-y-0.5
                        `}
                      >
                        <MahjongTile tile={tile} size="sm" />

                        {/* 牌面下方统计与减少按钮 */}
                        <div className="w-full mt-1 flex items-center justify-between text-[10px] px-0.5">
                          <span
                            className={`font-black ${
                              stats.inPool > 0 ? 'text-amber-300' : 'text-emerald-500'
                            }`}
                          >
                            池:{stats.inPool}
                          </span>
                          <span
                            className={`font-black ${
                              stats.isDead
                                ? 'text-red-400 bg-red-950 px-1 rounded'
                                : 'text-emerald-400'
                            }`}
                          >
                            {stats.isDead ? '绝' : `剩${stats.remaining}`}
                          </span>
                        </div>

                        {/* 如果在池中 > 0，显示快速减 1 按钮 */}
                        {stats.inPool > 0 && (
                          <button
                            type="button"
                            onClick={(e) => handleDecrement(tile.id, e)}
                            className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-slate-800 hover:bg-red-600 text-white text-[10px] font-black flex items-center justify-center shadow-md border border-slate-600 hover:border-white transition-all z-10"
                            title={lang === 'zh' ? '减去1张' : 'Minus 1'}
                          >
                            -
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. 字牌区 (东南西北 + 中发白) */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-300 mb-1 px-1">
                  <span>🀄 字牌 (东南西北 / 中發白)：</span>
                </div>
                <div className="flex overflow-x-auto no-scrollbar gap-1.5 sm:grid sm:grid-cols-7 p-0.5">
                  {[...WIND_TILES, ...DRAGON_TILES].map((tile) => {
                    const stats = getTileStats(tile.id);
                    return (
                      <div
                        key={tile.id}
                        onClick={() => handleAdd(tile)}
                        className={`
                          shrink-0 w-[58px] sm:w-auto relative group flex flex-col items-center justify-between p-1 rounded-xl border transition-all cursor-pointer select-none
                          ${
                            stats.isDead
                              ? 'bg-red-950/40 border-red-800/60 ring-1 ring-red-500/40 opacity-80'
                              : stats.inPool > 0
                              ? 'bg-teal-950/60 border-teal-600/70 hover:bg-teal-900/70 shadow-sm'
                              : 'bg-[#0a2316] border-emerald-800/60 hover:bg-emerald-900/50'
                          }
                          hover:-translate-y-0.5 active:translate-y-0.5
                        `}
                      >
                        <MahjongTile tile={tile} size="sm" />

                        <div className="w-full mt-1 flex items-center justify-between text-[10px] px-0.5">
                          <span
                            className={`font-black ${
                              stats.inPool > 0 ? 'text-amber-300' : 'text-emerald-500'
                            }`}
                          >
                            池:{stats.inPool}
                          </span>
                          <span
                            className={`font-black ${
                              stats.isDead
                                ? 'text-red-400 bg-red-950 px-1 rounded'
                                : 'text-emerald-400'
                            }`}
                          >
                            {stats.isDead ? '绝' : `剩${stats.remaining}`}
                          </span>
                        </div>

                        {stats.inPool > 0 && (
                          <button
                            type="button"
                            onClick={(e) => handleDecrement(tile.id, e)}
                            className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-slate-800 hover:bg-red-600 text-white text-[10px] font-black flex items-center justify-center shadow-md border border-slate-600 hover:border-white transition-all z-10"
                            title={lang === 'zh' ? '减去1张' : 'Minus 1'}
                          >
                            -
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 模式 2: 出牌轨迹流水河 (按打出顺序排列) */}
          {viewMode === 'river' && (
            <div className="bg-[#071f13] border border-emerald-800/80 rounded-xl p-3 min-h-[100px] flex flex-col justify-between">
              {discardPool.length === 0 ? (
                <div className="py-6 text-center text-emerald-400/60 text-xs">
                  {lang === 'zh'
                    ? '🌊 牌桌暂无弃牌。请在【快捷记牌】矩阵中点击牌面，或在下方选牌面板切换为【记入牌池】快速添加！'
                    : 'No discards yet. Tap any tile in the Quick Grid to register a discard.'}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {discardPool.map((tile, idx) => (
                    <div key={`${tile.id}_${idx}`} className="relative group">
                      <MahjongTile
                        tile={tile}
                        size="sm"
                        badge={idx + 1}
                        onRemove={() => onRemoveDiscardTile(idx)}
                      />
                    </div>
                  ))}
                </div>
              )}

              {discardPool.length > 0 && (
                <div className="mt-2 pt-2 border-t border-emerald-900/60 flex items-center justify-between text-[11px] text-emerald-400/80">
                  <span>
                    {lang === 'zh'
                      ? `已打出 ${discardPool.length} 张牌（点击 × 可单独撤回误点的牌）`
                      : `${discardPool.length} tiles discarded (click × to remove)`}
                  </span>
                  <button
                    type="button"
                    onClick={handleUndoLast}
                    className="text-amber-300 hover:underline flex items-center gap-1 font-bold"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    {lang === 'zh' ? '撤销最新打出的一张' : 'Undo last'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
