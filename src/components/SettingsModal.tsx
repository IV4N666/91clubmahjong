import React, { useState } from 'react';
import { RuleSettings } from '../types/mahjong';
import { PRESET_BASE_PRICES, PRESET_FEI_PRICES } from '../constants/defaultRules';
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div
                onClick={() => setTempRules({ ...tempRules, multiplierType: 'linear' })}
                className={`p-2.5 rounded-xl border cursor-pointer transition ${
                  tempRules.multiplierType === 'linear'
                    ? 'bg-amber-950/80 border-amber-400 text-amber-100 shadow'
                    : 'bg-emerald-950/60 border-emerald-800 text-emerald-300 hover:bg-emerald-900/60'
                }`}
              >
                <div className="font-bold text-xs mb-1 text-amber-300 flex items-center gap-1">
                  <span>🎯</span>
                  {lang === 'zh' ? '几番几底 (1番=1底) ⭐推荐默认' : 'Linear (1 Fan = 1 Base) ⭐'}
                </div>
                <p className="text-[10px] opacity-80 leading-relaxed">
                  {lang === 'zh' ? '几番就几底（如7番=7×底价），超过10番算爆番拿20底！' : 'Fan × Base (e.g. 7F = 7×Base), >10F is Bao Fan (20×Base).'}
                </p>
              </div>

              <div
                onClick={() => setTempRules({ ...tempRules, multiplierType: 'exponential' })}
                className={`p-2.5 rounded-xl border cursor-pointer transition ${
                  tempRules.multiplierType === 'exponential'
                    ? 'bg-amber-950/80 border-amber-400 text-amber-100 shadow'
                    : 'bg-emerald-950/60 border-emerald-800 text-emerald-300 hover:bg-emerald-900/60'
                }`}
              >
                <div className="font-bold text-xs mb-1 flex items-center gap-1">
                  <span>📈</span>
                  {lang === 'zh' ? '经典番数翻倍 (2x)' : 'Exponential 2x'}
                </div>
                <p className="text-[10px] opacity-80 leading-relaxed">
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
                <div className="font-bold text-xs mb-1 flex items-center gap-1">
                  <span>📊</span>
                  {lang === 'zh' ? '大马阶梯半倍法' : 'Malaysian Step'}
                </div>
                <p className="text-[10px] opacity-80 leading-relaxed">
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
                <div className="font-bold text-xs mb-1 flex items-center gap-1">
                  <span>📝</span>
                  {lang === 'zh' ? '自定义金额表' : 'Custom Price Table'}
                </div>
                <p className="text-[10px] opacity-80 leading-relaxed">
                  {lang === 'zh' ? '手动指定每一级番数收多少钱。' : 'Manually set RM for each fan.'}
                </p>
              </div>
            </div>

            {/* 如果选择了几番几底模式，展示规则细节与爆番设置 */}
            {tempRules.multiplierType === 'linear' && (
              <div className="p-3 bg-[#092215] border border-amber-600/40 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300">
                    {lang === 'zh' ? '几番几底规则说明：' : 'Linear Rules:'}
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                    {lang === 'zh' ? '1番 = 1底' : '1 Fan = 1 Base'}
                  </span>
                </div>
                <p className="text-emerald-300 text-[11px] leading-relaxed">
                  {lang === 'zh'
                    ? `• 10 番以内：几番就拿几底（例如 5番拿 5底 RM ${(tempRules.basePrice * 5).toFixed(2)}，7番拿 7底 RM ${(tempRules.basePrice * 7).toFixed(2)}，10番拿 10底 RM ${(tempRules.basePrice * 10).toFixed(2)}）。`
                    : `• Up to 10 Fan: Score = Fan × Base Price (e.g. 7 Fan = 7 × Base).`}
                </p>
                <div className="pt-2 border-t border-emerald-800/60 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-200 text-[11px] font-bold">
                      {lang === 'zh' ? '💥 超过 10 番 (爆番) 获得：' : '💥 Over 10 Fan (Bao Fan):'}
                    </span>
                    <div className="flex items-center gap-1">
                      {[15, 20, 30].map((multiplier) => (
                        <button
                          key={multiplier}
                          type="button"
                          onClick={() => setTempRules({ ...tempRules, baoFanMultiplier: multiplier })}
                          className={`px-2 py-0.5 rounded-lg text-xs font-bold transition ${
                            (tempRules.baoFanMultiplier ?? 20) === multiplier
                              ? 'bg-amber-500 text-slate-950 shadow'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                          }`}
                        >
                          {multiplier} {lang === 'zh' ? '底' : 'Base'}
                          {multiplier === 20 && ' ⭐'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <span className="text-amber-400 font-bold text-xs">
                    = RM {(tempRules.basePrice * (tempRules.baoFanMultiplier ?? 20)).toFixed(2)} / 家
                  </span>
                </div>
              </div>
            )}

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

          {/* 4. 飞牌 (百搭) 结算模式与价格设置 */}
          <div className="bg-[#0b2919] border border-emerald-800/80 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
                <span>⭐</span>
                {lang === 'zh' ? '飞牌结算模式与价格 (Fei Joker)' : 'Fei Joker Rules & Price'}
              </span>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-800">
                {tempRules.feiCalculationMode === 'cash'
                  ? (lang === 'zh' ? '直计现金 (不算番)' : 'Direct Cash (0 Fan)')
                  : (lang === 'zh' ? '传统计番 (+1番/张)' : '+1 Fan per Fei')}
              </span>
            </div>

            {/* 模式选择按钮 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTempRules({ ...tempRules, feiCalculationMode: 'cash' })}
                className={`p-2.5 rounded-xl border text-left transition ${
                  tempRules.feiCalculationMode === 'cash'
                    ? 'bg-amber-950/90 border-amber-400 text-amber-100 shadow'
                    : 'bg-emerald-950/60 border-emerald-800 text-emerald-300 hover:bg-emerald-900/60'
                }`}
              >
                <div className="font-bold text-xs mb-0.5 text-amber-300 flex items-center gap-1">
                  <span>💰</span>
                  {lang === 'zh' ? '直计现金（不算番） ⭐推荐' : 'Direct Cash (No Fan) ⭐'}
                </div>
                <p className="text-[10px] opacity-80 leading-relaxed">
                  {lang === 'zh'
                    ? '飞牌不计入手牌番数，摸到/手持飞牌直接按设定单价（如RM 0.50或1.00）收取额外现金！'
                    : 'Fei yields 0 Fan. Directly collects cash per Fei tile.'}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTempRules({ ...tempRules, feiCalculationMode: 'fan' })}
                className={`p-2.5 rounded-xl border text-left transition ${
                  tempRules.feiCalculationMode === 'fan'
                    ? 'bg-amber-950/90 border-amber-400 text-amber-100 shadow'
                    : 'bg-emerald-950/60 border-emerald-800 text-emerald-300 hover:bg-emerald-900/60'
                }`}
              >
                <div className="font-bold text-xs mb-0.5 text-emerald-200 flex items-center gap-1">
                  <span>🀄</span>
                  {lang === 'zh' ? '传统计番 (+1 番/张)' : '+1 Fan per Fei Tile'}
                </div>
                <p className="text-[10px] opacity-80 leading-relaxed">
                  {lang === 'zh'
                    ? '飞牌按番数计算，手持每张飞牌 +1 番，最后按总番数翻倍结算。'
                    : 'Each Fei tile adds +1 Fan to the winning hand.'}
                </p>
              </button>
            </div>

            {/* 当选择“直计现金”时，可自定义飞牌单价 */}
            {tempRules.feiCalculationMode === 'cash' && (
              <div className="p-3 bg-[#092215] border border-amber-600/40 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300 text-xs">
                    {lang === 'zh' ? '每张飞牌现金单价：' : 'Cash Price per Fei Tile:'}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-amber-400 font-bold">RM</span>
                    <input
                      type="number"
                      step="0.10"
                      min="0.05"
                      value={tempRules.feiCashAmount}
                      onChange={(e) =>
                        setTempRules({ ...tempRules, feiCashAmount: parseFloat(e.target.value) || 0.1 })
                      }
                      className="w-20 bg-[#0c2e1c] border border-amber-500 rounded-lg px-2 py-1 text-right text-amber-300 font-bold text-sm outline-none focus:ring-1 focus:ring-amber-400"
                    />
                  </div>
                </div>

                {/* 飞牌单价快捷预设 */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-emerald-400 text-[11px] mr-1">
                    {lang === 'zh' ? '常用单价：' : 'Presets:'}
                  </span>
                  {PRESET_FEI_PRICES.map((price) => (
                    <button
                      key={price}
                      type="button"
                      onClick={() => setTempRules({ ...tempRules, feiCashAmount: price })}
                      className={`px-2.5 py-0.5 rounded-lg font-bold text-xs transition ${
                        tempRules.feiCashAmount === price
                          ? 'bg-amber-500 text-slate-950 shadow'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                      }`}
                    >
                      RM {price.toFixed(2)}
                    </button>
                  ))}
                </div>

                {/* 动态计算说明 */}
                <div className="text-[11px] text-amber-300/90 pt-1 bg-amber-950/30 p-2 rounded-lg border border-amber-900/50">
                  💡 {lang === 'zh'
                    ? `实时换算：持 2 张飞牌 = 直接额外收 2 × RM ${tempRules.feiCashAmount.toFixed(2)} = RM ${(2 * tempRules.feiCashAmount).toFixed(2)}（不算入手牌番数）。`
                    : `Example: 2 Fei tiles = 2 × RM ${tempRules.feiCashAmount.toFixed(2)} = RM ${(2 * tempRules.feiCashAmount).toFixed(2)} cash.`}
                </div>
              </div>
            )}
          </div>

          {/* 5. 开杠即刻收钱设置 (Immediate Kong Payout) */}
          <div className="bg-[#0b2919] border border-emerald-800/80 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
                <span>⚡</span>
                {lang === 'zh' ? '开杠即刻收钱设置 (Immediate Kong Payout)' : 'Immediate Kong Payout'}
              </span>
              <input
                type="checkbox"
                checked={tempRules.enableKongImmediateCash}
                onChange={(e) => setTempRules({ ...tempRules, enableKongImmediateCash: e.target.checked })}
                className="w-5 h-5 rounded text-amber-500 bg-emerald-900 border-emerald-700"
              />
            </div>

            {tempRules.enableKongImmediateCash && (
              <div className="space-y-2.5">
                <div>
                  <label className="font-bold text-emerald-200 block mb-1 text-xs">
                    {lang === 'zh' ? '每次开杠收几番的钱？' : 'Fan Payout per Kong:'}
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4].map((fan) => (
                      <button
                        key={fan}
                        type="button"
                        onClick={() => setTempRules({ ...tempRules, kongImmediateFan: fan })}
                        className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition ${
                          tempRules.kongImmediateFan === fan
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                        }`}
                      >
                        {fan} {lang === 'zh' ? '番钱' : 'Fan'}
                        {fan === 2 && ' ⭐'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 动态公式提示 */}
                <div className="text-[11px] text-emerald-300 bg-[#092215] p-2.5 rounded-xl border border-emerald-800 space-y-1">
                  <div className="font-bold text-amber-300">
                    💡 {lang === 'zh' ? '开杠即时收益计算：' : 'Payout Calculation:'}
                  </div>
                  <p>
                    {lang === 'zh'
                      ? `当前底价 RM ${tempRules.basePrice.toFixed(2)} × 开杠 ${tempRules.kongImmediateFan} 番 = 每次开杠立收 `
                      : `Base RM ${tempRules.basePrice.toFixed(2)} × ${tempRules.kongImmediateFan} Fan = `}
                    <span className="font-black text-amber-400 text-sm">
                      RM {(tempRules.basePrice * tempRules.kongImmediateFan).toFixed(2)}
                    </span>
                    {lang === 'zh' ? ' / 组！' : ' per Kong!'}
                  </p>
                  <p className="text-[10px] text-emerald-400/80">
                    {lang === 'zh'
                      ? '（例如：底价 RM 0.20，开杠即收 2 番 = RM 0.40；底价 RM 0.50，开杠即收 2 番 = RM 1.00）'
                      : '(e.g. Base RM 0.20 with 2 Fan Kong yields RM 0.40 immediately)'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 6. 全牌型番数自由定制 (All Sets Pattern & Action Fan Customization) */}
          <div className="bg-[#0b2919] border border-emerald-800/80 rounded-2xl p-3.5 space-y-4">
            <div>
              <span className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
                <span>🎨</span>
                {lang === 'zh' ? '全牌型与特色番数定制 (全部Set可勾选打/不打 & 自由调番)' : 'All Pattern & Action Settings (Tick to Play / Fan)'}
              </span>
              <p className="text-[11px] text-emerald-400/80 mt-0.5">
                {lang === 'zh' ? '打勾开启计番，取消打勾则不玩该规则（不算番/不算特殊牌型）：' : 'Tick to enable rule scoring, untick to disable it:'}
              </p>
            </div>

            {/* 子分类 A: 经典胡牌牌型 (Hand Patterns) */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-emerald-300 flex items-center gap-1 border-b border-emerald-800/50 pb-1">
                <span>🀄</span>
                {lang === 'zh' ? '经典大牌与牌型 (Hand Patterns)' : 'Major Hand Patterns'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 混一色 (半色) */}
                <div className={`border rounded-xl p-2.5 space-y-1.5 transition ${
                  (tempRules.enableHalfFlush ?? true)
                    ? 'bg-[#092215] border-emerald-800/80'
                    : 'bg-[#07180e] border-emerald-950 opacity-60'
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={tempRules.enableHalfFlush ?? true}
                        onChange={(e) => setTempRules({ ...tempRules, enableHalfFlush: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-500 bg-emerald-900 border-emerald-700"
                      />
                      <span className={`font-bold text-xs ${(tempRules.enableHalfFlush ?? true) ? 'text-emerald-200' : 'text-slate-400 line-through'}`}>
                        {lang === 'zh' ? '混一色 (半色)' : 'Half Flush'}
                      </span>
                    </label>
                    {(tempRules.enableHalfFlush ?? true) ? (
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
                        {tempRules.halfFlushFan ?? 2} 番
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700">
                        {lang === 'zh' ? '不玩' : 'Off'}
                      </span>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 ${(tempRules.enableHalfFlush ?? true) ? '' : 'pointer-events-none opacity-40'}`}>
                    {[1, 2, 3, 4].map((fan) => (
                      <button
                        key={fan}
                        type="button"
                        disabled={!(tempRules.enableHalfFlush ?? true)}
                        onClick={() => setTempRules({ ...tempRules, halfFlushFan: fan })}
                        className={`flex-1 py-1 rounded-lg font-bold text-xs transition ${
                          (tempRules.halfFlushFan ?? 2) === fan
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                        }`}
                      >
                        {fan}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-emerald-400/80 block">
                    {(tempRules.enableHalfFlush ?? true)
                      ? (lang === 'zh' ? '筒子搭配风字牌（常规 2 番）。' : 'Dots + Honors (std: 2F).')
                      : (lang === 'zh' ? '（已取消勾选：不计混一色番数）' : '(Unticked: Disabled)')
                    }
                  </span>
                </div>

                {/* 清一色 (全色) */}
                <div className={`border rounded-xl p-2.5 space-y-1.5 transition ${
                  (tempRules.enableFullFlush ?? true)
                    ? 'bg-[#092215] border-emerald-800/80'
                    : 'bg-[#07180e] border-emerald-950 opacity-60'
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={tempRules.enableFullFlush ?? true}
                        onChange={(e) => setTempRules({ ...tempRules, enableFullFlush: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-500 bg-emerald-900 border-emerald-700"
                      />
                      <span className={`font-bold text-xs ${(tempRules.enableFullFlush ?? true) ? 'text-emerald-200' : 'text-slate-400 line-through'}`}>
                        {lang === 'zh' ? '清一色 (全色)' : 'Full Flush'}
                      </span>
                    </label>
                    {(tempRules.enableFullFlush ?? true) ? (
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
                        {tempRules.fullFlushFan ?? 4} 番
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700">
                        {lang === 'zh' ? '不玩' : 'Off'}
                      </span>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 ${(tempRules.enableFullFlush ?? true) ? '' : 'pointer-events-none opacity-40'}`}>
                    {[3, 4, 5, 8].map((fan) => (
                      <button
                        key={fan}
                        type="button"
                        disabled={!(tempRules.enableFullFlush ?? true)}
                        onClick={() => setTempRules({ ...tempRules, fullFlushFan: fan })}
                        className={`flex-1 py-1 rounded-lg font-bold text-xs transition ${
                          (tempRules.fullFlushFan ?? 4) === fan
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                        }`}
                      >
                        {fan}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-emerald-400/80 block">
                    {(tempRules.enableFullFlush ?? true)
                      ? (lang === 'zh' ? '纯筒子无字牌（常规 4 或 5 番）。' : 'Pure dots only (std: 4F).')
                      : (lang === 'zh' ? '（已取消勾选：不计清一色番数）' : '(Unticked: Disabled)')
                    }
                  </span>
                </div>

                {/* 碰碰胡 (对对胡) */}
                <div className={`border rounded-xl p-2.5 space-y-1.5 transition ${
                  (tempRules.enableAllPongs ?? true)
                    ? 'bg-[#092215] border-emerald-800/80'
                    : 'bg-[#07180e] border-emerald-950 opacity-60'
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={tempRules.enableAllPongs ?? true}
                        onChange={(e) => setTempRules({ ...tempRules, enableAllPongs: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-500 bg-emerald-900 border-emerald-700"
                      />
                      <span className={`font-bold text-xs ${(tempRules.enableAllPongs ?? true) ? 'text-emerald-200' : 'text-slate-400 line-through'}`}>
                        {lang === 'zh' ? '碰碰胡 (对对胡)' : 'All Pongs'}
                      </span>
                    </label>
                    {(tempRules.enableAllPongs ?? true) ? (
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
                        {tempRules.allPongsFan ?? 2} 番
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700">
                        {lang === 'zh' ? '不玩' : 'Off'}
                      </span>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 ${(tempRules.enableAllPongs ?? true) ? '' : 'pointer-events-none opacity-40'}`}>
                    {[1, 2, 3, 4].map((fan) => (
                      <button
                        key={fan}
                        type="button"
                        disabled={!(tempRules.enableAllPongs ?? true)}
                        onClick={() => setTempRules({ ...tempRules, allPongsFan: fan })}
                        className={`flex-1 py-1 rounded-lg font-bold text-xs transition ${
                          (tempRules.allPongsFan ?? 2) === fan
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                        }`}
                      >
                        {fan}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-emerald-400/80 block">
                    {(tempRules.enableAllPongs ?? true)
                      ? (lang === 'zh' ? '全由刻子/杠子组成（常规 2 番）。' : 'Triplets only (std: 2F).')
                      : (lang === 'zh' ? '（已取消勾选：不计碰碰胡番数）' : '(Unticked: Disabled)')
                    }
                  </span>
                </div>

                {/* 一条龙 (纯筒龙) */}
                <div className={`border rounded-xl p-2.5 space-y-1.5 transition ${
                  (tempRules.enablePureStraight ?? true)
                    ? 'bg-[#092215] border-emerald-800/80'
                    : 'bg-[#07180e] border-emerald-950 opacity-60'
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={tempRules.enablePureStraight ?? true}
                        onChange={(e) => setTempRules({ ...tempRules, enablePureStraight: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-500 bg-emerald-900 border-emerald-700"
                      />
                      <span className={`font-bold text-xs ${(tempRules.enablePureStraight ?? true) ? 'text-emerald-200' : 'text-slate-400 line-through'}`}>
                        {lang === 'zh' ? '一条龙 (1-9筒)' : 'Pure Straight'}
                      </span>
                    </label>
                    {(tempRules.enablePureStraight ?? true) ? (
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
                        {tempRules.pureStraightFan ?? 2} 番
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700">
                        {lang === 'zh' ? '不玩' : 'Off'}
                      </span>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 ${(tempRules.enablePureStraight ?? true) ? '' : 'pointer-events-none opacity-40'}`}>
                    {[1, 2, 3, 4].map((fan) => (
                      <button
                        key={fan}
                        type="button"
                        disabled={!(tempRules.enablePureStraight ?? true)}
                        onClick={() => setTempRules({ ...tempRules, pureStraightFan: fan })}
                        className={`flex-1 py-1 rounded-lg font-bold text-xs transition ${
                          (tempRules.pureStraightFan ?? 2) === fan
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                        }`}
                      >
                        {fan}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-emerald-400/80 block">
                    {(tempRules.enablePureStraight ?? true)
                      ? (lang === 'zh' ? '持一至九筒顺龙（常规 2 番）。' : '1 to 9 dots straight (std: 2F).')
                      : (lang === 'zh' ? '（已取消勾选：不计一条龙番数）' : '(Unticked: Disabled)')
                    }
                  </span>
                </div>

                {/* 小三元 */}
                <div className={`border rounded-xl p-2.5 space-y-1.5 transition ${
                  (tempRules.enableSmallThreeDragons ?? true)
                    ? 'bg-[#092215] border-emerald-800/80'
                    : 'bg-[#07180e] border-emerald-950 opacity-60'
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={tempRules.enableSmallThreeDragons ?? true}
                        onChange={(e) => setTempRules({ ...tempRules, enableSmallThreeDragons: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-500 bg-emerald-900 border-emerald-700"
                      />
                      <span className={`font-bold text-xs ${(tempRules.enableSmallThreeDragons ?? true) ? 'text-emerald-200' : 'text-slate-400 line-through'}`}>
                        {lang === 'zh' ? '小三元' : 'Small 3 Dragons'}
                      </span>
                    </label>
                    {(tempRules.enableSmallThreeDragons ?? true) ? (
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
                        {tempRules.smallThreeDragonsFan ?? 3} 番
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700">
                        {lang === 'zh' ? '不玩' : 'Off'}
                      </span>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 ${(tempRules.enableSmallThreeDragons ?? true) ? '' : 'pointer-events-none opacity-40'}`}>
                    {[2, 3, 4, 5].map((fan) => (
                      <button
                        key={fan}
                        type="button"
                        disabled={!(tempRules.enableSmallThreeDragons ?? true)}
                        onClick={() => setTempRules({ ...tempRules, smallThreeDragonsFan: fan })}
                        className={`flex-1 py-1 rounded-lg font-bold text-xs transition ${
                          (tempRules.smallThreeDragonsFan ?? 3) === fan
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                        }`}
                      >
                        {fan}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-emerald-400/80 block">
                    {(tempRules.enableSmallThreeDragons ?? true)
                      ? (lang === 'zh' ? '两组中发白刻子+一组对子（常规 3 番）。' : '2 dragon pongs + 1 pair.')
                      : (lang === 'zh' ? '（已取消勾选：不计小三元）' : '(Unticked: Disabled)')
                    }
                  </span>
                </div>

                {/* 大三元 */}
                <div className={`border rounded-xl p-2.5 space-y-1.5 transition ${
                  (tempRules.enableBigThreeDragons ?? true)
                    ? 'bg-[#092215] border-emerald-800/80'
                    : 'bg-[#07180e] border-emerald-950 opacity-60'
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={tempRules.enableBigThreeDragons ?? true}
                        onChange={(e) => setTempRules({ ...tempRules, enableBigThreeDragons: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-500 bg-emerald-900 border-emerald-700"
                      />
                      <span className={`font-bold text-xs ${(tempRules.enableBigThreeDragons ?? true) ? 'text-emerald-200' : 'text-slate-400 line-through'}`}>
                        {lang === 'zh' ? '大三元' : 'Big 3 Dragons'}
                      </span>
                    </label>
                    {(tempRules.enableBigThreeDragons ?? true) ? (
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
                        {tempRules.bigThreeDragonsFan ?? 5} 番
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700">
                        {lang === 'zh' ? '不玩' : 'Off'}
                      </span>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 ${(tempRules.enableBigThreeDragons ?? true) ? '' : 'pointer-events-none opacity-40'}`}>
                    {[3, 5, 8, 10].map((fan) => (
                      <button
                        key={fan}
                        type="button"
                        disabled={!(tempRules.enableBigThreeDragons ?? true)}
                        onClick={() => setTempRules({ ...tempRules, bigThreeDragonsFan: fan })}
                        className={`flex-1 py-1 rounded-lg font-bold text-xs transition ${
                          (tempRules.bigThreeDragonsFan ?? 5) === fan
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                        }`}
                      >
                        {fan}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-emerald-400/80 block">
                    {(tempRules.enableBigThreeDragons ?? true)
                      ? (lang === 'zh' ? '中、发、白三组刻子全齐（常规 5 番）。' : 'Triplets of all 3 dragons.')
                      : (lang === 'zh' ? '（已取消勾选：不计大三元）' : '(Unticked: Disabled)')
                    }
                  </span>
                </div>

                {/* 七对子 (小七对) */}
                <div className={`border rounded-xl p-2.5 space-y-1.5 transition ${
                  (tempRules.enableSevenPairs ?? true)
                    ? 'bg-[#092215] border-emerald-800/80'
                    : 'bg-[#07180e] border-emerald-950 opacity-60'
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={tempRules.enableSevenPairs ?? true}
                        onChange={(e) => setTempRules({ ...tempRules, enableSevenPairs: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-500 bg-emerald-900 border-emerald-700"
                      />
                      <span className={`font-bold text-xs ${(tempRules.enableSevenPairs ?? true) ? 'text-emerald-200' : 'text-slate-400 line-through'}`}>
                        {lang === 'zh' ? '七对子 (小七对)' : 'Seven Pairs'}
                      </span>
                    </label>
                    {(tempRules.enableSevenPairs ?? true) ? (
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
                        {tempRules.sevenPairsFan ?? 5} 番
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700">
                        {lang === 'zh' ? '不玩' : 'Off'}
                      </span>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 ${(tempRules.enableSevenPairs ?? true) ? '' : 'pointer-events-none opacity-40'}`}>
                    {[3, 5, 8, 10].map((fan) => (
                      <button
                        key={fan}
                        type="button"
                        disabled={!(tempRules.enableSevenPairs ?? true)}
                        onClick={() => setTempRules({ ...tempRules, sevenPairsFan: fan })}
                        className={`flex-1 py-1 rounded-lg font-bold text-xs transition ${
                          (tempRules.sevenPairsFan ?? 5) === fan
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                        }`}
                      >
                        {fan}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-emerald-400/80 block">
                    {(tempRules.enableSevenPairs ?? true)
                      ? (lang === 'zh' ? '手牌由 7 个对子组成（常用 5 番）。' : '7 pairs concealed hand.')
                      : (lang === 'zh' ? '（已取消勾选：不认可七对子胡牌）' : '(Unticked: Disabled)')
                    }
                  </span>
                </div>

                {/* 十三幺 (国士无双) */}
                <div className={`border rounded-xl p-2.5 space-y-1.5 transition ${
                  (tempRules.enableThirteenOrphans ?? true)
                    ? 'bg-[#092215] border-emerald-800/80'
                    : 'bg-[#07180e] border-emerald-950 opacity-60'
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={tempRules.enableThirteenOrphans ?? true}
                        onChange={(e) => setTempRules({ ...tempRules, enableThirteenOrphans: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-500 bg-emerald-900 border-emerald-700"
                      />
                      <span className={`font-bold text-xs ${(tempRules.enableThirteenOrphans ?? true) ? 'text-emerald-200' : 'text-slate-400 line-through'}`}>
                        {lang === 'zh' ? '十三幺 (国士无双)' : '13 Orphans'}
                      </span>
                    </label>
                    {(tempRules.enableThirteenOrphans ?? true) ? (
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
                        {tempRules.thirteenOrphansFan ?? 10} 番
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700">
                        {lang === 'zh' ? '不玩' : 'Off'}
                      </span>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 ${(tempRules.enableThirteenOrphans ?? true) ? '' : 'pointer-events-none opacity-40'}`}>
                    {[5, 8, 10, 16].map((fan) => (
                      <button
                        key={fan}
                        type="button"
                        disabled={!(tempRules.enableThirteenOrphans ?? true)}
                        onClick={() => setTempRules({ ...tempRules, thirteenOrphansFan: fan })}
                        className={`flex-1 py-1 rounded-lg font-bold text-xs transition ${
                          (tempRules.thirteenOrphansFan ?? 10) === fan
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                        }`}
                      >
                        {fan}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-emerald-400/80 block">
                    {(tempRules.enableThirteenOrphans ?? true)
                      ? (lang === 'zh' ? '1筒9筒东南西北中发白（常规满胡 10/16番）。' : '1, 9, winds & dragons (Limit).')
                      : (lang === 'zh' ? '（已取消勾选：不认可十三幺特殊胡牌）' : '(Unticked: Disabled)')
                    }
                  </span>
                </div>

                {/* 门清 (未吃碰) */}
                <div className={`border rounded-xl p-2.5 space-y-1.5 transition ${
                  (tempRules.enableMenqing ?? true)
                    ? 'bg-[#092215] border-emerald-800/80'
                    : 'bg-[#07180e] border-emerald-950 opacity-60'
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={tempRules.enableMenqing ?? true}
                        onChange={(e) => setTempRules({ ...tempRules, enableMenqing: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-500 bg-emerald-900 border-emerald-700"
                      />
                      <span className={`font-bold text-xs ${(tempRules.enableMenqing ?? true) ? 'text-emerald-200' : 'text-slate-400 line-through'}`}>
                        {lang === 'zh' ? '门清 (未副露)' : 'Concealed Hand'}
                      </span>
                    </label>
                    {(tempRules.enableMenqing ?? true) ? (
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
                        {(tempRules.menqingFan ?? 1) === 0
                          ? (lang === 'zh' ? '不算' : '0')
                          : `${tempRules.menqingFan ?? 1} 番`}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700">
                        {lang === 'zh' ? '不玩' : 'Off'}
                      </span>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 ${(tempRules.enableMenqing ?? true) ? '' : 'pointer-events-none opacity-40'}`}>
                    {[0, 1, 2].map((fan) => (
                      <button
                        key={fan}
                        type="button"
                        disabled={!(tempRules.enableMenqing ?? true)}
                        onClick={() => setTempRules({ ...tempRules, menqingFan: fan })}
                        className={`flex-1 py-1 rounded-lg font-bold text-xs transition ${
                          (tempRules.menqingFan ?? 1) === fan
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                        }`}
                      >
                        {fan === 0 ? (lang === 'zh' ? '不算' : '0') : fan}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-emerald-400/80 block">
                    {(tempRules.enableMenqing ?? true)
                      ? (lang === 'zh' ? '手牌无露面副露（自摸时再加+1番）。' : 'No exposed melds.')
                      : (lang === 'zh' ? '（已取消勾选：不计门清加番）' : '(Unticked: Disabled)')
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* 子分类 B: 动作与赢牌情境加番 (Actions & Win Circumstances) */}
            <div className="space-y-2 pt-1">
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1 border-b border-emerald-800/50 pb-1">
                <span>⚡</span>
                {lang === 'zh' ? '动作与特殊胡牌加番 (Actions & Events)' : 'Actions & Situational Bonuses'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {/* 自摸 */}
                <div className={`border rounded-xl p-2.5 space-y-1.5 transition ${
                  (tempRules.enableZimoBonus ?? true)
                    ? 'bg-[#092215] border-emerald-800/80'
                    : 'bg-[#07180e] border-emerald-950 opacity-60'
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={tempRules.enableZimoBonus ?? true}
                        onChange={(e) => setTempRules({ ...tempRules, enableZimoBonus: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-500 bg-emerald-900 border-emerald-700"
                      />
                      <span className={`font-bold text-xs ${(tempRules.enableZimoBonus ?? true) ? 'text-emerald-200' : 'text-slate-400 line-through'}`}>
                        {lang === 'zh' ? '自摸额外加番' : 'Self-Drawn'}
                      </span>
                    </label>
                    {(tempRules.enableZimoBonus ?? true) ? (
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
                        {tempRules.zimoFan ?? 1} 番
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700">
                        {lang === 'zh' ? '不加番' : 'Off'}
                      </span>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 ${(tempRules.enableZimoBonus ?? true) ? '' : 'pointer-events-none opacity-40'}`}>
                    {[0, 1, 2].map((fan) => (
                      <button
                        key={fan}
                        type="button"
                        disabled={!(tempRules.enableZimoBonus ?? true)}
                        onClick={() => setTempRules({ ...tempRules, zimoFan: fan })}
                        className={`flex-1 py-1 rounded-lg font-bold text-xs transition ${
                          (tempRules.zimoFan ?? 1) === fan
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                        }`}
                      >
                        {fan === 0 ? (lang === 'zh' ? '0番' : '0') : `+${fan}番`}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-emerald-400/80 block">
                    {(tempRules.enableZimoBonus ?? true)
                      ? (lang === 'zh' ? '自己摸起胡牌加番（通常 +1 番）。' : 'Self-drawn tile (+1F).')
                      : (lang === 'zh' ? '（已取消勾选：自摸不额外加番）' : '(Unticked: Disabled)')
                    }
                  </span>
                </div>

                {/* 杠上开花 */}
                <div className={`border rounded-xl p-2.5 space-y-1.5 transition ${
                  (tempRules.enableKongBloom ?? true)
                    ? 'bg-[#092215] border-emerald-800/80'
                    : 'bg-[#07180e] border-emerald-950 opacity-60'
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={tempRules.enableKongBloom ?? true}
                        onChange={(e) => setTempRules({ ...tempRules, enableKongBloom: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-500 bg-emerald-900 border-emerald-700"
                      />
                      <span className={`font-bold text-xs ${(tempRules.enableKongBloom ?? true) ? 'text-emerald-200' : 'text-slate-400 line-through'}`}>
                        {lang === 'zh' ? '杠上开花' : 'Kong Bloom'}
                      </span>
                    </label>
                    {(tempRules.enableKongBloom ?? true) ? (
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
                        +{tempRules.kongBloomFan ?? 1} 番
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700">
                        {lang === 'zh' ? '不加番' : 'Off'}
                      </span>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 ${(tempRules.enableKongBloom ?? true) ? '' : 'pointer-events-none opacity-40'}`}>
                    {[1, 2, 3].map((fan) => (
                      <button
                        key={fan}
                        type="button"
                        disabled={!(tempRules.enableKongBloom ?? true)}
                        onClick={() => setTempRules({ ...tempRules, kongBloomFan: fan })}
                        className={`flex-1 py-1 rounded-lg font-bold text-xs transition ${
                          (tempRules.kongBloomFan ?? 1) === fan
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                        }`}
                      >
                        +{fan}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-emerald-400/80 block">
                    {(tempRules.enableKongBloom ?? true)
                      ? (lang === 'zh' ? '开杠补牌时摸到胡牌。' : 'Win on replacement tile.')
                      : (lang === 'zh' ? '（已取消勾选：杠开不额外加番）' : '(Unticked: Disabled)')
                    }
                  </span>
                </div>

                {/* 抢杠 */}
                <div className={`border rounded-xl p-2.5 space-y-1.5 transition ${
                  (tempRules.enableRobbingKong ?? true)
                    ? 'bg-[#092215] border-emerald-800/80'
                    : 'bg-[#07180e] border-emerald-950 opacity-60'
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={tempRules.enableRobbingKong ?? true}
                        onChange={(e) => setTempRules({ ...tempRules, enableRobbingKong: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-500 bg-emerald-900 border-emerald-700"
                      />
                      <span className={`font-bold text-xs ${(tempRules.enableRobbingKong ?? true) ? 'text-emerald-200' : 'text-slate-400 line-through'}`}>
                        {lang === 'zh' ? '抢杠' : 'Robbing Kong'}
                      </span>
                    </label>
                    {(tempRules.enableRobbingKong ?? true) ? (
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
                        +{tempRules.robbingKongFan ?? 1} 番
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700">
                        {lang === 'zh' ? '不加番' : 'Off'}
                      </span>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 ${(tempRules.enableRobbingKong ?? true) ? '' : 'pointer-events-none opacity-40'}`}>
                    {[1, 2, 3].map((fan) => (
                      <button
                        key={fan}
                        type="button"
                        disabled={!(tempRules.enableRobbingKong ?? true)}
                        onClick={() => setTempRules({ ...tempRules, robbingKongFan: fan })}
                        className={`flex-1 py-1 rounded-lg font-bold text-xs transition ${
                          (tempRules.robbingKongFan ?? 1) === fan
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                        }`}
                      >
                        +{fan}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-emerald-400/80 block">
                    {(tempRules.enableRobbingKong ?? true)
                      ? (lang === 'zh' ? '胡别家补杠的那张牌。' : 'Rob opponent kong tile.')
                      : (lang === 'zh' ? '（已取消勾选：抢杠不额外加番）' : '(Unticked: Disabled)')
                    }
                  </span>
                </div>

                {/* 海底捞月 / 捞沙 */}
                <div className={`border rounded-xl p-2.5 space-y-1.5 transition ${
                  (tempRules.enableLastTile ?? true)
                    ? 'bg-[#092215] border-emerald-800/80'
                    : 'bg-[#07180e] border-emerald-950 opacity-60'
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={tempRules.enableLastTile ?? true}
                        onChange={(e) => setTempRules({ ...tempRules, enableLastTile: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-500 bg-emerald-900 border-emerald-700"
                      />
                      <span className={`font-bold text-xs ${(tempRules.enableLastTile ?? true) ? 'text-emerald-200' : 'text-slate-400 line-through'}`}>
                        {lang === 'zh' ? '海底捞月/捞沙' : 'Last Tile Win'}
                      </span>
                    </label>
                    {(tempRules.enableLastTile ?? true) ? (
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
                        +{tempRules.lastTileFan ?? 1} 番
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700">
                        {lang === 'zh' ? '不加番' : 'Off'}
                      </span>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 ${(tempRules.enableLastTile ?? true) ? '' : 'pointer-events-none opacity-40'}`}>
                    {[1, 2, 3].map((fan) => (
                      <button
                        key={fan}
                        type="button"
                        disabled={!(tempRules.enableLastTile ?? true)}
                        onClick={() => setTempRules({ ...tempRules, lastTileFan: fan })}
                        className={`flex-1 py-1 rounded-lg font-bold text-xs transition ${
                          (tempRules.lastTileFan ?? 1) === fan
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                        }`}
                      >
                        +{fan}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-emerald-400/80 block">
                    {(tempRules.enableLastTile ?? true)
                      ? (lang === 'zh' ? '最后一张摸牌或别家最后一张出冲。' : 'Win on final wall tile.')
                      : (lang === 'zh' ? '（已取消勾选：海底不额外加番）' : '(Unticked: Disabled)')
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* 子分类 C: 花牌、神兽与飞牌奖励套组 (Flowers, Animals & Fei Combos) */}
            <div className="space-y-2 pt-1">
              <div className="text-xs font-bold text-emerald-300 flex items-center gap-1 border-b border-emerald-800/50 pb-1">
                <span>🌺</span>
                {lang === 'zh' ? '花牌、神兽满贯与飞牌大奖套组 (Combos & Full Sets)' : 'Flowers & Special Sets'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {/* 一套花 */}
                <div className={`border rounded-xl p-2.5 space-y-1.5 transition ${
                  (tempRules.enableFlowerSet ?? true)
                    ? 'bg-[#092215] border-emerald-800/80'
                    : 'bg-[#07180e] border-emerald-950 opacity-60'
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={tempRules.enableFlowerSet ?? true}
                        onChange={(e) => setTempRules({ ...tempRules, enableFlowerSet: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-500 bg-emerald-900 border-emerald-700"
                      />
                      <span className={`font-bold text-xs ${(tempRules.enableFlowerSet ?? true) ? 'text-emerald-200' : 'text-slate-400 line-through'}`}>
                        {lang === 'zh' ? '一套花 (四季/四君子)' : 'Full Flower Set'}
                      </span>
                    </label>
                    {(tempRules.enableFlowerSet ?? true) ? (
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
                        +{tempRules.flowerSetFan ?? 2} 番
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700">
                        {lang === 'zh' ? '不加番' : 'Off'}
                      </span>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 ${(tempRules.enableFlowerSet ?? true) ? '' : 'pointer-events-none opacity-40'}`}>
                    {[1, 2, 3, 4].map((fan) => (
                      <button
                        key={fan}
                        type="button"
                        disabled={!(tempRules.enableFlowerSet ?? true)}
                        onClick={() => setTempRules({ ...tempRules, flowerSetFan: fan })}
                        className={`flex-1 py-1 rounded-lg font-bold text-xs transition ${
                          (tempRules.flowerSetFan ?? 2) === fan
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                        }`}
                      >
                        +{fan}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-emerald-400/80 block">
                    {(tempRules.enableFlowerSet ?? true)
                      ? (lang === 'zh' ? '春夏秋冬或梅兰竹菊4张成套额外加番。' : 'Complete 4 flowers set.')
                      : (lang === 'zh' ? '（已取消勾选：一套花不额外加番）' : '(Unticked: Disabled)')
                    }
                  </span>
                </div>

                {/* 齐抓四兽 */}
                <div className={`border rounded-xl p-2.5 space-y-1.5 transition ${
                  (tempRules.enableAllAnimals ?? true)
                    ? 'bg-[#092215] border-emerald-800/80'
                    : 'bg-[#07180e] border-emerald-950 opacity-60'
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={tempRules.enableAllAnimals ?? true}
                        onChange={(e) => setTempRules({ ...tempRules, enableAllAnimals: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-500 bg-emerald-900 border-emerald-700"
                      />
                      <span className={`font-bold text-xs ${(tempRules.enableAllAnimals ?? true) ? 'text-emerald-200' : 'text-slate-400 line-through'}`}>
                        {lang === 'zh' ? '齐抓四兽 (大满贯)' : 'All 4 Animals'}
                      </span>
                    </label>
                    {(tempRules.enableAllAnimals ?? true) ? (
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
                        {tempRules.allAnimalsFan ?? 5} 番
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700">
                        {lang === 'zh' ? '不玩' : 'Off'}
                      </span>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 ${(tempRules.enableAllAnimals ?? true) ? '' : 'pointer-events-none opacity-40'}`}>
                    {[3, 5, 8, 10].map((fan) => (
                      <button
                        key={fan}
                        type="button"
                        disabled={!(tempRules.enableAllAnimals ?? true)}
                        onClick={() => setTempRules({ ...tempRules, allAnimalsFan: fan })}
                        className={`flex-1 py-1 rounded-lg font-bold text-xs transition ${
                          (tempRules.allAnimalsFan ?? 5) === fan
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                        }`}
                      >
                        {fan}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-emerald-400/80 block">
                    {(tempRules.enableAllAnimals ?? true)
                      ? (lang === 'zh' ? '猫、鼠、鸡、蜈蚣4只全部到手。' : 'All 4 animals collected.')
                      : (lang === 'zh' ? '（已取消勾选：抓齐四兽不加大满贯番）' : '(Unticked: Disabled)')
                    }
                  </span>
                </div>

                {/* 清飞 / 无飞奖励 */}
                <div className={`border rounded-xl p-2.5 space-y-1.5 transition ${
                  (tempRules.enableNoFeiBonus ?? true)
                    ? 'bg-[#092215] border-emerald-800/80'
                    : 'bg-[#07180e] border-emerald-950 opacity-60'
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={tempRules.enableNoFeiBonus ?? true}
                        onChange={(e) => setTempRules({ ...tempRules, enableNoFeiBonus: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-500 bg-emerald-900 border-emerald-700"
                      />
                      <span className={`font-bold text-xs ${(tempRules.enableNoFeiBonus ?? true) ? 'text-emerald-200' : 'text-slate-400 line-through'}`}>
                        {lang === 'zh' ? '无飞 (清飞胡)' : 'No Fei (Clean)'}
                      </span>
                    </label>
                    {(tempRules.enableNoFeiBonus ?? true) ? (
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
                        {(tempRules.noFeiBonusFan ?? 1) === 0
                          ? (lang === 'zh' ? '0番' : '0')
                          : `+${tempRules.noFeiBonusFan ?? 1} 番`}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700">
                        {lang === 'zh' ? '不加番' : 'Off'}
                      </span>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 ${(tempRules.enableNoFeiBonus ?? true) ? '' : 'pointer-events-none opacity-40'}`}>
                    {[0, 1, 2].map((fan) => (
                      <button
                        key={fan}
                        type="button"
                        disabled={!(tempRules.enableNoFeiBonus ?? true)}
                        onClick={() => setTempRules({ ...tempRules, noFeiBonusFan: fan })}
                        className={`flex-1 py-1 rounded-lg font-bold text-xs transition ${
                          (tempRules.noFeiBonusFan ?? 1) === fan
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                        }`}
                      >
                        {fan === 0 ? (lang === 'zh' ? '0番' : '0') : `+${fan}`}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-emerald-400/80 block">
                    {(tempRules.enableNoFeiBonus ?? true)
                      ? (lang === 'zh' ? '手牌无任何飞牌百搭胡牌奖励。' : 'Win without any Fei jokers.')
                      : (lang === 'zh' ? '（已取消勾选：清飞无额外奖励）' : '(Unticked: Disabled)')
                    }
                  </span>
                </div>

                {/* 满天飞 (4飞直接胡) */}
                <div className={`border rounded-xl p-2.5 space-y-1.5 transition ${
                  (tempRules.enableFourFeiWin ?? true)
                    ? 'bg-[#092215] border-emerald-800/80'
                    : 'bg-[#07180e] border-emerald-950 opacity-60'
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={tempRules.enableFourFeiWin ?? true}
                        onChange={(e) => setTempRules({ ...tempRules, enableFourFeiWin: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-500 bg-emerald-900 border-emerald-700"
                      />
                      <span className={`font-bold text-xs ${(tempRules.enableFourFeiWin ?? true) ? 'text-emerald-200' : 'text-slate-400 line-through'}`}>
                        {lang === 'zh' ? '满天飞 (4飞直接胡)' : 'All 4 Fei Win'}
                      </span>
                    </label>
                    {(tempRules.enableFourFeiWin ?? true) ? (
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
                        {tempRules.fourFeiWinFan ?? 10} 番
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700">
                        {lang === 'zh' ? '不玩' : 'Off'}
                      </span>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 ${(tempRules.enableFourFeiWin ?? true) ? '' : 'pointer-events-none opacity-40'}`}>
                    {[5, 8, 10, 16].map((fan) => (
                      <button
                        key={fan}
                        type="button"
                        disabled={!(tempRules.enableFourFeiWin ?? true)}
                        onClick={() => setTempRules({ ...tempRules, fourFeiWinFan: fan })}
                        className={`flex-1 py-1 rounded-lg font-bold text-xs transition ${
                          (tempRules.fourFeiWinFan ?? 10) === fan
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                        }`}
                      >
                        {fan}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-emerald-400/80 block">
                    {(tempRules.enableFourFeiWin ?? true)
                      ? (lang === 'zh' ? '抓到4张飞牌满天飞大满贯包赢。' : 'Instant win with all 4 Fei.')
                      : (lang === 'zh' ? '（已取消勾选：4张飞不算直接满胡）' : '(Unticked: Disabled)')
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 7. 出冲包赔 & 动物咬花奖励规则 */}
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

            {/* 动物咬到奖励与即时出钱 */}
            <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-bold text-emerald-200 block text-xs">
                    {lang === 'zh' ? '动物咬到奖励 (猫吃老鼠 / 鸡啄蜈蚣)' : 'Animal Bite Bounty'}
                  </span>
                  <span className="text-[10px] text-emerald-400">
                    {lang === 'zh'
                      ? '取消勾选后，摸到猫鼠或鸡蜈蚣咬花既不算番，也不产生现金红包！'
                      : 'When unticked, animal bites yield 0 Fan and 0 cash bonus.'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={tempRules.enableAnimalBiteBonus}
                  onChange={(e) => setTempRules({ ...tempRules, enableAnimalBiteBonus: e.target.checked })}
                  className="w-5 h-5 rounded text-amber-500 bg-emerald-900 border-emerald-700"
                />
              </label>

              {tempRules.enableAnimalBiteBonus && (
                <div className="pt-2 border-t border-emerald-800/60 flex items-center justify-between text-xs">
                  <span className="text-emerald-300 text-[11px]">
                    {lang === 'zh' ? '咬到增加番数：' : 'Bite Fan:'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setTempRules({ ...tempRules, animalBiteFan: f })}
                        className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition ${
                          (tempRules.animalBiteFan ?? 1) === f
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {f === 0 ? (lang === 'zh' ? '0番(仅出钱)' : '0 Fan') : `${f} 番`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 5. 隐私与数据安全说明 */}
          <div className="bg-[#0b2919] border border-emerald-500/30 rounded-2xl p-3.5 space-y-1.5 text-[11px]">
            <div className="flex items-center gap-1.5 font-bold text-emerald-300">
              <span className="text-emerald-400">🛡️</span>
              <span>{lang === 'zh' ? '隐私与资金安全保障承诺' : 'Privacy & Security Guarantee'}</span>
            </div>
            <p className="text-emerald-400/90 leading-relaxed">
              {lang === 'zh'
                ? '• 本应用为纯前端离线架构，所有玩家姓名、赌注底价、对局战绩与转账记录均严格保存在您的手机本地浏览器中（LocalStorage）。'
                : '• All player names, stakes, game records, and transfer amounts are stored strictly in your local browser.'}
            </p>
            <p className="text-emerald-400/90 leading-relaxed">
              {lang === 'zh'
                ? '• 系统无任何后端数据库记录，不收集任何个人隐私，绝不向任何第三方泄露或转存您的打牌资金账单。'
                : '• No remote database, no tracking, zero telemetry. Your data stays 100% private.'}
            </p>
            <p className="text-emerald-400/90 leading-relaxed">
              {lang === 'zh'
                ? '• 拍照识牌图片仅在手机内存中实时处理，绝不回传服务器保存。'
                : '• Camera photos are processed in-memory and never stored on any server.'}
            </p>
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
