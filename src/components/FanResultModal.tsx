import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { CalculationResult, RuleSettings, WinningConditions, Player } from '../types/mahjong';
import { soundFx } from '../utils/soundEffects';
import {
  Trophy,
  X,
  Share2,
  Check,
  AlertCircle,
  Receipt,
  Sparkles,
  Coins,
  BookmarkPlus,
  UserCheck,
} from 'lucide-react';

interface FanResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: CalculationResult | null;
  rules: RuleSettings;
  conditions: WinningConditions;
  lang: 'zh' | 'en';
  players: Player[];
  onRecordRound: (winnerId: string, shooterId?: string) => void;
  roundRecorded: boolean;
}

export const FanResultModal: React.FC<FanResultModalProps> = ({
  isOpen,
  onClose,
  result,
  rules,
  conditions,
  lang,
  players,
  onRecordRound,
  roundRecorded,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedWinnerId, setSelectedWinnerId] = useState<string>(players[0]?.id || 'p1');
  const [selectedShooterId, setSelectedShooterId] = useState<string>(players[1]?.id || 'p2');

  useEffect(() => {
    if (players.length > 0) {
      setSelectedWinnerId(players[0].id);
      setSelectedShooterId(players[1]?.id || players[0].id);
    }
  }, [players, isOpen]);

  useEffect(() => {
    if (isOpen && result && result.isWin) {
      soundFx.playWin();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#ef4444', '#3b82f6'],
        });
      } catch {
        // ignore
      }
    }
  }, [isOpen, result]);

  if (!isOpen || !result) return null;

  const { payout, totalFan, effectiveFan, fanItems, warnings, handPatternNameZh, handPatternNameEn } = result;

  // 复制结算单到剪贴板，方便发到微信或 WhatsApp 群
  const handleCopyReceipt = () => {
    const lines = [
      `🀄 【马来西亚三人麻将 结算单】`,
      `牌型：${handPatternNameZh}`,
      `状态：${conditions.isZimo ? '自摸' : '出冲'}`,
      `总番数：${totalFan} 番${rules.maxFan > 0 && totalFan > rules.maxFan ? ` (封顶 ${effectiveFan} 番)` : ''}`,
      `底价：RM ${payout.basePrice.toFixed(2)}`,
      `-----------------------`,
      ...fanItems.map(item => `• ${item.nameZh}：+${item.fan} 番`),
      `-----------------------`,
      conditions.isZimo
        ? `💰 两家各付：RM ${payout.eachPayIfZimo.toFixed(2)} | 赢家总收：RM ${payout.winnerReceivedTotal.toFixed(2)}`
        : `💰 出冲包赔：RM ${payout.shooterPays.toFixed(2)} | 赢家总收：RM ${payout.winnerReceivedTotal.toFixed(2)}`,
    ];

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#14482e] to-[#0c2c1b] border border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* 顶部标题 */}
        <div className="relative bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 p-4 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-slate-950 fill-slate-950" />
            <div>
              <h2 className="font-mahjong font-black text-lg sm:text-xl leading-tight">
                {lang === 'zh' ? '胡牌结算账单' : 'Winning Fan & Payout'}
              </h2>
              <span className="text-xs font-bold text-amber-950">
                {lang === 'zh' ? handPatternNameZh : handPatternNameEn}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-slate-950 flex items-center justify-center text-sm font-bold transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 滚动内容区 */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-100 flex-1">
          {/* 起胡警告 */}
          {warnings.length > 0 && (
            <div className="bg-red-950/80 border border-red-500/80 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-red-300">
                  {lang === 'zh' ? '起胡或牌型警告：' : 'Warning:'}
                </span>
                <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                  {warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* 核心番数与金钱大卡片 */}
          <div className="bg-[#0b2919] border border-amber-500/40 rounded-2xl p-4 text-center relative overflow-hidden shadow-inner">
            <div className="absolute -right-6 -bottom-6 opacity-10 text-9xl select-none font-mahjong">
              🀄
            </div>

            <div className="text-xs text-emerald-300 font-semibold tracking-wider uppercase mb-1">
              {lang === 'zh' ? '本局最终番数' : 'Final Effective Fan'}
            </div>

            <div className="flex items-center justify-center gap-3">
              <span className="font-fun text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-200 filter drop-shadow">
                {effectiveFan}
              </span>
              <span className="text-xl sm:text-2xl font-mahjong font-bold text-amber-400 self-end pb-2">
                {lang === 'zh' ? '番' : 'Fan'}
              </span>
              {rules.maxFan > 0 && totalFan > rules.maxFan && (
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full self-start">
                  {lang === 'zh' ? `封顶 (原 ${totalFan} 番)` : `Capped (Raw ${totalFan})`}
                </span>
              )}
            </div>

            {/* 赢家总收益 (RM) */}
            <div className="mt-3 pt-3 border-t border-emerald-800/80 flex items-center justify-around text-center">
              <div>
                <span className="text-[11px] text-emerald-400 block">
                  {lang === 'zh' ? '底价' : 'Base Stake'}
                </span>
                <span className="font-bold text-emerald-200 text-sm">
                  RM {payout.basePrice.toFixed(2)}
                </span>
              </div>

              <div className="w-px h-8 bg-emerald-800/80" />

              <div>
                <span className="text-[11px] text-amber-300 block font-semibold">
                  {conditions.isZimo ? (lang === 'zh' ? '两家各付' : 'Each Pays') : (lang === 'zh' ? '出冲者付' : 'Shooter Pays')}
                </span>
                <span className="font-black text-amber-300 text-base sm:text-lg">
                  RM {conditions.isZimo ? payout.eachPayIfZimo.toFixed(2) : payout.shooterPays.toFixed(2)}
                </span>
              </div>

              <div className="w-px h-8 bg-emerald-800/80" />

              <div>
                <span className="text-[11px] text-emerald-400 block">
                  {lang === 'zh' ? '赢家总共实收' : 'Winner Total'}
                </span>
                <span className="font-black text-emerald-100 text-base sm:text-lg text-emerald-300">
                  RM {payout.winnerReceivedTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* 番数组成明细 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                {lang === 'zh' ? '番数明细清单' : 'Fan Breakdown'}
              </span>
              <span className="text-xs text-emerald-400">
                {fanItems.length} {lang === 'zh' ? '项累计' : 'items'}
              </span>
            </div>

            <div className="bg-emerald-950/70 border border-emerald-800/80 rounded-2xl p-2.5 space-y-1.5 max-h-52 overflow-y-auto">
              {fanItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-800/50 text-xs transition"
                >
                  <div>
                    <div className="font-bold text-emerald-100">
                      {lang === 'zh' ? item.nameZh : item.nameEn}
                    </div>
                    <div className="text-[10px] text-emerald-300/80">
                      {lang === 'zh' ? item.descriptionZh : item.descriptionEn}
                    </div>
                  </div>
                  <div className="font-black text-amber-300 text-sm pl-2 shrink-0">
                    +{item.fan} {lang === 'zh' ? '番' : 'Fan'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 记入战绩账本操作区 */}
          <div className="bg-gradient-to-r from-[#0a2717] to-[#0c311d] border border-amber-500/50 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <BookmarkPlus className="w-4 h-4 text-amber-400" />
                {lang === 'zh' ? '记入本局战绩账本 (自动算转账)' : 'Record to Session Ledger'}
              </span>
              {roundRecorded && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-700">
                  <Check className="w-3.5 h-3.5" />
                  {lang === 'zh' ? '已记入账本' : 'Recorded'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* 选择赢家 */}
              <div>
                <label className="text-[11px] text-emerald-300 font-medium block mb-1">
                  🏆 {lang === 'zh' ? '本局赢家是谁？' : 'Who won this round?'}
                </label>
                <select
                  value={selectedWinnerId}
                  onChange={(e) => setSelectedWinnerId(e.target.value)}
                  className="w-full bg-[#071d11] border border-emerald-700 rounded-xl px-2.5 py-1.5 text-emerald-100 font-bold outline-none focus:ring-1 focus:ring-amber-400"
                >
                  {players.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 如果非自摸，选择放炮出冲者 */}
              {!conditions.isZimo && (
                <div>
                  <label className="text-[11px] text-red-300 font-medium block mb-1">
                    🎯 {lang === 'zh' ? '谁出冲放炮？' : 'Who was the shooter?'}
                  </label>
                  <select
                    value={selectedShooterId}
                    onChange={(e) => setSelectedShooterId(e.target.value)}
                    className="w-full bg-[#071d11] border border-red-800 rounded-xl px-2.5 py-1.5 text-red-200 font-bold outline-none focus:ring-1 focus:ring-red-400"
                  >
                    {players.filter(p => p.id !== selectedWinnerId).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={roundRecorded}
              onClick={() => onRecordRound(selectedWinnerId, conditions.isZimo ? undefined : selectedShooterId)}
              className={`
                w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow
                ${
                  roundRecorded
                    ? 'bg-emerald-950 text-emerald-500 border border-emerald-800 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 cursor-pointer shadow-amber-500/20'
                }
              `}
            >
              {roundRecorded ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{lang === 'zh' ? '本局已保存在账本中' : 'Round Saved to Ledger'}</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-4 h-4" />
                  <span>{lang === 'zh' ? '保存并计入牌局账本' : 'Save Round & Update Balances'}</span>
                </>
              )}
            </button>
          </div>

          {/* 规则说明备注 */}
          <div className="bg-[#0b2919]/60 border border-emerald-800/60 rounded-xl p-2.5 text-[11px] text-emerald-300/90 leading-relaxed">
            <span className="font-bold text-amber-300">💡 {lang === 'zh' ? '结算说明：' : 'Payout Notes:'}</span>
            <p className="mt-0.5">{payout.ruleSummary}</p>
          </div>
        </div>

        {/* 底部按钮栏 */}
        <div className="p-3 bg-[#0a2416] border-t border-emerald-800/80 flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyReceipt}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-100 text-xs font-bold transition shadow"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4 text-amber-300" />}
            <span>{copied ? (lang === 'zh' ? '已复制账单！' : 'Copied!') : (lang === 'zh' ? '复制账单 (发群)' : 'Copy Receipt')}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow transition"
          >
            {lang === 'zh' ? '好的 / 下一把' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
