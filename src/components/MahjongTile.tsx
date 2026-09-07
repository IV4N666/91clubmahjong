import React from 'react';
import { MahjongTileData } from '../types/mahjong';
import { soundFx } from '../utils/soundEffects';

interface MahjongTileProps {
  tile: MahjongTileData;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  badge?: string | number;
  highlight?: boolean;
  disabled?: boolean;
}

export const MahjongTile: React.FC<MahjongTileProps> = ({
  tile,
  size = 'md',
  selected = false,
  onClick,
  onRemove,
  badge,
  highlight = false,
  disabled = false,
}) => {
  const handleClick = () => {
    if (disabled) return;
    soundFx.playTileClick();
    if (onClick) onClick();
  };

  // 尺寸预设
  const sizeClasses = {
    xs: 'w-7 h-10 text-xs rounded',
    sm: 'w-9 h-12 text-sm rounded-md',
    md: 'w-11 h-16 text-base rounded-md',
    lg: 'w-14 h-20 text-xl rounded-lg',
    xl: 'w-16 h-24 text-2xl rounded-xl',
  };

  // 渲染麻将牌面
  const renderTileFace = () => {
    switch (tile.category) {
      case 'tong': {
        const val = Number(tile.value);
        return (
          <div className="flex flex-col items-center justify-center w-full h-full select-none">
            <span className="font-mahjong font-black text-slate-800 leading-none">
              {val}
            </span>
            <span
              className="text-[0.65em] font-black uppercase tracking-tighter mt-0.5"
              style={{ color: tile.color || '#2563eb' }}
            >
              ● 筒
            </span>
          </div>
        );
      }
      case 'wind': {
        return (
          <div className="flex flex-col items-center justify-center w-full h-full select-none">
            <span className="font-mahjong font-black text-slate-900 leading-tight">
              {tile.nameZh.charAt(0)}
            </span>
            <span className="text-[0.55em] font-semibold text-slate-500 uppercase tracking-tighter">
              {tile.value}
            </span>
          </div>
        );
      }
      case 'dragon': {
        const char = tile.value === 'zhong' ? '中' : tile.value === 'fa' ? '發' : '白';
        return (
          <div className="flex flex-col items-center justify-center w-full h-full select-none">
            {tile.value === 'bai' ? (
              <div className="w-3/5 h-4/5 border-2 border-dashed border-sky-600 rounded flex items-center justify-center">
                <span className="text-[0.6em] font-bold text-sky-600">白</span>
              </div>
            ) : (
              <span
                className="font-mahjong font-black leading-none"
                style={{ color: tile.color || '#dc2626' }}
              >
                {char}
              </span>
            )}
          </div>
        );
      }
      case 'fei': {
        return (
          <div className="flex flex-col items-center justify-center w-full h-full select-none bg-amber-50/50 rounded">
            <span className="font-mahjong font-black text-amber-700 leading-none">
              飛
            </span>
            <span className="text-[0.55em] font-extrabold text-amber-600 uppercase tracking-tight">
              JOKER
            </span>
          </div>
        );
      }
      case 'flower': {
        const isSeason = ['chun', 'xia', 'qiu', 'dong'].includes(String(tile.value));
        return (
          <div className="flex flex-col items-center justify-center w-full h-full select-none">
            <div className="flex items-center justify-between w-full px-1">
              <span className={`text-[0.6em] font-bold ${isSeason ? 'text-red-600' : 'text-blue-600'}`}>
                {tile.flowerNumber}
              </span>
              <span className="text-[0.55em] text-slate-400">花</span>
            </div>
            <span
              className="font-mahjong font-bold text-slate-900 leading-tight"
              style={{ color: tile.color }}
            >
              {tile.nameZh}
            </span>
          </div>
        );
      }
      case 'animal': {
        const emojis: Record<string, string> = {
          cat: '🐱',
          rat: '🐭',
          rooster: '🐓',
          centipede: '🐛',
        };
        return (
          <div className="flex flex-col items-center justify-center w-full h-full select-none">
            <span className="text-lg leading-none filter drop-shadow-sm">
              {emojis[String(tile.value)] || '🐾'}
            </span>
            <span
              className="font-mahjong font-bold text-[0.7em] mt-0.5"
              style={{ color: tile.color }}
            >
              {tile.nameZh}
            </span>
          </div>
        );
      }
    }
  };

  return (
    <div className="relative inline-block group">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={`
          ${sizeClasses[size]}
          relative flex items-center justify-center transition-all duration-150 transform
          bg-gradient-to-b from-[#ffffff] to-[#f4eee1]
          border border-[#d7ceb8] mahjong-tile-shadow
          ${selected ? 'ring-2 ring-amber-400 -translate-y-2 shadow-xl scale-105' : 'hover:-translate-y-0.5 active:translate-y-0.5'}
          ${highlight ? 'ring-2 ring-emerald-400 shadow-emerald-500/20' : ''}
          ${disabled ? 'opacity-40 cursor-not-allowed filter grayscale' : 'cursor-pointer'}
        `}
      >
        {/* 麻将背面绿色底边缘质感 */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-[#0f5431] rounded-b-sm opacity-90" />

        {/* 牌面图案 */}
        <div className="w-full h-full p-0.5 flex items-center justify-center pb-1">
          {renderTileFace()}
        </div>

        {/* 角标 (如张数、咬到标记) */}
        {badge !== undefined && (
          <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-950 font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-md border border-white">
            {badge}
          </span>
        )}
      </button>

      {/* 删除小红叉 (仅当有 onRemove 回调时显示) */}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md transition-transform hover:scale-110 active:scale-95 z-10"
          title="移除"
        >
          ×
        </button>
      )}
    </div>
  );
};
