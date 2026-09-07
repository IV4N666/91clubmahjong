import React from 'react';
import {
  Volume2,
  VolumeX,
  Settings,
  BookOpen,
  Camera,
  RotateCcw,
  Sparkles,
  History,
} from 'lucide-react';
import { soundFx } from '../utils/soundEffects';

interface NavbarProps {
  lang: 'zh' | 'en';
  onToggleLang: () => void;
  onOpenSettings: () => void;
  onOpenRules: () => void;
  onOpenHistory: () => void;
  roundsCount: number;
  onOpenCamera: () => void;
  onClearHand: () => void;
  onLoadSample: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  onToggleLang,
  onOpenSettings,
  onOpenRules,
  onOpenHistory,
  roundsCount,
  onOpenCamera,
  onClearHand,
  onLoadSample,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0c2f1d]/90 backdrop-blur-md border-b border-emerald-800/60 shadow-lg px-3 py-2.5 sm:px-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
        {/* Logo & 标题 */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 border border-emerald-400/40 flex items-center justify-center shadow-md text-2xl">
            🀄
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mahjong font-extrabold text-base sm:text-lg text-emerald-100 tracking-wide">
                {lang === 'zh' ? '大马三人麻将' : 'MY 3P Mahjong'}
              </h1>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
                {lang === 'zh' ? '拉飞版' : 'LaFei'}
              </span>
            </div>
            <p className="text-[11px] text-emerald-300/80 font-medium hidden sm:block">
              {lang === 'zh' ? '算番 · 算钱 · 新手出牌与听牌指导' : 'Fan & Payout Calculator · Beginner Coach'}
            </p>
          </div>
        </div>

        {/* 顶部快捷操作 */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* 范例手牌 */}
          <button
            type="button"
            onClick={onLoadSample}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-800/70 hover:bg-emerald-700/80 text-emerald-200 border border-emerald-700 transition"
            title="载入高手经典手牌"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">{lang === 'zh' ? '换范例' : 'Sample'}</span>
          </button>

          {/* 拍照识牌 */}
          <button
            type="button"
            onClick={onOpenCamera}
            className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md transition"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{lang === 'zh' ? '拍照识牌' : 'Scan'}</span>
          </button>

          {/* 战绩账本与终局转账 */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-amber-300 border border-amber-500/40 shadow-sm transition"
            title="查看牌局总账本与自动转账方案"
          >
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === 'zh' ? '战绩转账' : 'Ledger'}</span>
            {roundsCount > 0 && (
              <span className="ml-0.5 bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {roundsCount}
              </span>
            )}
          </button>

          {/* 新手百科 */}
          <button
            type="button"
            onClick={onOpenRules}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/50 flex items-center gap-1 text-xs transition"
            title="查看大马三人麻将番数表与术语"
          >
            <BookOpen className="w-4 h-4 text-emerald-300" />
            <span className="hidden lg:inline">{lang === 'zh' ? '番数秘籍' : 'Rules'}</span>
          </button>

          {/* 规则与底价设置 */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/50 flex items-center gap-1 text-xs transition"
            title="设置底价 RM、倍数与起胡番数"
          >
            <Settings className="w-4 h-4 text-amber-300" />
            <span className="hidden lg:inline">{lang === 'zh' ? '底价设置' : 'Stakes'}</span>
          </button>

          {/* 音效开关 */}
          <button
            type="button"
            onClick={onToggleSound}
            className="p-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-700/50 transition"
            title={soundEnabled ? '静音' : '开启音效'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* 语言切换 */}
          <button
            type="button"
            onClick={onToggleLang}
            className="px-2 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-700 text-xs font-bold hover:text-white transition"
          >
            {lang === 'zh' ? 'EN' : '中'}
          </button>

          {/* 一键清空 */}
          <button
            type="button"
            onClick={onClearHand}
            className="p-1.5 rounded-lg bg-red-950/50 hover:bg-red-900/80 text-red-300 border border-red-800/60 transition"
            title="清空手牌"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
