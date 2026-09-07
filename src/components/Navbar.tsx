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
  activeTab?: 'calculator' | 'game';
  onSelectTab?: (tab: 'calculator' | 'game') => void;
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
  activeTab = 'calculator',
  onSelectTab,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0c2f1d]/95 backdrop-blur-md border-b border-emerald-800/60 shadow-lg px-2 py-2 sm:px-6 sm:py-2.5 w-full max-w-full overflow-x-hidden">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-1 sm:gap-2">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <h1 className="font-black text-base sm:text-lg bg-gradient-to-r from-amber-300 via-amber-200 to-emerald-100 bg-clip-text text-transparent tracking-wide whitespace-nowrap">
            91Club
          </h1>
        </div>

        {/* 顶部快捷操作 (全部纯图标，让手机端清空/刷新等所有功能完整展示) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {activeTab === 'calculator' && (
            <>
              {/* 1. 范例手牌 */}
              <button
                type="button"
                onClick={onLoadSample}
                className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 flex items-center justify-center shadow-sm transition active:scale-95 shrink-0"
                title="换高手范例手牌"
                aria-label="换高手范例手牌"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
              </button>

              {/* 2. 拍照识牌 */}
              <button
                type="button"
                onClick={onOpenCamera}
                className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 flex items-center justify-center shadow-md transition active:scale-95 shrink-0"
                title="拍照识别手牌"
                aria-label="拍照识别手牌"
              >
                <Camera className="w-4 h-4" />
              </button>
            </>
          )}

          {/* 3. 战绩账本与终局转账 */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="relative w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-amber-300 border border-amber-500/40 flex items-center justify-center shadow-sm transition active:scale-95 shrink-0"
            title="查看战绩账本与转账结算"
            aria-label="查看战绩账本与转账结算"
          >
            <History className="w-4 h-4 text-amber-400" />
            {roundsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow border border-slate-900 leading-none">
                {roundsCount}
              </span>
            )}
          </button>

          {/* 4. 规则与底价设置 */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/50 flex items-center justify-center shadow-sm transition active:scale-95 shrink-0"
            title="设置底价 RM、倍数与起胡番数"
            aria-label="设置底价与倍数"
          >
            <Settings className="w-4 h-4 text-amber-300" />
          </button>

          {/* 5. 新手百科与规则 */}
          <button
            type="button"
            onClick={onOpenRules}
            className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/50 flex items-center justify-center shadow-sm transition active:scale-95 shrink-0"
            title="查看大马三人麻将番数表与规则"
            aria-label="查看规则指南"
          >
            <BookOpen className="w-4 h-4 text-emerald-300" />
          </button>

          {/* 6. 扫码分享 */}
          <button
            type="button"
            onClick={onOpenQRCode}
            className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-amber-300 border border-emerald-700/50 flex items-center justify-center shadow-sm transition active:scale-95 shrink-0"
            title="手机扫码直接打开"
            aria-label="扫码分享"
          >
            <QrCode className="w-4 h-4 text-amber-300" />
          </button>

          {activeTab === 'calculator' && (
            /* 7. 一键刷新 / 清空手牌 */
            <button
              type="button"
              onClick={onClearHand}
              className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/60 flex items-center justify-center shadow-sm transition active:scale-95 shrink-0"
              title="刷新/清空当前手牌"
              aria-label="刷新/清空当前手牌"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
