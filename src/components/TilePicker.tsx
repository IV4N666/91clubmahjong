import React, { useState } from 'react';
import {
  MahjongTileData,
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
  handTiles: MahjongTileData[];
  flowers: MahjongTileData[];
  lang: 'zh' | 'en';
}

type PickerTab = 'tong' | 'honors' | 'fei' | 'bonus' | 'quick_meld';

export const TilePicker: React.FC<TilePickerProps> = ({
  onAddTile,
  onAddMeld,
  onAddFlower,
  handTiles,
  flowers,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<PickerTab>('tong');

  // 计算某张牌已使用了多少张 (标准一副牌只有 4 张，花牌动物各 1 张)
  const getUsedCount = (tileId: string): number => {
    let count = 0;
    handTiles.forEach(t => {
      if (t.id === tileId) count++;
    });
    flowers.forEach(f => {
      if (f.id === tileId) count++;
    });
    return count;
  };

  const handleTileClick = (tile: MahjongTileData) => {
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
    <div className="bg-[#114028] border border-emerald-700/60 rounded-2xl p-3 sm:p-5 shadow-xl space-y-3">
      {/* 选牌选项卡 Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-800/80 pb-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <PlusCircle className="w-5 h-5 text-amber-400" />
          <h3 className="font-mahjong font-bold text-emerald-100 text-sm sm:text-base">
            {lang === 'zh' ? '选牌面板' : 'Tile Picker'}
          </h3>
        </div>

        {/* 标签切换 */}
        <div className="flex flex-wrap gap-1 bg-[#0c2e1c] p-1 rounded-xl border border-emerald-800">
          <button
            type="button"
            onClick={() => setActiveTab('tong')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
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
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              activeTab === 'honors'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-emerald-300 hover:text-white'
            }`}
          >
            {lang === 'zh' ? '字牌 (东南西北/中发白)' : 'Honors'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fei')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              activeTab === 'fei'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-amber-300 hover:text-amber-200'
            }`}
          >
            {lang === 'zh' ? '⭐ 飞牌 (百搭)' : 'Fei (Jokers)'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bonus')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              activeTab === 'bonus'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-emerald-300 hover:text-white'
            }`}
          >
            {lang === 'zh' ? '🌺 花与动物' : 'Flowers & Animals'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quick_meld')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              activeTab === 'quick_meld'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow'
                : 'text-amber-300 hover:text-white'
            }`}
          >
            {lang === 'zh' ? '⚡ 快捷碰/杠/顺' : 'Quick Melds'}
          </button>
        </div>
      </div>

      {/* 选项卡内容 */}
      <div className="min-h-[110px] flex items-center justify-center p-2 bg-[#0c2e1c]/60 rounded-xl border border-emerald-800/60">
        {/* 1. 筒子 */}
        {activeTab === 'tong' && (
          <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 py-1">
            {TONG_TILES.map((t) => {
              const used = getUsedCount(t.id);
              return (
                <MahjongTile
                  key={t.id}
                  tile={t}
                  size="md"
                  badge={used > 0 ? `${used}/4` : undefined}
                  disabled={used >= 4}
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
              const used = getUsedCount(t.id);
              return (
                <MahjongTile
                  key={t.id}
                  tile={t}
                  size="md"
                  badge={used > 0 ? `${used}/4` : undefined}
                  disabled={used >= 4}
                  onClick={() => handleTileClick(t)}
                />
              );
            })}
            <div className="w-px h-12 bg-emerald-700/60 mx-1 hidden sm:block" />
            {DRAGON_TILES.map((t) => {
              const used = getUsedCount(t.id);
              return (
                <MahjongTile
                  key={t.id}
                  tile={t}
                  size="md"
                  badge={used > 0 ? `${used}/4` : undefined}
                  disabled={used >= 4}
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
                const used = getUsedCount('fei_1') + getUsedCount('fei_2') + getUsedCount('fei_3') + getUsedCount('fei_4');
                const isThisUsed = idx < used;
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
                  const used = getUsedCount(t.id);
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
                  const used = getUsedCount(t.id);
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
