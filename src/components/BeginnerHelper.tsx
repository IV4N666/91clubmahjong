import React, { useState } from 'react';
import {
  ShantenAnalysis,
  MahjongTileData,
  RuleSettings,
} from '../types/mahjong';
import { MahjongTile } from './MahjongTile';
import {
  HelpCircle,
  Lightbulb,
  Crosshair,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';

interface BeginnerHelperProps {
  analysis: ShantenAnalysis;
  rules: RuleSettings;
  lang: 'zh' | 'en';
  onSelectDiscardTile?: (tile: MahjongTileData) => void;
}

export const BeginnerHelper: React.FC<BeginnerHelperProps> = ({
  analysis,
  rules,
  lang,
  onSelectDiscardTile,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-[#103b25] border border-amber-500/40 rounded-2xl p-3 sm:p-4 shadow-xl space-y-3">
      {/* 头部状态条 */}
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-mahjong font-bold text-emerald-100 text-sm sm:text-base flex items-center gap-2">
              <span>{lang === 'zh' ? '新手胡牌与打牌教练' : 'Beginner Mahjong Coach'}</span>
              {analysis.isTing && (
                <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">
                  {lang === 'zh' ? '正在听牌！' : 'TING READY!'}
                </span>
              )}
            </h3>
            <p className="text-xs text-emerald-300/80">
              {lang === 'zh' ? analysis.statusMessageZh : analysis.statusMessageEn}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="p-1 rounded-lg text-emerald-300 hover:text-white"
        >
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* 展开的指导内容 */}
      {isExpanded && (
        <div className="space-y-3 pt-2 border-t border-emerald-800/80 text-xs">
          {/* 1. 如果已胡牌 */}
          {analysis.currentShanten === -1 && (
            <div className="bg-emerald-950/80 border border-emerald-500/60 rounded-xl p-3 flex items-center gap-3">
              <CheckCircle className="w-7 h-7 text-emerald-400 shrink-0" />
              <div>
                <h4 className="font-bold text-emerald-200 text-sm">
                  {lang === 'zh' ? '牌型完整，符合胡牌标准！' : 'Complete Winning Hand!'}
                </h4>
                <p className="text-emerald-400 mt-0.5">
                  {lang === 'zh'
                    ? '请点击上方金色的【结算番数 & 算钱】按钮，查看详细番数明细、底价收益与收据！'
                    : 'Click "Calculate Fan & Payout" above to view detailed payout.'}
                </p>
              </div>
            </div>
          )}

          {/* 2. 听牌叫胡提示 (13张牌时) */}
          {analysis.isTing && analysis.waitingTiles.length > 0 && (
            <div className="bg-emerald-950/90 border border-amber-500/40 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                <Crosshair className="w-4 h-4" />
                <span>{lang === 'zh' ? '🎯 叫胡目标（摸到或别家打出这几张即可胡牌）：' : 'Waiting Tiles to Win:'}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {analysis.waitingTiles.map((wait, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-[#0c2e1c] border border-emerald-700/80 rounded-xl px-2.5 py-1.5 shadow"
                  >
                    <MahjongTile tile={wait.tile} size="sm" highlight />
                    <div>
                      <div className="font-bold text-emerald-100 text-xs">
                        {wait.tile.nameZh}
                      </div>
                      <div className="text-[10px] text-amber-300">
                        {lang === 'zh' ? `预估 ${wait.potentialFan} 番起` : `~${wait.potentialFan} Fan`}
                      </div>
                      <div className="text-[10px] text-emerald-400">
                        {lang === 'zh' ? `牌池约剩 ${wait.remainingCount} 张` : `~${wait.remainingCount} left`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. 新手出牌建议 (14张牌时推荐打哪张) */}
          {analysis.discardSuggestions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-200 font-bold">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>{lang === 'zh' ? '💡 建议打哪张牌？（点击牌可直接舍牌）：' : 'Discard Suggestions:'}</span>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {analysis.discardSuggestions.slice(0, 4).map((sug, idx) => {
                  return (
                    <div
                      key={idx}
                      onClick={() => onSelectDiscardTile && onSelectDiscardTile(sug.tile)}
                      className={`
                        flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer
                        ${
                          sug.isRecommended
                            ? 'bg-gradient-to-r from-amber-950/80 to-emerald-950/90 border-amber-400/60 shadow-md ring-1 ring-amber-400/30'
                            : 'bg-emerald-950/60 border-emerald-800 hover:bg-emerald-900/60'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2.5">
                        <MahjongTile tile={sug.tile} size="sm" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-emerald-100">
                              {lang === 'zh' ? `打出【${sug.tile.nameZh}】` : `Discard ${sug.tile.nameEn}`}
                            </span>
                            {sug.isRecommended && (
                              <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded">
                                ⭐ {lang === 'zh' ? '最优推荐' : 'Best Choice'}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-emerald-300/90 mt-0.5">
                            {lang === 'zh' ? sug.reasonZh : sug.reasonEn}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-2">
                        <span className="text-[11px] font-bold text-amber-300 block">
                          {sug.shantenAfter === 0
                            ? (lang === 'zh' ? '直接进听' : 'Enters Ting')
                            : (lang === 'zh' ? '一向听' : '1-away')}
                        </span>
                        {sug.waitingTilesCount > 0 && (
                          <span className="text-[10px] text-emerald-400 block">
                            {sug.waitingTilesCount} {lang === 'zh' ? '张机会' : 'outs'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. 新手番数起胡温馨提示 */}
          <div className="bg-emerald-950/50 border border-emerald-800/80 rounded-xl p-2.5 flex items-start gap-2 text-[11px] text-emerald-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300">
                {lang === 'zh' ? `马来西亚规矩：${rules.minFan} 番起胡` : `Rule: ${rules.minFan} Fan to Win`}
              </span>
              <p className="text-emerald-400/90 mt-0.5 leading-relaxed">
                {lang === 'zh'
                  ? '三人麻将如果没有 5 番是不能胡牌的。平时尽量多保留飞牌（百搭+1番）、中发白刻子（+1番）、摸花牌或动物（猫鼠鸡蜈蚣咬到+1番），或者做碰碰胡、混一色，才能轻松过 5 番！'
                  : 'You must reach at least 5 Fan. Aim for Pongs, Dragons, Fei jokers, and Animal bites to boost your score!'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
