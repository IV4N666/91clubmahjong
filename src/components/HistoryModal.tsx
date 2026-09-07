import React, { useState } from 'react';
import { Player, GameRoundRecord } from '../types/mahjong';
import { calculateSessionSettlement } from '../utils/transferCalculator';
import {
  History,
  X,
  Share2,
  Check,
  Trash2,
  UserCheck,
  Coins,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Edit2,
} from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  rounds: GameRoundRecord[];
  onUpdatePlayerNames: (players: Player[]) => void;
  onDeleteRound: (roundId: string) => void;
  onResetSession: () => void;
  lang: 'zh' | 'en';
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  players,
  rounds,
  onUpdatePlayerNames,
  onDeleteRound,
  onResetSession,
  lang,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditingNames, setIsEditingNames] = useState(false);
  const [tempNames, setTempNames] = useState<string[]>(players.map(p => p.name));

  if (!isOpen) return null;

  const settlement = calculateSessionSettlement(players, rounds);

  const handleSaveNames = () => {
    const updated = players.map((p, idx) => ({
      ...p,
      name: tempNames[idx]?.trim() || p.name,
    }));
    onUpdatePlayerNames(updated);
    setIsEditingNames(false);
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(settlement.formattedShareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#14482e] to-[#0c2c1b] border border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 border-b border-emerald-700/60 p-4 text-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-mahjong font-bold text-base sm:text-lg">
                {lang === 'zh' ? '战绩账本与终局转账结算' : 'Session History & Transfers'}
              </h2>
              <p className="text-[11px] text-emerald-300">
                {lang === 'zh' ? '自动汇总谁赢谁输，打完直接看谁转给谁' : 'Aggregates net balance and minimal P2P transfers'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-emerald-300 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 滚动内容 */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-100 flex-1 text-xs">
          {/* 1. 玩家名字修改折叠面板 */}
          <div className="bg-[#0b2919] border border-emerald-800 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                {lang === 'zh' ? '牌桌三位玩家姓名：' : 'Players:'}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (isEditingNames) handleSaveNames();
                  else {
                    setTempNames(players.map(p => p.name));
                    setIsEditingNames(true);
                  }
                }}
                className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{isEditingNames ? (lang === 'zh' ? '保存名字' : 'Save') : (lang === 'zh' ? '修改姓名' : 'Edit Names')}</span>
              </button>
            </div>

            {isEditingNames ? (
              <div className="grid grid-cols-3 gap-2 pt-1">
                {players.map((p, idx) => (
                  <div key={p.id}>
                    <label className="text-[10px] text-emerald-400 block mb-0.5">
                      {lang === 'zh' ? `玩家 ${idx + 1}` : `Player ${idx + 1}`}
                    </label>
                    <input
                      type="text"
                      value={tempNames[idx] || ''}
                      onChange={(e) => {
                        const next = [...tempNames];
                        next[idx] = e.target.value;
                        setTempNames(next);
                      }}
                      className="w-full bg-[#0c2e1c] border border-emerald-700 rounded-lg px-2 py-1 text-amber-300 font-bold text-xs outline-none focus:ring-1 focus:ring-amber-400"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-around gap-2 pt-1">
                {players.map((p, idx) => (
                  <div key={p.id} className="text-center">
                    <span className="text-[10px] text-emerald-400 block">
                      {idx === 0 ? '我' : idx === 1 ? '对家' : '下家'}
                    </span>
                    <span className="font-bold text-emerald-100 text-xs">
                      {p.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. 战绩总览计分板 (Scoreboard) */}
          <div className="grid grid-cols-3 gap-2">
            {settlement.playerBalances.map(({ player, balance }) => {
              const isWinner = balance > 0;
              const isLoser = balance < 0;
              const winRoundsCount = rounds.filter(r => r.winnerId === player.id).length;

              return (
                <div
                  key={player.id}
                  className={`
                    p-3 rounded-2xl border text-center transition shadow
                    ${
                      isWinner
                        ? 'bg-emerald-950/80 border-emerald-500/80'
                        : isLoser
                        ? 'bg-red-950/60 border-red-800/80'
                        : 'bg-[#0b2919] border-emerald-800'
                    }
                  `}
                >
                  <div className="text-[11px] text-emerald-300 font-bold truncate">
                    {player.name}
                  </div>
                  <div
                    className={`font-fun text-lg sm:text-xl font-black mt-1 ${
                      isWinner ? 'text-emerald-300' : isLoser ? 'text-red-400' : 'text-slate-300'
                    }`}
                  >
                    {balance > 0 ? '+' : ''}RM {balance.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-emerald-400/80 block mt-0.5">
                    {lang === 'zh' ? `胡牌 ${winRoundsCount} 局` : `${winRoundsCount} Wins`}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 3. 终局一键转账方案 (The Transfer Calculator) */}
          <div className="bg-gradient-to-r from-amber-950/90 via-emerald-950/90 to-amber-950/90 border-2 border-amber-500/60 rounded-2xl p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
              <span className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
                <Coins className="w-5 h-5 text-amber-400 animate-bounce" />
                {lang === 'zh' ? '📲 打完打完！终局一键转账方案 (DuitNow / TNG)' : 'Final P2P Transfer Instructions'}
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">
                {lang === 'zh' ? '自动核平' : 'Zero-sum Verified'}
              </span>
            </div>

            {settlement.transfers.length === 0 ? (
              <div className="py-4 text-center text-emerald-400/80">
                {rounds.length === 0
                  ? (lang === 'zh' ? '暂无对局记录。请在胡牌结算弹窗中点击【记入账本】。' : 'No rounds recorded yet.')
                  : (lang === 'zh' ? '各位收支正好平衡，无需互相转账！' : 'All balances are even!')}
              </div>
            ) : (
              <div className="space-y-2">
                {settlement.transfers.map((tr, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-[#0a2315] border border-amber-500/40 rounded-xl p-3 shadow-inner"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-300 font-bold flex items-center justify-center text-xs">
                        付
                      </span>
                      <span className="font-bold text-red-300 text-sm">
                        {tr.fromPlayerName}
                      </span>
                      <ArrowRight className="w-4 h-4 text-amber-400 mx-1" />
                      <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs">
                        收
                      </span>
                      <span className="font-bold text-emerald-300 text-sm">
                        {tr.toPlayerName}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-amber-300 text-base sm:text-lg">
                        RM {tr.amount.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-amber-400/80 block">
                        DuitNow / TNG
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 一键复制转账单按钮 */}
            <button
              type="button"
              onClick={handleCopyShare}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? (lang === 'zh' ? '已复制对账单！' : 'Copied!') : (lang === 'zh' ? '复制转账单 (发给 WhatsApp / 微信群)' : 'Copy Transfers to WhatsApp')}</span>
            </button>
          </div>

          {/* 4. 每局历史流水明细 (Round-by-round history) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-200">
                {lang === 'zh' ? `历史对局明细 (共 ${rounds.length} 局)：` : `Rounds History (${rounds.length}):`}
              </span>
              {rounds.length > 0 && (
                <button
                  type="button"
                  onClick={onResetSession}
                  className="text-red-400 hover:text-red-300 text-[11px] flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{lang === 'zh' ? '新开一局 (清空记录)' : 'Reset Session'}</span>
                </button>
              )}
            </div>

            {rounds.length === 0 ? (
              <div className="bg-[#0b2919] border border-emerald-800 rounded-xl p-4 text-center text-emerald-500">
                {lang === 'zh' ? '暂无历史局数' : 'No history yet'}
              </div>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {rounds.map((round) => {
                  const winner = players.find(p => p.id === round.winnerId)?.name || '未知';
                  const shooter = round.shooterId ? players.find(p => p.id === round.shooterId)?.name : null;

                  return (
                    <div
                      key={round.id}
                      className="bg-[#0c2e1c] border border-emerald-800 rounded-xl p-2.5 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-400 text-xs">
                            第 {round.roundNumber} 局
                          </span>
                          <span className="font-bold text-emerald-100">
                            【{winner}】{round.winType === 'zimo' ? '自摸' : `出冲 (由${shooter}放炮)`}
                          </span>
                          <span className="bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded text-[10px] border border-emerald-700">
                            {round.effectiveFan} 番 ({round.handPattern})
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-400/80 mt-0.5">
                          {round.notes || `总计进账 RM ${round.totalPot.toFixed(2)}`}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-black text-amber-300 text-sm">
                          +RM {round.totalPot.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeleteRound(round.id)}
                          className="w-6 h-6 rounded bg-red-950/60 hover:bg-red-800 text-red-300 flex items-center justify-center transition"
                          title="删除此局"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0a2416] border-t border-emerald-800/80 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-bold text-xs transition shadow"
          >
            {lang === 'zh' ? '关闭' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
