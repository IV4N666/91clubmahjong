import React, { useState } from 'react';
import {
  BookOpen,
  X,
  Sparkles,
  Award,
  HelpCircle,
  Zap,
} from 'lucide-react';

interface RulesGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'zh' | 'en';
}

export const RulesGuideModal: React.FC<RulesGuideModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const [activeCategory, setActiveCategory] = useState<'basics' | 'fan_list' | 'animals' | 'glossary'>('basics');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#14482e] to-[#0c2c1b] border border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 border-b border-emerald-700/60 p-4 text-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-mahjong font-bold text-base sm:text-lg">
                {lang === 'zh' ? '马来西亚三人麻将速查秘籍' : 'Malaysian 3P Mahjong Guide & Rules'}
              </h2>
              <p className="text-[11px] text-emerald-300">
                {lang === 'zh' ? '大马拉飞番种表、咬花图解与实战打法' : 'Hand types, fan catalog, and animal biting rules'}
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

        {/* 顶部标签分类导航 */}
        <div className="flex items-center gap-1.5 p-2 bg-[#0a2717] border-b border-emerald-800 text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveCategory('basics')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
              activeCategory === 'basics'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-emerald-300 hover:bg-emerald-900'
            }`}
          >
            🀄 {lang === 'zh' ? '新手入门 (基础牌型)' : 'Basics'}
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('fan_list')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
              activeCategory === 'fan_list'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-emerald-300 hover:bg-emerald-900'
            }`}
          >
            ✨ {lang === 'zh' ? '番种速查大全' : 'Fan Catalog'}
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('animals')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
              activeCategory === 'animals'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-emerald-300 hover:bg-emerald-900'
            }`}
          >
            🐾 {lang === 'zh' ? '咬花与动物特辑' : 'Animal Biting'}
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('glossary')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
              activeCategory === 'glossary'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-emerald-300 hover:bg-emerald-900'
            }`}
          >
            📖 {lang === 'zh' ? '大马麻将术语词典' : 'Glossary'}
          </button>
        </div>

        {/* 内容区 */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-slate-100 flex-1 text-xs leading-relaxed">
          {/* 1. 新手入门 */}
          {activeCategory === 'basics' && (
            <div className="space-y-4">
              <div className="bg-[#0b2919] border border-emerald-800 rounded-2xl p-4 space-y-2">
                <h3 className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                  <span>1. 什么是马来西亚三人麻将？</span>
                </h3>
                <p className="text-emerald-200">
                  马来西亚三人麻将（俗称<b>三人麻雀 / 拉飞</b>），节奏极快、大牌频出，深受新马华人喜爱。
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-emerald-300">
                  <div className="bg-emerald-950/70 p-2.5 rounded-xl border border-emerald-800">
                    <span className="font-bold text-emerald-100 block mb-1">🀄 只有一种花色：</span>
                    只使用 <b>一筒至九筒</b>（共 36 张）。完全没有万子和条子！
                  </div>
                  <div className="bg-emerald-950/70 p-2.5 rounded-xl border border-emerald-800">
                    <span className="font-bold text-emerald-100 block mb-1">⭐ 神奇飞牌（百搭）：</span>
                    共有 <b>4 张飞牌</b>。飞牌可变幻成任何牌，摸齐 4 张飞直接大满贯胡牌！
                  </div>
                  <div className="bg-emerald-950/70 p-2.5 rounded-xl border border-emerald-800">
                    <span className="font-bold text-emerald-100 block mb-1">🧭 字牌：</span>
                    风牌（东、南、西、北 16张）与三元牌（红中、发财、白板 12张）。
                  </div>
                  <div className="bg-emerald-950/70 p-2.5 rounded-xl border border-emerald-800">
                    <span className="font-bold text-emerald-100 block mb-1">🌺 花牌与动物：</span>
                    四季（春夏秋冬）、四君子（梅兰竹菊）加 4 只动物（猫、鼠、鸡、蜈蚣）。
                  </div>
                </div>
              </div>

              <div className="bg-[#0b2919] border border-emerald-800 rounded-2xl p-4 space-y-2">
                <h3 className="font-bold text-amber-300 text-sm">
                  2. 怎样才算胡牌？（4 面子 + 1 雀头）
                </h3>
                <p className="text-emerald-200">
                  常规情况下，手牌需由 <b>4 组面子</b>（顺子或碰牌刻子/杠子）加上 <b>1 对雀头（两张一样的对子）</b> 凑齐 14 张牌。
                </p>
                <div className="p-3 bg-emerald-950/80 rounded-xl border border-emerald-700 text-amber-200 font-medium">
                  ⚠️ <b>核心门槛：五番起胡！</b><br />
                  凑齐 14 张牌后，累计的总番数必须达到 <b>5 番</b>（或根据约定 3 番）才能胡牌。如果只有 3 番是不能推牌的哦！
                </div>
              </div>
            </div>
          )}

          {/* 2. 番种速查大全 */}
          {activeCategory === 'fan_list' && (
            <div className="space-y-3">
              {/* 10番/满胡 */}
              <div className="bg-gradient-to-r from-amber-950/80 to-emerald-950/80 border border-amber-500/50 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between border-b border-amber-500/30 pb-1.5">
                  <span className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                    👑 满胡 / 10 番大牌 (封顶)
                  </span>
                  <span className="font-black text-amber-400">10 番</span>
                </div>
                <ul className="space-y-1 text-emerald-200">
                  <li><b>无花 (清花爆番)：</b> 赢牌时手头一张花牌、季节牌与动物神兽都没摸到（大马三人麻将维基百科经典 Limit Hand：No flowers/animals，直接满胡爆番 10 番）！</li>
                  <li><b>满天飞 (全飞)：</b> 手牌摸得 4 张飞牌百搭，无条件直接大满贯胡牌！</li>
                  <li><b>十三幺：</b> 1筒、9筒、东南西北、中发白各一张，加上其中任意一张作对子，外加飞牌。</li>
                  <li><b>大四喜：</b> 东南西北四组风牌刻子全齐。</li>
                  <li><b>十八罗汉：</b> 一人开四组杠牌（4组杠牌 = 16张 + 1对雀头）。</li>
                  <li><b>坎坎胡 (四暗刻)：</b> 门清状态下手牌全由未碰出的 4 组刻子组成。</li>
                </ul>
              </div>

              {/* 5番 */}
              <div className="bg-[#0b2919] border border-emerald-800 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between border-b border-emerald-800 pb-1.5">
                  <span className="font-bold text-emerald-200 text-sm">🔥 5 番高番牌型</span>
                  <span className="font-black text-amber-300">5 番</span>
                </div>
                <ul className="space-y-1 text-emerald-300">
                  <li><b>大三元：</b> 红中、发财、白板三组刻子全齐。</li>
                  <li><b>小四喜：</b> 三组风牌刻子 + 一组风牌对子。</li>
                  <li><b>齐抓四兽：</b> 一人摸齐猫、老鼠、公鸡、蜈蚣四只动物神兽。</li>
                </ul>
              </div>

              {/* 4番 */}
              <div className="bg-[#0b2919] border border-emerald-800 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between border-b border-emerald-800 pb-1.5">
                  <span className="font-bold text-emerald-200 text-sm">⚡ 4 番核心主力</span>
                  <span className="font-black text-amber-300">4 番</span>
                </div>
                <ul className="space-y-1 text-emerald-300">
                  <li><b>清一色 (全色)：</b> 整手牌全是筒子，一张字牌也没有。</li>
                  <li><b>七对子：</b> 7 对对子（可用飞牌当百搭）。</li>
                </ul>
              </div>

              {/* 2-3番 */}
              <div className="bg-[#0b2919] border border-emerald-800 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between border-b border-emerald-800 pb-1.5">
                  <span className="font-bold text-emerald-200 text-sm">🌟 2 ~ 3 番牌型</span>
                  <span className="font-black text-amber-300">2~3 番</span>
                </div>
                <ul className="space-y-1 text-emerald-300">
                  <li><b>碰碰胡 (+2番)：</b> 全部由刻子/杠子组成，无顺子。</li>
                  <li><b>混一色/半色 (+2番)：</b> 筒子搭配东南西北或中发白。</li>
                  <li><b>一条龙 (+2番)：</b> 持有一至九筒完整连贯龙型。</li>
                  <li><b>小三元 (+3番)：</b> 两组三元牌刻子 + 一组三元牌对子。</li>
                  <li><b>一套花 (+2番)：</b> 集齐春夏秋冬或梅兰竹菊。</li>
                  <li><b>暗杠 (+2番)：</b> 摸齐 4 张自开暗杠。</li>
                </ul>
              </div>

              {/* 1番小贴士 */}
              <div className="bg-[#0b2919] border border-emerald-800 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between border-b border-emerald-800 pb-1.5">
                  <span className="font-bold text-emerald-200 text-sm">💧 1 番基础与奖励</span>
                  <span className="font-black text-amber-300">1 番</span>
                </div>
                <p className="text-emerald-300">
                  自摸 (+1)、门清 (+1)、杠上开花 (+1)、海底捞月 (+1)、抢杠 (+1)、飞牌在手 (+1/张)、无飞清飞奖励 (+1)、每只花牌/动物 (+1)、动物咬到 (+1)、中发白刻子 (+1)、圈风/门风刻子 (+1)、明杠 (+1)。
                </p>
              </div>
            </div>
          )}

          {/* 3. 咬花与动物特辑 */}
          {activeCategory === 'animals' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-orange-950/70 to-purple-950/70 border border-amber-500/40 rounded-2xl p-4 space-y-3">
                <h3 className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                  <span>🐾 什么是“咬花”？（即时现金红包！）</span>
                </h3>
                <p className="text-emerald-200">
                  大马三人麻将中最刺激的特色就是动物互相“咬到”！摸到一对相克的动物时，不仅额外算番，桌上其他两家必须<b>立即自掏腰包给赢家现金红包（如 RM 1.00）</b>！
                </p>

                {/* 咬花配对卡片 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="bg-black/30 border border-amber-500/40 rounded-xl p-3 text-center space-y-1">
                    <div className="text-3xl animate-bounce">🐱 ⚡ 🐭</div>
                    <div className="font-bold text-amber-300 text-sm">猫 抓 老 鼠</div>
                    <p className="text-[11px] text-emerald-300">
                      猫把老鼠吃掉！大快人心！奖励 +1 番并即时出钱！
                    </p>
                  </div>

                  <div className="bg-black/30 border border-purple-500/40 rounded-xl p-3 text-center space-y-1">
                    <div className="text-3xl animate-bounce">🐓 ⚡ 🐛</div>
                    <div className="font-bold text-purple-300 text-sm">公 鸡 啄 蜈 蚣</div>
                    <p className="text-[11px] text-purple-200">
                      大公鸡一口吃掉大蜈蚣！奖励 +1 番并即时出钱！
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-black/40 rounded-xl border border-emerald-800 text-emerald-300">
                  👑 <b>终极大奖：齐抓四兽！</b><br />
                  如果你一个人摸齐了 猫、老鼠、公鸡、蜈蚣 全部 4 只动物，恭喜你达成【齐抓四兽】，直接狂揽 <b>5 番大满贯</b>！
                </div>
              </div>
            </div>
          )}

          {/* 4. 术语词典 */}
          {activeCategory === 'glossary' && (
            <div className="space-y-3">
              <div className="bg-[#0b2919] border border-emerald-800 rounded-2xl p-3.5 space-y-1.5">
                <span className="font-bold text-amber-300 text-sm block">拉飞 (La Fei)</span>
                <p className="text-emerald-200">
                  马来西亚三人麻将的代名词。“飞”即百搭牌，拉飞意思是利用飞牌快速组合面子、迅速听牌冲大番。
                </p>
              </div>

              <div className="bg-[#0b2919] border border-emerald-800 rounded-2xl p-3.5 space-y-1.5">
                <span className="font-bold text-amber-300 text-sm block">包牌 / 包出冲 (Shooter Covers All)</span>
                <p className="text-emerald-200">
                  如果不是自摸，而是别家打出来的牌被你胡牌（出冲/放铳），打出这张牌的玩家需要一人替另一家全包承担总输额。
                </p>
              </div>

              <div className="bg-[#0b2919] border border-emerald-800 rounded-2xl p-3.5 space-y-1.5">
                <span className="font-bold text-amber-300 text-sm block">清飞 / 无飞 (Clean Hand)</span>
                <p className="text-emerald-200">
                  在飞牌满天飞的牌局中，如果一手牌完全没有依靠任何一张飞牌，纯凭真牌胡牌，大马规矩会额外给予 +1 番清飞奖励！
                </p>
              </div>

              <div className="bg-[#0b2919] border border-emerald-800 rounded-2xl p-3.5 space-y-1.5">
                <span className="font-bold text-amber-300 text-sm block">爆头 / 封顶 (Cap Limit)</span>
                <p className="text-emerald-200">
                  通常设立 10 番为满胡（最高按 10 番结算），防止有人做成几十番导致输额过大。如果牌局约定“无上限”，则有多少番算多少番（爆头）。
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0a2416] border-t border-emerald-800/80 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow transition"
          >
            {lang === 'zh' ? '关闭秘籍' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
