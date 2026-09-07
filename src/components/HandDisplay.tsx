import React from 'react';
import {
  MahjongTileData,
  Meld,
  WinningConditions,
  RuleSettings,
  WindValue,
} from '../types/mahjong';
import { MahjongTile } from './MahjongTile';
import { isAnimalBite } from '../constants/tiles';
import { CheckCircle2, AlertCircle, Sparkles, Layers, Award } from 'lucide-react';

interface HandDisplayProps {
  handTiles: MahjongTileData[];
  melds: Meld[];
  flowers: MahjongTileData[];
  winningConditions: WinningConditions;
  onUpdateConditions: (cond: Partial<WinningConditions>) => void;
  onRemoveHandTile: (index: number) => void;
  onRemoveMeld: (meldId: string) => void;
  onRemoveFlower: (index: number) => void;
  lang: 'zh' | 'en';
  onCalculate: () => void;
  isWinReady: boolean;
  totalTilesCount: number;
  rules?: RuleSettings;
}

export const HandDisplay: React.FC<HandDisplayProps> = ({
  handTiles,
  melds,
  flowers,
  winningConditions,
  onUpdateConditions,
  onRemoveHandTile,
  onRemoveMeld,
  onRemoveFlower,
  lang,
  onCalculate,
  isWinReady,
  totalTilesCount,
  rules,
}) => {
  // 检查动物咬到
  const hasCat = flowers.some(f => f.id === 'animal_cat');
  const hasRat = flowers.some(f => f.id === 'animal_rat');
  const hasRooster = flowers.some(f => f.id === 'animal_rooster');
  const hasCentipede = flowers.some(f => f.id === 'animal_centipede');

  const catRatBite = hasCat && hasRat;
  const roosterCentipedeBite = hasRooster && hasCentipede;

  // 整理手牌显示 (飞牌排在最后，筒子按数字升序)
  const sortedTiles = [...handTiles].sort((a, b) => {
    if (a.category === 'fei') return 1;
    if (b.category === 'fei') return -1;
    return a.id.localeCompare(b.id);
  });

  return (
    <div className="bg-[#114028] border border-emerald-700/60 rounded-2xl p-3 sm:p-5 shadow-xl space-y-4">
      {/* 顶部手牌统计与算番主行动按钮 */}
      {/* 顶部手牌统计与算番主行动按钮 */}
      <div className="flex items-center justify-between gap-2 border-b border-emerald-800/80 pb-3">
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
          <h2 className="font-mahjong font-bold text-emerald-100 text-sm sm:text-lg whitespace-nowrap">
            {lang === 'zh' ? '当前牌面' : 'Hand'}
          </h2>
          <span className="text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700 whitespace-nowrap">
            {lang === 'zh' ? `立牌${handTiles.length}` : `${handTiles.length}t`}
            {melds.length > 0 && ` +${melds.length}副`}
            {` (${totalTilesCount}/14)`}
          </span>
        </div>

        {/* 算番 / 查看收益主按钮 */}
        <button
          type="button"
          onClick={onCalculate}
          disabled={totalTilesCount < 14 && !isWinReady}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-bold text-xs sm:text-sm shadow-lg transition-all transform shrink-0 whitespace-nowrap
            ${
              isWinReady || totalTilesCount >= 14
                ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 scale-105 animate-pulse shadow-amber-500/25'
                : 'bg-emerald-800/60 text-emerald-300 border border-emerald-700 hover:bg-emerald-700 cursor-pointer'
            }
          `}
        >
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-950" />
          <span>{lang === 'zh' ? '结算番数算钱' : 'Calculate Fan'}</span>
        </button>
      </div>

      {/* 1. 立牌展示区 (In-hand Tiles) */}
      <div>
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1">
            🀄 {lang === 'zh' ? '手中暗牌 (点击红叉可移除)' : 'Concealed Hand Tiles'}
          </span>
          {handTiles.length === 0 && (
            <span className="text-xs text-amber-300/80">
              {lang === 'zh' ? '请在下方选择麻将牌' : 'Select tiles below'}
            </span>
          )}
        </div>

        <div className="min-h-[76px] bg-[#0c2e1c]/90 border border-emerald-800/80 rounded-xl pt-3 pb-2.5 px-2 flex flex-wrap items-center justify-center sm:justify-start gap-1 sm:gap-2 shadow-inner">
          {handTiles.length === 0 ? (
            <div className="w-full py-4 text-center text-emerald-400/60 text-xs sm:text-sm font-medium">
              {lang === 'zh'
                ? '暂无手牌。请在下方选牌面板点击添加，或点击右上角【拍照识牌】/【换范例】。'
                : 'No tiles in hand. Select below or click "Scan" / "Sample" above.'}
            </div>
          ) : (
            handTiles.map((tile, idx) => (
              <MahjongTile
                key={`${tile.id}_${idx}`}
                tile={tile}
                size="md"
                onRemove={() => onRemoveHandTile(idx)}
              />
            ))
          )}
        </div>
      </div>

      {/* 2. 副露区 (碰、吃、杠) */}
      {melds.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1">
              ✨ {lang === 'zh' ? '副露区 (碰 / 顺 / 杠)' : 'Exposed Melds (Pong / Chow / Kong)'}
            </span>
          </div>
          <div className="bg-[#0c2e1c]/60 border border-emerald-800/80 rounded-xl p-2.5 flex flex-wrap items-center gap-3">
            {melds.map((meld) => {
              const meldTypeName = {
                chow: lang === 'zh' ? '顺子' : 'Chow',
                pong: lang === 'zh' ? '碰' : 'Pong',
                kong_exposed: lang === 'zh' ? '明杠' : 'Exposed Kong',
                kong_concealed: lang === 'zh' ? '暗杠' : 'Concealed Kong',
              }[meld.type];

              return (
                <div
                  key={meld.id}
                  className="relative flex items-center gap-1 bg-emerald-950/70 border border-emerald-700/60 rounded-lg p-1.5"
                >
                  <span className="text-[10px] font-bold text-amber-400 mr-1 writing-mode-vertical">
                    {meldTypeName}
                  </span>
                  {(meld.type === 'kong_exposed' || meld.type === 'kong_concealed') && rules?.enableKongImmediateCash && (
                    <span className="text-[9px] font-bold text-amber-300 bg-amber-950 px-1 py-0.5 rounded border border-amber-700/80 mr-1 whitespace-nowrap">
                      +RM{(rules.basePrice * (rules.kongImmediateFan ?? 2)).toFixed(2)}
                    </span>
                  )}
                  <div className="flex items-center gap-0.5">
                    {meld.tiles.map((t, i) => (
                      <MahjongTile key={i} tile={t} size="sm" />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveMeld(meld.id)}
                    className="ml-1 w-5 h-5 rounded bg-red-900/60 hover:bg-red-800 text-red-200 text-xs flex items-center justify-center"
                    title="删除此副露"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. 花牌与动物区 (Bonus Flowers & Animals) */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1">
              🌺 {lang === 'zh' ? '花牌与动物区' : 'Bonus Flowers & Animals'}
            </span>
            <span className="text-[11px] text-emerald-400 font-bold">
              ({flowers.length} {lang === 'zh' ? '只' : 'tiles'})
            </span>
          </div>

          {/* 咬到状态提示 */}
          <div className="flex items-center gap-2">
            {catRatBite && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/50 animate-pulse">
                🐱⚡🐭 {lang === 'zh' ? '猫抓老鼠咬到！' : 'Cat eats Rat!'}
              </span>
            )}
            {roosterCentipedeBite && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-500/50 animate-pulse">
                🐓⚡🐛 {lang === 'zh' ? '鸡啄蜈蚣咬到！' : 'Rooster eats Centipede!'}
              </span>
            )}
          </div>
        </div>

        <div className="min-h-[58px] bg-[#0c2e1c]/80 border border-emerald-800/80 rounded-xl p-2 flex flex-wrap items-center gap-1.5">
          {flowers.length === 0 ? (
            <span className="text-emerald-500/60 text-xs px-2">
              {lang === 'zh' ? '暂未摸到花牌或动物（可在下方花牌分类中点击添加）' : 'No flowers or animals yet.'}
            </span>
          ) : (
            flowers.map((f, idx) => (
              <MahjongTile
                key={`${f.id}_${idx}`}
                tile={f}
                size="sm"
                onRemove={() => onRemoveFlower(idx)}
              />
            ))
          )}
        </div>
      </div>

      {/* 4. 胡牌条件与坐位设置快捷开关 */}
      <div className="bg-emerald-950/60 border border-emerald-800/70 rounded-xl p-2.5 sm:p-3 grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 text-xs">
        {/* 自摸开关 */}
        <label className="flex items-center gap-2 cursor-pointer select-none bg-[#092517] p-2 rounded-lg border border-emerald-800/80 hover:border-emerald-700">
          <input
            type="checkbox"
            checked={winningConditions.isZimo}
            onChange={(e) => onUpdateConditions({ isZimo: e.target.checked })}
            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-emerald-900 border-emerald-700 shrink-0"
          />
          <div className="leading-tight">
            <span className={`block font-bold text-[11px] sm:text-xs ${winningConditions.isZimo ? 'text-amber-300' : 'text-emerald-300'}`}>
              🎯 {lang === 'zh' ? '自摸' : 'Self-Drawn'}
            </span>
            <span className="text-[10px] text-emerald-400/80">
              {lang === 'zh' ? '+1番/两家付' : '+1 Fan'}
            </span>
          </div>
        </label>

        {/* 杠上开花 */}
        <label className="flex items-center gap-2 cursor-pointer select-none bg-[#092517] p-2 rounded-lg border border-emerald-800/80 hover:border-emerald-700">
          <input
            type="checkbox"
            checked={winningConditions.isKongBloom}
            onChange={(e) => onUpdateConditions({ isKongBloom: e.target.checked })}
            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-emerald-900 border-emerald-700 shrink-0"
          />
          <div className="leading-tight">
            <span className={`block font-bold text-[11px] sm:text-xs ${winningConditions.isKongBloom ? 'text-amber-300' : 'text-emerald-300'}`}>
              🌸 {lang === 'zh' ? '杠上开花' : 'Kong Bloom'}
            </span>
            <span className="text-[10px] text-emerald-400/80">
              {lang === 'zh' ? '+1番' : '+1 Fan'}
            </span>
          </div>
        </label>

        {/* 抢杠 */}
        <label className="flex items-center gap-2 cursor-pointer select-none bg-[#092517] p-2 rounded-lg border border-emerald-800/80 hover:border-emerald-700">
          <input
            type="checkbox"
            checked={winningConditions.isRobbingKong}
            onChange={(e) => onUpdateConditions({ isRobbingKong: e.target.checked })}
            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-emerald-900 border-emerald-700 shrink-0"
          />
          <div className="leading-tight">
            <span className={`block font-bold text-[11px] sm:text-xs ${winningConditions.isRobbingKong ? 'text-amber-300' : 'text-emerald-300'}`}>
              ⚡ {lang === 'zh' ? '抢杠' : 'Rob Kong'}
            </span>
            <span className="text-[10px] text-emerald-400/80">
              {lang === 'zh' ? '+1番' : '+1 Fan'}
            </span>
          </div>
        </label>

        {/* 海底捞月 */}
        <label className="flex items-center gap-2 cursor-pointer select-none bg-[#092517] p-2 rounded-lg border border-emerald-800/80 hover:border-emerald-700">
          <input
            type="checkbox"
            checked={winningConditions.isLastTileDraw}
            onChange={(e) => onUpdateConditions({ isLastTileDraw: e.target.checked })}
            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-emerald-900 border-emerald-700 shrink-0"
          />
          <div className="leading-tight">
            <span className={`block font-bold text-[11px] sm:text-xs ${winningConditions.isLastTileDraw ? 'text-amber-300' : 'text-emerald-300'}`}>
              🌙 {lang === 'zh' ? '海底捞月' : 'Last Draw'}
            </span>
            <span className="text-[10px] text-emerald-400/80">
              {lang === 'zh' ? '+1番' : '+1 Fan'}
            </span>
          </div>
        </label>

        {/* 自身门风 */}
        <div className="col-span-2 sm:col-span-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-emerald-800/60">
          <span className="text-emerald-300 font-medium text-xs">
            🧭 {lang === 'zh' ? '您的门风（正风花可加番）：' : 'Your Seat Wind:'}
          </span>
          <div className="flex gap-1.5 w-full sm:w-auto">
            {(['east', 'south', 'west'] as WindValue[]).map((w) => {
              const names = { east: '东家', south: '南家', west: '西家', north: '北家' };
              const isSelected = winningConditions.playerSeat === w;
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => onUpdateConditions({ playerSeat: w })}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition text-center ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-sm ring-1 ring-amber-300'
                      : 'bg-emerald-900/80 text-emerald-300 hover:bg-emerald-800'
                  }`}
                >
                  {names[w]}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
