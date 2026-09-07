import React from 'react';
import {
  Settings,
  BookOpen,
  Camera,
  RotateCcw,
  Sparkles,
  History,
  QrCode,
} from 'lucide-react';

interface NavbarProps {
  onOpenSettings: () => void;
  onOpenRules: () => void;
  onOpenHistory: () => void;
  onOpenQRCode: () => void;
  roundsCount: number;
  onOpenCamera: () => void;
  onClearHand: () => void;
  onLoadSample: () => void;
  // 保持接口兼容
  lang?: 'zh' | 'en';
  onToggleLang?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSettings,
  onOpenRules,
  onOpenHistory,
  onOpenQRCode,
  roundsCount,
  onOpenCamera,
  onClearHand,
  onLoadSample,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0c2f1d]/95 backdrop-blur-md border-b border-emerald-800/60 shadow-lg px-2 py-2 sm:px-6 sm:py-2.5 w-full max-w-full overflow-x-hidden">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-1 sm:gap-2">
        {/* Logo & 标题 */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 border border-emerald-400/40 flex items-center justify-center shadow-md text-lg sm:text-xl">
            🀄
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h1 className="font-mahjong font-extrabold text-sm sm:text-base text-emerald-100 tracking-wide whitespace-nowrap">
                大马三人麻将
              </h1>
              <span className="bg-amber-500/20 text-amber-300 text-[9px] font-bold px-1 py-0.2 rounded border border-amber-500/30 shrink-0">
                拉飞
              </span>
            </div>
          </div>
        </div>

        {/* 顶部快捷操作 */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* 范例手牌 */}
          <button
            type="button"
            onClick={onLoadSample}
            className="flex items-center gap-1 text-xs font-semibold p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-emerald-800/70 hover:bg-emerald-700/80 text-emerald-200 border border-emerald-700 transition shrink-0"
            title="换高手范例手牌"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">范例</span>
          </button>

          {/* 拍照识牌 */}
          <button
            type="button"
            onClick={onOpenCamera}
            className="flex items-center gap-1 text-xs font-bold px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md transition whitespace-nowrap shrink-0"
            title="拍照识别手牌"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>拍照</span>
            <span className="hidden sm:inline">识牌</span>
          </button>

          {/* 战绩账本与终局转账 */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="flex items-center gap-1 text-xs font-bold px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-amber-300 border border-amber-500/40 shadow-sm transition whitespace-nowrap shrink-0"
            title="查看牌局总账本与自动转账方案"
          >
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span>账本</span>
            {roundsCount > 0 && (
              <span className="ml-0.5 bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {roundsCount}
              </span>
            )}
          </button>

          {/* 规则与底价设置 */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 sm:px-2 sm:py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/50 flex items-center gap-1 text-xs transition shrink-0"
            title="设置底价 RM、倍数与起胡番数"
          >
            <Settings className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden md:inline">底价</span>
          </button>

          {/* 新手百科 */}
          <button
            type="button"
            onClick={onOpenRules}
            className="p-1.5 sm:px-2 sm:py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/50 flex items-center gap-1 text-xs transition shrink-0"
            title="查看大马三人麻将番数表与规则"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden md:inline">规则</span>
          </button>

          {/* 扫码分享 */}
          <button
            type="button"
            onClick={onOpenQRCode}
            className="p-1.5 sm:px-2 sm:py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-amber-300 border border-emerald-700/50 flex items-center gap-1 text-xs transition shrink-0"
            title="手机扫码直接打开"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden lg:inline">扫码</span>
          </button>

          {/* 一键清空 */}
          <button
            type="button"
            onClick={onClearHand}
            className="p-1.5 rounded-lg bg-red-950/50 hover:bg-red-900/80 text-red-300 border border-red-800/60 transition shrink-0"
            title="清空当前手牌"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
