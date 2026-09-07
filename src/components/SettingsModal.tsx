import React, { useState } from 'react';
import { RuleSettings } from '../types/mahjong';
import { PRESET_BASE_PRICES } from '../constants/defaultRules';
import {
  Settings,
  X,
  RotateCcw,
  Check,
  DollarSign,
  Sliders,
  Award,
  Zap,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: RuleSettings;
  onSaveRules: (newRules: RuleSettings) => void;
  onResetDefault: () => void;
  lang: 'zh' | 'en';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  rules,
  onSaveRules,
  onResetDefault,
  lang,
}) => {
  const [tempRules, setTempRules] = useState<RuleSettings>({ ...rules });

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveRules(tempRules);
    onClose();
  };

  const updateTierAmount = (fan: number, amount: number) => {
    const updated = tempRules.customTierTable.map(t =>
      t.fan === fan ? { ...t, amount } : t
    );
    setTempRules({ ...tempRules, customTierTable: updated });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#14482e] to-[#0c2c1b] border border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 border-b border-emerald-700/60 p-4 text-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-mahjong font-bold text-base sm:text-lg">
                {lang === 'zh' ? '规则、底价与翻倍设置' : 'Rules, Stakes & Multipliers'}
              </h2>
              <p className="text-[11px] text-emerald-300">
                {lang === 'zh' ? '自由定制每番价格、起胡番数与倍数算法' : 'Customize RM pricing, min fan, and payout rules'}
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

        {/* 滚动配置表 */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-slate-100 flex-1 text-xs">
          {/* 1. 底价设置 (Base Stake in RM) */}
          <div className="bg-[#0b2919] border border-emerald-800/80 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                {lang === 'zh' ? '游戏底价 (Base Stake / RM)' : 'Base Price (RM)'}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-emerald-400 font-bold">RM</span>
                <input
                  type="number"
                  step="0.10"
                  min="0.05"
                  value={tempRules.basePrice}
                  onChange={(e) => setTempRules({ ...tempRules, basePrice: parseFloat(e.target.value) || 0.1 })}
                  className="w-20 bg-[#0c2e1c] border border-emerald-700 rounded-lg px-2 py-1 text-right text-amber-300 font-bold text-sm outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>

            {/* 快速预设按钮 */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-emerald-400 text-[11px] mr-1">
                {lang === 'zh' ? '常用预设：' : 'Presets:'}
              </span>
              {PRESET_BASE_PRICES.map((price) => (
                <button
                  key={price}
                  type="button"
                  onClick={() => setTempRules({ ...tempRules, basePrice: price })}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                    tempRules.basePrice === price
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                  }`}
                >
                  RM {price.toFixed(2)}
                </button>
              ))}
            </div>
          </div>

          {/* 2. 起胡番数与封顶设置 */}
          <div className="bg-[#0b2919] border border-emerald-800/80 rounded-2xl p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 起胡番数 */}
            <div>
              <label className="font-bold text-emerald-200 block mb-1">
                {lang === 'zh' ? '🎯 起胡番数要求' : 'Minimum Fan to Win'}
              </label>
              <div className="flex items-center gap-1.5">
                {[3, 5, 6].map((fan) => (
                  <button
                    key={fan}
                    type="button"
                    onClick={() => setTempRules({ ...tempRules, minFan: fan })}
                    className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition ${
                      tempRules.minFan === fan
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                    }`}
                  >
                    {fan} {lang === 'zh' ? '番起胡' : 'Fan'}
                    {fan === 5 && ' ⭐'}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-emerald-400/80 mt-1 block">
                {lang === 'zh' ? '马来西亚三人麻将标准普遍为 5 番起胡。' : '5 Fan is standard in Malaysia.'}
              </span>
            </div>

            {/* 封顶番数 */}
            <div>
              <label className="font-bold text-emerald-200 block mb-1">
                {lang === 'zh' ? '🛑 满胡 / 封顶番数' : 'Max Fan Cap (Limit)'}
              </label>
              <div className="flex items-center gap-1.5">
                {[10, 16, 0].map((cap) => (
                  <button
                    key={cap}
                    type="button"
                    onClick={() => setTempRules({ ...tempRules, maxFan: cap })}
                    className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition ${
                      tempRules.maxFan === cap
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                    }`}
                  >
                    {cap === 0 ? (lang === 'zh' ? '无上限(爆)' : 'No Limit') : `${cap} ${lang === 'zh' ? '番' : 'Fan'}`}
                    {cap === 10 && ' ⭐'}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-emerald-400/80 mt-1 block">
                {lang === 'zh' ? '通常打 10 番满胡，也有部分场次打 16 番。' : '10 Fan is classical limit.'}
              </span>
            </div>
          </div>

          {/* 3. 算钱翻倍算法模式 */}
          <div className="bg-[#0b2919] border border-emerald-800/80 rounded-2xl p-3.5 space-y-3">
            <span className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
              <Zap className="w-4 h-4 text-amber-400" />
              {lang === 'zh' ? '算钱倍数算法模式' : 'Payout Multiplier Scheme'}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div
                onClick={() => setTempRules({ ...tempRules, multiplierType: 'exponential' })}
                className={`p-2.5 rounded-xl border cursor-pointer transition ${
                  tempRules.multiplierType === 'exponential'
                    ? 'bg-amber-950/80 border-amber-400 text-amber-100 shadow'
                    : 'bg-emerald-950/60 border-emerald-800 text-emerald-300 hover:bg-emerald-900/60'
                }`}
              >
                <div className="font-bold text-xs mb-1">
                  ⭐ {lang === 'zh' ? '经典番数翻倍' : 'Exponential 2x'}
                </div>
                <p className="text-[10px] opacity-80">
                  {lang === 'zh' ? '5番1倍，6番2倍，7番4倍，8番8倍...' : 'Doubles with each extra fan.'}
                </p>
              </div>

              <div
                onClick={() => setTempRules({ ...tempRules, multiplierType: 'tier_classic' })}
                className={`p-2.5 rounded-xl border cursor-pointer transition ${
                  tempRules.multiplierType === 'tier_classic'
                    ? 'bg-amber-950/80 border-amber-400 text-amber-100 shadow'
                    : 'bg-emerald-950/60 border-emerald-800 text-emerald-300 hover:bg-emerald-900/60'
                }`}
              >
                <div className="font-bold text-xs mb-1">
                  📈 {lang === 'zh' ? '大马阶梯半倍法' : 'Malaysian Step'}
                </div>
                <p className="text-[10px] opacity-80">
                  {lang === 'zh' ? '5番1底，6番2底，7番3底，8番4底...' : 'Gradual increment per fan.'}
                </p>
              </div>

              <div
                onClick={() => setTempRules({ ...tempRules, multiplierType: 'custom' })}
                className={`p-2.5 rounded-xl border cursor-pointer transition ${
                  tempRules.multiplierType === 'custom'
                    ? 'bg-amber-950/80 border-amber-400 text-amber-100 shadow'
                    : 'bg-emerald-950/60 border-emerald-800 text-emerald-300 hover:bg-emerald-900/60'
                }`}
              >
                <div className="font-bold text-xs mb-1">
                  📝 {lang === 'zh' ? '自定义金额表' : 'Custom Price Table'}
                </div>
                <p className="text-[10px] opacity-80">
                  {lang === 'zh' ? '手动指定每一级番数收多少钱。' : 'Manually set RM for each fan.'}
                </p>
              </div>
            </div>

            {/* 如果选择了自定义价格表，展示可编辑列表 */}
            {tempRules.multiplierType === 'custom' && (
              <div className="p-2.5 bg-[#092215] border border-emerald-800 rounded-xl space-y-2">
                <span className="font-bold text-emerald-300 text-[11px] block">
                  {lang === 'zh' ? '自定义各番数结算金额 (RM)：' : 'Custom Price per Fan (RM):'}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {tempRules.customTierTable.slice(0, 8).map((t) => (
                    <div key={t.fan} className="flex items-center justify-between bg-emerald-950 p-1.5 rounded-lg border border-emerald-800">
                      <span className="text-emerald-300 text-[11px]">{t.fan} 番:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-emerald-500 text-[10px]">RM</span>
                        <input
                          type="number"
                          step="0.5"
                          value={t.amount}
                          onChange={(e) => updateTierAmount(t.fan, parseFloat(e.target.value) || 0)}
                          className="w-12 bg-black/40 text-amber-300 text-right font-bold text-xs rounded px-1 outline-none border border-emerald-700"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. 出冲包赔 & 动物咬花奖励规则 */}
          <div className="bg-[#0b2919] border border-emerald-800/80 rounded-2xl p-3.5 space-y-2.5">
            <span className="font-bold text-emerald-200 block">
              {lang === 'zh' ? '特殊玩法与即时奖励开关' : 'House Rules & Side Bets'}
            </span>

            <label className="flex items-center justify-between p-2 rounded-xl bg-emerald-950/60 border border-emerald-800 cursor-pointer">
              <div>
                <span className="font-bold text-emerald-200 block text-xs">
                  {lang === 'zh' ? '出冲者一人全包 (包出冲)' : 'Shooter Pays for All'}
                </span>
                <span className="text-[10px] text-emerald-400">
                  {lang === 'zh' ? '若非自摸，出冲放炮者一人替另一家全包付款。' : 'Shooter covers both shares.'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={tempRules.shooterPaysAll}
                onChange={(e) => setTempRules({ ...tempRules, shooterPaysAll: e.target.checked })}
                className="w-5 h-5 rounded text-amber-500 bg-emerald-900 border-emerald-700"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl bg-emerald-950/60 border border-emerald-800 cursor-pointer">
              <div>
                <span className="font-bold text-emerald-200 block text-xs">
                  {lang === 'zh' ? '动物咬到即时出钱 (猫吃老鼠 / 鸡啄蜈蚣)' : 'Animal Bite Instant Bounty'}
                </span>
                <span className="text-[10px] text-emerald-400">
                  {lang === 'zh' ? '摸到咬花时，桌上其他两家需立即掏现金红包。' : 'Instant bonus from each player.'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={tempRules.enableAnimalBiteBonus}
                onChange={(e) => setTempRules({ ...tempRules, enableAnimalBiteBonus: e.target.checked })}
                className="w-5 h-5 rounded text-amber-500 bg-emerald-900 border-emerald-700"
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0a2416] border-t border-emerald-800/80 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onResetDefault}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 text-xs font-bold transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{lang === 'zh' ? '恢复默认' : 'Reset Defaults'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 text-xs font-bold transition"
            >
              {lang === 'zh' ? '取消' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg transition"
            >
              <Check className="w-4 h-4" />
              <span>{lang === 'zh' ? '保存规则' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
