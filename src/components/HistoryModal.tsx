import React, { useState, useMemo } from 'react';
import { Player, GameRoundRecord, RuleSettings } from '../types/mahjong';
import { calculateSessionSettlement, normalizeRoundRecord } from '../utils/transferCalculator';
import {
  History,
  X,
  Share2,
  Check,
  Trash2,
  UserCheck,
  Coins,
  ArrowRight,
  RotateCcw,
  Edit2,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Trophy,
  Target,
  Zap,
} from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  rounds: GameRoundRecord[];
  rules?: RuleSettings;
  onUpdatePlayerNames: (players: Player[]) => void;
  onDeleteRound: (roundId: string) => void;
  onResetSession: () => void;
  onAddManualRound?: (record: GameRoundRecord) => void;
  lang: 'zh' | 'en';
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  players,
  rounds,
  rules,
  onUpdatePlayerNames,
  onDeleteRound,
  onResetSession,
  onAddManualRound,
  lang,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditingNames, setIsEditingNames] = useState(false);
  const [tempNames, setTempNames] = useState<string[]>(players.map(p => p.name));

  // 实体牌桌手动记账状态
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [manualEntryType, setManualEntryType] = useState<'quick' | 'custom'>('quick');
  const [manualWinnerId, setManualWinnerId] = useState<string>(players[0]?.id || 'p1');
  const [manualWinType, setManualWinType] = useState<'zimo' | 'discard'>('zimo');
  const [manualShooterId, setManualShooterId] = useState<string>(players[1]?.id || 'p2');
  const [manualAmount, setManualAmount] = useState<string>('10');
  const [customLosses, setCustomLosses] = useState<Record<string, string>>({});
  const [manualNotes, setManualNotes] = useState<string>('');

  // 飞牌与杠牌辅助算番加成状态
  const [showFeiKongHelper, setShowFeiKongHelper] = useState(false);
  const [helperBaseFan, setHelperBaseFan] = useState<number>(() => rules?.minFan || 3);
  const [helperFeiCount, setHelperFeiCount] = useState<number>(0);
  const [helperMingKongCount, setHelperMingKongCount] = useState<number>(0);
  const [helperAnKongCount, setHelperAnKongCount] = useState<number>(0);
  const [helperIsKongBloom, setHelperIsKongBloom] = useState<boolean>(false);

  // 辅助计算总番数
  const calculatedHelperFan = useMemo(() => {
    let fan = helperBaseFan;
    if (helperFeiCount === 4) {
      fan = rules?.fourFeiWinFan || 10;
    } else {
      fan += helperFeiCount;
    }
    fan += helperMingKongCount * 1;
    fan += helperAnKongCount * 2;
    if (helperIsKongBloom) fan += (rules?.kongBloomFan || 1);
    return fan;
  }, [helperBaseFan, helperFeiCount, helperMingKongCount, helperAnKongCount, helperIsKongBloom, rules]);

  // 辅助折算金额
  const activeBasePrice = rules?.basePrice || 1.0;
  const calculatedHelperAmount = useMemo(() => {
    let effFan = calculatedHelperFan;
    if (rules?.maxFan && rules.maxFan > 0 && effFan > rules.maxFan) {
      effFan = rules.maxFan;
    }
    return Number((effFan * activeBasePrice).toFixed(2));
  }, [calculatedHelperFan, activeBasePrice, rules?.maxFan]);

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

  // 实时分账预览计算
  const currentPreview = (() => {
    const winner = players.find(p => p.id === manualWinnerId)?.name || '赢家';
    if (manualEntryType === 'quick') {
      const amt = Math.max(0, parseFloat(manualAmount) || 0);
      if (manualWinType === 'zimo') {
        const pot = amt * 2;
        const others = players.filter(p => p.id !== manualWinnerId);
        return {
          winnerName: winner,
          winnerGets: pot,
          losses: others.map(o => ({ id: o.id, name: o.name, pays: amt })),
        };
      } else {
        const actualShooter = manualShooterId && manualShooterId !== manualWinnerId
          ? manualShooterId
          : (players.find(p => p.id !== manualWinnerId)?.id || '');
        const shooterName = players.find(p => p.id === actualShooter)?.name || '放炮者';
        const third = players.find(p => p.id !== manualWinnerId && p.id !== actualShooter);
        return {
          winnerName: winner,
          winnerGets: amt,
          losses: [
            { id: actualShooter, name: shooterName, pays: amt },
            ...(third ? [{ id: third.id, name: third.name, pays: 0 }] : []),
          ],
        };
      }
    } else {
      const others = players.filter(p => p.id !== manualWinnerId);
      const losses = others.map(o => ({
        id: o.id,
        name: o.name,
        pays: Math.max(0, parseFloat(customLosses[o.id] || '0') || 0),
      }));
      const pot = losses.reduce((sum, item) => sum + item.pays, 0);
      return {
        winnerName: winner,
        winnerGets: pot,
        losses,
      };
    }
  })();

  const handleSaveManualRound = () => {
    const payouts: Record<string, number> = {};
    let totalPot = 0;
    let autoNotes = '';

    const winnerName = players.find(p => p.id === manualWinnerId)?.name || '赢家';

    if (manualEntryType === 'quick') {
      const amount = Math.max(0, parseFloat(manualAmount) || 0);
      if (amount <= 0) return;

      if (manualWinType === 'zimo') {
        totalPot = Number((amount * 2).toFixed(2));
        payouts[manualWinnerId] = totalPot;
        players.forEach(p => {
          if (p.id !== manualWinnerId) {
            payouts[p.id] = -Number(amount.toFixed(2));
          }
        });
        autoNotes = `自摸：两家各付 RM ${amount.toFixed(2)}`;
      } else {
        totalPot = Number(amount.toFixed(2));
        payouts[manualWinnerId] = totalPot;
        const actualShooter = manualShooterId && manualShooterId !== manualWinnerId
          ? manualShooterId
          : (players.find(p => p.id !== manualWinnerId)?.id || '');
        const shooterName = players.find(p => p.id === actualShooter)?.name || '放炮者';
        players.forEach(p => {
          if (p.id === actualShooter) {
            payouts[p.id] = -Number(amount.toFixed(2));
          } else if (p.id !== manualWinnerId) {
            payouts[p.id] = 0;
          }
        });
        autoNotes = `出冲：由【${shooterName}】包付 RM ${amount.toFixed(2)}`;
      }
    } else {
      const otherPlayers = players.filter(p => p.id !== manualWinnerId);
      let sumLoss = 0;
      const lossDescParts: string[] = [];

      otherPlayers.forEach(p => {
        const loss = Math.max(0, parseFloat(customLosses[p.id] || '0') || 0);
        payouts[p.id] = -Number(loss.toFixed(2));
        sumLoss += loss;
        if (loss > 0) {
          lossDescParts.push(`${p.name} 付 RM ${loss.toFixed(2)}`);
        }
      });

      if (sumLoss <= 0) return;
      totalPot = Number(sumLoss.toFixed(2));
      payouts[manualWinnerId] = totalPot;
      autoNotes = `指定结算：${lossDescParts.join('，') || `共进账 RM ${totalPot.toFixed(2)}`}`;
    }

    const noteText = manualNotes.trim();
    const finalNotes = noteText ? `${noteText} (${autoNotes})` : autoNotes;

    const newRecord: GameRoundRecord = {
      id: `manual_${Date.now()}`,
      roundNumber: rounds.length + 1,
      timestamp: Date.now(),
      winnerId: manualWinnerId,
      winType: manualEntryType === 'quick' ? manualWinType : 'zimo',
      shooterId: manualEntryType === 'quick' && manualWinType === 'discard' ? manualShooterId : undefined,
      fan: 0,
      effectiveFan: 0,
      handPattern: noteText || (manualWinType === 'zimo' ? '自摸' : '出冲'),
      payouts,
      totalPot,
      notes: finalNotes,
    };

    if (onAddManualRound) {
      onAddManualRound(newRecord);
    }
    setIsAddingManual(false);
    setManualNotes('');
    setCustomLosses({});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#14482e] to-[#0c2c1b] border border-amber-500/50 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 border-b border-emerald-700/60 p-3.5 sm:p-4 text-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <h2 className="font-mahjong font-bold text-base sm:text-lg">
                {lang === 'zh' ? '战绩账本与终局转账结算' : 'Session History & Transfers'}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-emerald-300">
                {lang === 'zh' ? '自动汇总谁赢谁输，打完直接看谁转给谁' : 'Aggregates net balance and minimal P2P transfers'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-emerald-300 flex items-center justify-center transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 滚动内容 */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-3 sm:space-y-4 text-slate-100 flex-1 text-xs">
          {/* 1. 玩家名字修改折叠面板 */}
          <div className="bg-[#0b2919] border border-emerald-800 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 space-y-2">
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

          {/* 实体线下打牌快速记账面板 (Physical Mahjong Manual Entry) */}
          <div className="bg-gradient-to-r from-[#0d341f] via-[#0b2919] to-[#0d341f] border border-amber-500/50 rounded-2xl p-3 sm:p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-bold text-amber-300 text-xs sm:text-sm truncate">
                  {lang === 'zh' ? '🀄 实体牌桌快速记账' : '🀄 Physical Table Ledger'}
                </span>
                <span className="hidden sm:inline-block text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full shrink-0 font-medium">
                  {lang === 'zh' ? '无需算牌·直接记账' : 'Direct Win/Loss'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingManual(prev => !prev)}
                className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition shadow active:scale-95 ${
                  isAddingManual
                    ? 'bg-amber-600/80 text-amber-100 hover:bg-amber-600'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{isAddingManual ? (lang === 'zh' ? '收起' : 'Close') : (lang === 'zh' ? '记一局 +' : 'Add Round +')}</span>
                {isAddingManual ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {isAddingManual && (
              <div className="pt-2.5 border-t border-emerald-800/80 space-y-3 animate-fadeIn">
                {/* 模式选择：快捷模式 vs 精准指定 */}
                <div className="grid grid-cols-2 gap-1.5 bg-[#061e12] p-1 rounded-xl border border-emerald-800">
                  <button
                    type="button"
                    onClick={() => setManualEntryType('quick')}
                    className={`py-1.5 px-1 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition ${
                      manualEntryType === 'quick'
                        ? 'bg-amber-500 text-slate-950 shadow font-black'
                        : 'text-emerald-300 hover:text-emerald-100'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{lang === 'zh' ? '⚡ 快捷模式 (自摸/出冲)' : 'Quick Mode'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualEntryType('custom')}
                    className={`py-1.5 px-1 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition ${
                      manualEntryType === 'custom'
                        ? 'bg-amber-500 text-slate-950 shadow font-black'
                        : 'text-emerald-300 hover:text-emerald-100'
                    }`}
                  >
                    <Target className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{lang === 'zh' ? '🎯 精准指定 (各家金额)' : 'Direct Loss'}</span>
                  </button>
                </div>

                {/* 1. 赢家选择 */}
                <div>
                  <label className="text-[11px] text-amber-300 font-bold block mb-1.5 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{lang === 'zh' ? '本局谁胡牌 (赢家)：' : 'Round Winner:'}</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {players.map((p, idx) => {
                      const isSelected = manualWinnerId === p.id;
                      const roleTag = idx === 0 ? '我' : idx === 1 ? '对家' : '下家';
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setManualWinnerId(p.id);
                            if (manualShooterId === p.id) {
                              const other = players.find(o => o.id !== p.id);
                              if (other) setManualShooterId(other.id);
                            }
                          }}
                          className={`py-2 px-1 sm:px-2 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-0.5 transition min-w-0 ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 shadow-md font-black'
                              : 'bg-[#0a2315] border border-emerald-800 text-emerald-200 hover:bg-emerald-900/60'
                          }`}
                        >
                          <div className="flex items-center gap-1 min-w-0">
                            <Trophy className={`w-3 h-3 shrink-0 ${isSelected ? 'text-slate-950' : 'text-amber-400'}`} />
                            <span className="truncate max-w-[65px] sm:max-w-none">{p.name}</span>
                          </div>
                          <span className={`text-[10px] ${isSelected ? 'text-slate-900 font-bold' : 'text-emerald-400/90'}`}>
                            ({roleTag})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. 快捷模式下的 胡牌方式 & 放炮者 */}
                {manualEntryType === 'quick' ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-emerald-300 font-bold block">
                        {lang === 'zh' ? '胡牌方式：' : 'Win Type:'}
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => setManualWinType('zimo')}
                          className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition ${
                            manualWinType === 'zimo'
                              ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 shadow'
                              : 'bg-[#0a2315] border border-emerald-800 text-emerald-300 hover:bg-emerald-900/60'
                          }`}
                        >
                          <span>🟢 {lang === 'zh' ? '自摸 (两家付)' : 'Self-Drawn'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setManualWinType('discard');
                            if (manualShooterId === manualWinnerId) {
                              const other = players.find(o => o.id !== manualWinnerId);
                              if (other) setManualShooterId(other.id);
                            }
                          }}
                          className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition ${
                            manualWinType === 'discard'
                              ? 'bg-red-700 text-white ring-2 ring-red-400 shadow'
                              : 'bg-[#0a2315] border border-emerald-800 text-emerald-300 hover:bg-emerald-900/60'
                          }`}
                        >
                          <span>🔴 {lang === 'zh' ? '出冲 (一人包付)' : 'Discard'}</span>
                        </button>
                      </div>
                    </div>

                    {manualWinType === 'discard' && (
                      <div className="bg-red-950/40 border border-red-900/60 rounded-xl p-2.5 space-y-1.5">
                        <label className="text-[11px] text-red-300 font-bold block">
                          {lang === 'zh' ? '由谁出冲放炮 (包付)：' : 'Shooter (Paid full):'}
                        </label>
                        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                          {players
                            .filter(p => p.id !== manualWinnerId)
                            .map(p => {
                              const isShooter = manualShooterId === p.id;
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => setManualShooterId(p.id)}
                                  className={`py-1.5 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition min-w-0 ${
                                    isShooter
                                      ? 'bg-red-600 text-white shadow ring-2 ring-red-400'
                                      : 'bg-[#081e13] border border-red-900 text-red-300 hover:bg-red-900/40'
                                  }`}
                                >
                                  <span className="shrink-0">💥</span>
                                  <span className="truncate">{p.name} 放炮</span>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* 🪽 飞牌与杠牌快捷算番加成折叠栏 (Fei & Kong Helper) */}
                    <div className="bg-[#072517] border border-amber-500/40 rounded-xl p-2.5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setShowFeiKongHelper(prev => !prev)}
                          className="flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 min-w-0"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">{lang === 'zh' ? '🪽 飞牌 / 杠牌 自动算番器' : 'Fei & Kong Fan Calculator'}</span>
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded shrink-0">
                            {showFeiKongHelper ? (lang === 'zh' ? '收起 ▲' : 'Hide ▲') : (lang === 'zh' ? '点此展开计算 ▼' : 'Expand ▼')}
                          </span>
                        </button>
                        {calculatedHelperFan > 0 && (
                          <span className="text-[11px] font-black text-amber-300 shrink-0">
                            共 {calculatedHelperFan} 番 · RM {calculatedHelperAmount.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {showFeiKongHelper && (
                        <div className="pt-2 border-t border-emerald-800/80 space-y-2.5 text-xs animate-fadeIn">
                          {/* 基础牌型番数 */}
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <span className="text-emerald-300 text-[11px]">基础牌型番数 (如平胡/清一色)：</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5, 8].map(bf => (
                                <button
                                  key={bf}
                                  type="button"
                                  onClick={() => setHelperBaseFan(bf)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                                    helperBaseFan === bf
                                      ? 'bg-amber-400 text-slate-950 font-black shadow'
                                      : 'bg-[#05170e] text-emerald-300 border border-emerald-700 hover:bg-emerald-900'
                                  }`}
                                >
                                  {bf}番
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 飞牌张数 */}
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <span className="text-emerald-300 text-[11px] flex items-center gap-1">
                              <span>🪽 飞牌张数 (每张 +1 番)：</span>
                            </span>
                            <div className="flex items-center gap-1">
                              {[0, 1, 2, 3, 4].map(fc => (
                                <button
                                  key={fc}
                                  type="button"
                                  onClick={() => setHelperFeiCount(fc)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                                    helperFeiCount === fc
                                      ? 'bg-amber-400 text-slate-950 font-black shadow'
                                      : 'bg-[#05170e] text-emerald-300 border border-emerald-700 hover:bg-emerald-900'
                                  }`}
                                >
                                  {fc === 0 ? '0飞' : fc === 4 ? '4飞满天飞' : `${fc}飞`}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 杠牌加番计数 */}
                          <div className="grid grid-cols-2 gap-2">
                            {/* 明杠 */}
                            <div className="bg-[#05170e] p-2 rounded-xl border border-emerald-800 flex items-center justify-between">
                              <div className="flex flex-col">
                                <span className="text-[11px] text-emerald-200 font-bold">⚡ 明杠</span>
                                <span className="text-[9px] text-emerald-400">+1 番/组</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setHelperMingKongCount(prev => Math.max(0, prev - 1))}
                                  className="w-5 h-5 rounded bg-emerald-900 text-emerald-200 font-bold flex items-center justify-center text-xs hover:bg-emerald-800 active:scale-95"
                                >
                                  -
                                </button>
                                <span className="font-black text-amber-300 text-xs w-4 text-center">{helperMingKongCount}</span>
                                <button
                                  type="button"
                                  onClick={() => setHelperMingKongCount(prev => prev + 1)}
                                  className="w-5 h-5 rounded bg-emerald-900 text-emerald-200 font-bold flex items-center justify-center text-xs hover:bg-emerald-800 active:scale-95"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* 暗杠 */}
                            <div className="bg-[#05170e] p-2 rounded-xl border border-emerald-800 flex items-center justify-between">
                              <div className="flex flex-col">
                                <span className="text-[11px] text-emerald-200 font-bold">🛡️ 暗杠</span>
                                <span className="text-[9px] text-emerald-400">+2 番/组</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setHelperAnKongCount(prev => Math.max(0, prev - 1))}
                                  className="w-5 h-5 rounded bg-emerald-900 text-emerald-200 font-bold flex items-center justify-center text-xs hover:bg-emerald-800 active:scale-95"
                                >
                                  -
                                </button>
                                <span className="font-black text-amber-300 text-xs w-4 text-center">{helperAnKongCount}</span>
                                <button
                                  type="button"
                                  onClick={() => setHelperAnKongCount(prev => prev + 1)}
                                  className="w-5 h-5 rounded bg-emerald-900 text-emerald-200 font-bold flex items-center justify-center text-xs hover:bg-emerald-800 active:scale-95"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* 杠上开花勾选 */}
                          <div className="flex items-center justify-between bg-[#05170e] p-2 rounded-xl border border-emerald-800/70">
                            <label className="flex items-center gap-2 cursor-pointer text-[11px] text-emerald-300">
                              <input
                                type="checkbox"
                                checked={helperIsKongBloom}
                                onChange={(e) => setHelperIsKongBloom(e.target.checked)}
                                className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-0 cursor-pointer"
                              />
                              <span className="font-bold">🌸 杠上开花自摸 (+1 番)</span>
                            </label>
                            <span className="text-[10px] text-amber-400/80 font-medium">
                              底价 RM {activeBasePrice.toFixed(2)}/番
                            </span>
                          </div>

                          {/* 一键填入折算金额 */}
                          <button
                            type="button"
                            onClick={() => {
                              setManualAmount(String(calculatedHelperAmount));
                              const tags: string[] = [];
                              if (helperFeiCount > 0) tags.push(helperFeiCount === 4 ? '满天飞' : `${helperFeiCount}飞`);
                              if (helperMingKongCount > 0) tags.push(`${helperMingKongCount}明杠`);
                              if (helperAnKongCount > 0) tags.push(`${helperAnKongCount}暗杠`);
                              if (helperIsKongBloom) tags.push('杠上开花');
                              if (tags.length > 0) {
                                setManualNotes(prev => {
                                  const existing = prev ? prev.trim() : '';
                                  const newTagStr = tags.join(' ');
                                  return existing ? `${existing} ${newTagStr}` : newTagStr;
                                });
                              }
                            }}
                            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition"
                          >
                            <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                            <span>
                              {lang === 'zh'
                                ? `填入此算番金额：RM ${calculatedHelperAmount.toFixed(2)} (共 ${calculatedHelperFan} 番)`
                                : `Apply: RM ${calculatedHelperAmount.toFixed(2)} (${calculatedHelperFan} Fan)`}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 金额输入 + 快捷药丸 */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <label className="text-amber-300 font-bold">
                          {manualWinType === 'zimo'
                            ? (lang === 'zh' ? '每家各付金额 (RM)：' : 'Amount each (RM):')
                            : (lang === 'zh' ? '放炮包付金额 (RM)：' : 'Shooter pays (RM):')}
                        </label>
                        <span className="text-[10px] text-emerald-400">
                          {manualWinType === 'zimo' ? '两家各出此数' : '放炮者全包'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-400 text-sm">RM</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={manualAmount}
                          onChange={(e) => setManualAmount(e.target.value)}
                          className="flex-1 bg-[#061e12] border border-amber-500/60 rounded-xl px-3 py-2 text-amber-300 font-black text-base outline-none focus:ring-2 focus:ring-amber-400 min-w-0"
                          placeholder="0.00"
                        />
                      </div>
                      {/* 快捷金额预设：手机上整齐 4 列网格 */}
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 pt-1">
                        {[2, 5, 10, 20, 30, 50, 80, 100].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setManualAmount(String(amt))}
                            className={`py-1.5 rounded-lg text-xs font-bold transition text-center ${
                              manualAmount === String(amt)
                                ? 'bg-amber-400 text-slate-950 shadow font-black'
                                : 'bg-[#061e12] border border-emerald-800 text-emerald-300 hover:bg-emerald-900'
                            }`}
                          >
                            RM {amt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  /* 精准指定模式：针对手机排版优化的上下结构 */
                  <div className="space-y-2">
                    <label className="text-[11px] text-amber-300 font-bold block">
                      {lang === 'zh' ? '分别指定各家输给赢家的金额：' : 'Specify amount lost to winner:'}
                    </label>
                    <div className="space-y-2">
                      {players
                        .filter(p => p.id !== manualWinnerId)
                        .map(p => (
                          <div key={p.id} className="bg-[#081e13] border border-emerald-800 rounded-xl p-2.5 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="w-5 h-5 rounded-full bg-red-900/60 text-red-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                                  付
                                </span>
                                <span className="font-bold text-emerald-100 text-xs truncate">
                                  {p.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-amber-400 font-bold text-xs">付 RM</span>
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  value={customLosses[p.id] || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setCustomLosses(prev => ({ ...prev, [p.id]: val }));
                                  }}
                                  placeholder="0.00"
                                  className="w-20 sm:w-24 bg-[#05170e] border border-emerald-700 rounded-lg px-2 py-1 text-right text-amber-300 font-black text-sm outline-none focus:ring-1 focus:ring-amber-400"
                                />
                              </div>
                            </div>
                            {/* 快捷累加药丸 */}
                            <div className="flex items-center justify-end gap-1 pt-0.5 border-t border-emerald-900/60">
                              <span className="text-[10px] text-emerald-400/80 mr-1">快捷累加:</span>
                              {[5, 10, 20, 50].map(add => (
                                <button
                                  key={add}
                                  type="button"
                                  onClick={() => {
                                    const cur = parseFloat(customLosses[p.id] || '0') || 0;
                                    setCustomLosses(prev => ({ ...prev, [p.id]: String(cur + add) }));
                                  }}
                                  className="px-2 py-0.5 rounded bg-emerald-900/60 hover:bg-emerald-800 active:bg-emerald-700 text-[10px] text-emerald-300 font-bold border border-emerald-700/60"
                                >
                                  +{add}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => setCustomLosses(prev => ({ ...prev, [p.id]: '0' }))}
                                className="px-1.5 py-0.5 rounded bg-red-950/60 hover:bg-red-900 text-[10px] text-red-300 font-bold border border-red-900/60"
                              >
                                清零
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* 3. 实时分账预览 */}
                <div className="bg-[#061e12] border border-emerald-700/70 rounded-xl p-2.5 sm:p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300 border-b border-emerald-800 pb-1">
                    <span>{lang === 'zh' ? '💰 本局实时分账预览：' : 'Live Payout Breakdown:'}</span>
                    <span className="text-amber-300 font-bold text-[10px]">
                      {lang === 'zh' ? '平账 零和验证 ✔' : 'Zero-Sum Checked ✔'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-bold text-emerald-200 text-xs">
                      赢家 【{currentPreview.winnerName}】
                    </span>
                    <span className="font-black text-emerald-300 text-sm">
                      +RM {currentPreview.winnerGets.toFixed(2)}
                    </span>
                  </div>
                  <div className="space-y-1 pt-1 border-t border-emerald-900">
                    {currentPreview.losses.map((loss) => (
                      <div key={loss.id} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300 truncate mr-2">
                          {loss.name}
                        </span>
                        <span className={`font-bold shrink-0 ${loss.pays > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                          {loss.pays > 0 ? `-RM ${loss.pays.toFixed(2)}` : 'RM 0.00 (不付)'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. 备注与快捷标签 */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-emerald-400 block">
                    {lang === 'zh' ? '牌型备注 (选填)：' : 'Notes / Pattern (Optional):'}
                  </label>
                  <input
                    type="text"
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    placeholder={lang === 'zh' ? '例如：清一色、杠上开花、包牌等' : 'e.g., Pure One-Suit'}
                    className="w-full bg-[#061e12] border border-emerald-800 rounded-lg px-2.5 py-1.5 text-emerald-100 text-xs outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <div className="flex flex-wrap gap-1">
                    {[
                      '自摸',
                      '平胡',
                      '1飞',
                      '2飞',
                      '3飞',
                      '4飞满天飞',
                      '无飞',
                      '明杠',
                      '暗杠',
                      '杠上开花',
                      '清一色',
                      '大四喜',
                      '包三家',
                      '海底捞月',
                    ].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setManualNotes(prev => (prev ? `${prev} ${tag}` : tag));
                        }}
                        className="px-2 py-0.5 rounded-full bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-[10px] text-emerald-300 transition active:scale-95"
                      >
                        +{tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. 提交按钮 */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveManualRound}
                    disabled={currentPreview.winnerGets <= 0}
                    className="flex-1 py-2.5 px-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 active:scale-95 min-w-0"
                  >
                    <Check className="w-4 h-4 shrink-0" />
                    <span className="truncate">
                      {lang === 'zh' ? `记入账本 (+RM ${currentPreview.winnerGets.toFixed(2)})` : `Save (+RM ${currentPreview.winnerGets.toFixed(2)})`}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingManual(false)}
                    className="shrink-0 px-3 sm:px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition"
                  >
                    {lang === 'zh' ? '取消' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. 战绩总览计分板 (Scoreboard) */}
          <div className="grid grid-cols-3 gap-2">
            {settlement.playerBalances.map(({ player, balance }) => {
              const isWinner = balance > 0;
              const isLoser = balance < 0;
              const winRoundsCount = rounds.filter(r => {
                const norm = normalizeRoundRecord(r, players);
                return norm.winnerId === player.id;
              }).length;

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
                  const norm = normalizeRoundRecord(round, players);
                  const winner = players.find(p => p.id === norm.winnerId)?.name || '未知';
                  const shooter = norm.shooterId ? players.find(p => p.id === norm.shooterId)?.name : null;

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
                            【{winner}】{norm.winType === 'zimo' ? '自摸' : `出冲 (由${shooter || '放炮者'}放炮)`}
                          </span>
                          <span className="bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded text-[10px] border border-emerald-700">
                            {norm.effectiveFan > 0 ? `${norm.effectiveFan} 番 ` : ''}{norm.handPattern ? `(${norm.handPattern})` : ''}
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-400/80 mt-0.5">
                          {norm.notes || `总计进账 RM ${norm.totalPot.toFixed(2)}`}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-black text-amber-300 text-sm">
                          +RM {norm.totalPot.toFixed(2)}
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
