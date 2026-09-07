import React, { useState, useMemo, useEffect } from 'react';
import {
  MahjongTileData,
  Meld,
  MeldType,
  WinningConditions,
  RuleSettings,
  CalculationResult,
  Player,
  GameRoundRecord,
} from './types/mahjong';
import { DEFAULT_RULES } from './constants/defaultRules';
import { getTileById } from './constants/tiles';
import { soundFx } from './utils/soundEffects';
import { getFullShantenAnalysis } from './utils/mahjongEngine';
import { calculateMahjongScore } from './utils/fanCalculator';

import { Navbar } from './components/Navbar';
import { HandDisplay } from './components/HandDisplay';
import { TilePicker } from './components/TilePicker';
import { BeginnerHelper } from './components/BeginnerHelper';
import { FanResultModal } from './components/FanResultModal';
import { CameraScanner } from './components/CameraScanner';
import { SettingsModal } from './components/SettingsModal';
import { RulesGuideModal } from './components/RulesGuideModal';
import { HistoryModal } from './components/HistoryModal';
import { QRCodeModal } from './components/QRCodeModal';

const DEFAULT_PLAYERS: Player[] = [
  { id: 'p1', name: '玩家 1 (我)', seat: 'east' },
  { id: 'p2', name: '玩家 2 (对家)', seat: 'south' },
  { id: 'p3', name: '玩家 3 (下家)', seat: 'west' },
];

export const App: React.FC = () => {
  // 1. 本地存储配置
  const [lang, setLang] = useState<'zh' | 'en'>(() => {
    return (localStorage.getItem('mahjong_lang') as 'zh' | 'en') || 'zh';
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const s = localStorage.getItem('mahjong_sound');
    return s !== null ? s === 'true' : true;
  });

  const [rules, setRules] = useState<RuleSettings>(() => {
    const saved = localStorage.getItem('mahjong_rules');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return DEFAULT_RULES;
  });

  // 2. 玩家与战绩账本状态 (持久化到 localStorage)
  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem('mahjong_players');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return DEFAULT_PLAYERS;
  });

  const [rounds, setRounds] = useState<GameRoundRecord[]>(() => {
    const saved = localStorage.getItem('mahjong_rounds');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return [];
  });

  const [roundRecorded, setRoundRecorded] = useState(false);

  // 3. 当前牌局手牌数据
  const [handTiles, setHandTiles] = useState<MahjongTileData[]>([]);
  const [melds, setMelds] = useState<Meld[]>([]);
  const [flowers, setFlowers] = useState<MahjongTileData[]>([]);

  // 4. 胡牌条件
  const [winningConditions, setWinningConditions] = useState<WinningConditions>({
    isZimo: true,
    isConcealed: true,
    isKongBloom: false,
    isRobbingKong: false,
    isLastTileDraw: false,
    isLastTileDiscard: false,
    playerSeat: 'east',
    roundWind: 'east',
    isShooterDouble: true,
  });

  // 5. 弹窗控制
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isQRCodeOpen, setIsQRCodeOpen] = useState(false);
  const [calcResult, setCalcResult] = useState<CalculationResult | null>(null);

  // 同步音效开关
  useEffect(() => {
    soundFx.enabled = soundEnabled;
    localStorage.setItem('mahjong_sound', String(soundEnabled));
  }, [soundEnabled]);

  // 同步玩家与战绩
  useEffect(() => {
    localStorage.setItem('mahjong_players', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem('mahjong_rounds', JSON.stringify(rounds));
  }, [rounds]);

  // 同步语言
  const handleToggleLang = () => {
    const next = lang === 'zh' ? 'en' : 'zh';
    setLang(next);
    localStorage.setItem('mahjong_lang', next);
  };

  // 保存规则
  const handleSaveRules = (newRules: RuleSettings) => {
    setRules(newRules);
    localStorage.setItem('mahjong_rules', JSON.stringify(newRules));
  };

  const handleResetRules = () => {
    setRules(DEFAULT_RULES);
    localStorage.setItem('mahjong_rules', JSON.stringify(DEFAULT_RULES));
  };

  // 计算当前有效常规牌总张数 (立牌 + 飞牌 + 副露*3)
  const totalRegularTilesCount = useMemo(() => {
    return handTiles.length + melds.length * 3;
  }, [handTiles, melds]);

  // 实时分析向听数与新手指导
  const shantenAnalysis = useMemo(() => {
    return getFullShantenAnalysis(handTiles, melds);
  }, [handTiles, melds]);

  const isWinReady = shantenAnalysis.currentShanten === -1;

  // 手牌操作：添加单张牌
  const handleAddTile = (tile: MahjongTileData) => {
    if (totalRegularTilesCount >= 14) {
      alert(lang === 'zh' ? '手牌已满 14 张（或已包含4组副露），无法再添加！' : 'Hand is already full (14 tiles max)!');
      return;
    }
    setHandTiles(prev => [...prev, tile]);
    setRoundRecorded(false);
  };

  // 副露操作：添加副露
  const handleAddMeld = (type: MeldType, tiles: MahjongTileData[]) => {
    if (melds.length >= 4) {
      alert(lang === 'zh' ? '副露已达上限 4 组！' : 'Maximum 4 melds reached!');
      return;
    }
    if (totalRegularTilesCount + 3 > 14) {
      alert(lang === 'zh' ? '剩余张数不足以再加一副露！' : 'Not enough room for another meld!');
      return;
    }
    const newMeld: Meld = {
      id: `meld_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type,
      tiles,
    };
    setMelds(prev => [...prev, newMeld]);
    setRoundRecorded(false);
  };

  // 花牌与动物操作
  const handleAddFlower = (tile: MahjongTileData) => {
    if (flowers.some(f => f.id === tile.id)) {
      return;
    }
    setFlowers(prev => [...prev, tile]);
    setRoundRecorded(false);
  };

  // 移除操作
  const handleRemoveHandTile = (index: number) => {
    setHandTiles(prev => {
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
    setRoundRecorded(false);
  };

  const handleRemoveMeld = (meldId: string) => {
    setMelds(prev => prev.filter(m => m.id !== meldId));
    setRoundRecorded(false);
  };

  const handleRemoveFlower = (index: number) => {
    setFlowers(prev => {
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
    setRoundRecorded(false);
  };

  // 清空手牌
  const handleClearHand = () => {
    setHandTiles([]);
    setMelds([]);
    setFlowers([]);
    setCalcResult(null);
    setRoundRecorded(false);
  };

  // 触发算番计算并弹出账单
  const handleCalculate = () => {
    const res = calculateMahjongScore(handTiles, melds, flowers, winningConditions, rules);
    setCalcResult(res);
    setRoundRecorded(false);
    setIsResultOpen(true);
  };

  // 记入对局战绩账本
  const handleRecordRound = (winnerId: string, shooterId?: string) => {
    if (!calcResult) return;

    const payouts: Record<string, number> = {};
    const winPot = calcResult.payout.winnerReceivedTotal;

    if (winningConditions.isZimo) {
      // 自摸：赢家收两家钱，其他两位玩家各付 eachPayIfZimo
      payouts[winnerId] = winPot;
      players.forEach(p => {
        if (p.id !== winnerId) {
          payouts[p.id] = -calcResult.payout.eachPayIfZimo;
        }
      });
    } else {
      // 出冲：放炮者付 shooterPays
      payouts[winnerId] = winPot;
      const actualShooterId = shooterId || players.find(p => p.id !== winnerId)?.id || '';
      players.forEach(p => {
        if (p.id === actualShooterId) {
          payouts[p.id] = -calcResult.payout.shooterPays;
        } else if (p.id !== winnerId) {
          payouts[p.id] = 0;
        }
      });
    }

    const newRecord: GameRoundRecord = {
      id: `round_${Date.now()}`,
      roundNumber: rounds.length + 1,
      timestamp: Date.now(),
      winnerId,
      winType: winningConditions.isZimo ? 'zimo' : 'discard',
      shooterId: winningConditions.isZimo ? undefined : shooterId,
      fan: calcResult.totalFan,
      effectiveFan: calcResult.effectiveFan,
      handPattern: calcResult.handPatternNameZh,
      payouts,
      totalPot: winPot,
      notes: calcResult.payout.ruleSummary,
    };

    setRounds(prev => [newRecord, ...prev]);
    setRoundRecorded(true);
  };

  // 删除某局历史
  const handleDeleteRound = (roundId: string) => {
    setRounds(prev => prev.filter(r => r.id !== roundId));
  };

  // 重置整场牌局
  const handleResetSession = () => {
    if (window.confirm(lang === 'zh' ? '确定要清空整场牌局历史记录吗？' : 'Reset all session history?')) {
      setRounds([]);
    }
  };

  // 导入拍照识别结果
  const handleApplyRecognizedHand = (
    scannedHand: MahjongTileData[],
    scannedMelds: Meld[],
    scannedFlowers: MahjongTileData[]
  ) => {
    setHandTiles(scannedHand);
    setMelds(scannedMelds);
    setFlowers(scannedFlowers);
    setRoundRecorded(false);
  };

  // 载入高手经典范例牌
  const sampleIndexRef = React.useRef(0);
  const handleLoadSample = () => {
    const samples = [
      // 范例 1: 经典 8 番混一色 + 飞牌 + 猫抓老鼠咬花
      {
        hand: ['tong_2', 'tong_3', 'tong_4', 'tong_7', 'tong_8', 'tong_9', 'wind_east', 'wind_east', 'dragon_zhong', 'dragon_zhong', 'dragon_zhong', 'fei_1', 'fei_2', 'tong_5'],
        melds: [],
        flowers: ['animal_cat', 'animal_rat', 'flower_chun', 'flower_xia'],
        conditions: { isZimo: true, playerSeat: 'east' as const },
      },
      // 范例 2: 清一色纯筒大牌 (清一色4番 + 门清2番 + 自摸1番 + 飞牌1番 = 8番)
      {
        hand: ['tong_1', 'tong_1', 'tong_1', 'tong_3', 'tong_4', 'tong_5', 'tong_6', 'tong_7', 'tong_8', 'tong_9', 'tong_9', 'tong_9', 'fei_1', 'tong_2'],
        melds: [],
        flowers: ['flower_mei', 'flower_lan', 'flower_zhu'],
        conditions: { isZimo: true, playerSeat: 'south' as const },
      },
      // 范例 3: 13张听牌状态 (给新手演示听牌分析)
      {
        hand: ['tong_1', 'tong_2', 'tong_3', 'tong_4', 'tong_5', 'tong_6', 'dragon_fa', 'dragon_fa', 'dragon_fa', 'wind_south', 'wind_south', 'wind_south', 'tong_8'],
        melds: [],
        flowers: ['animal_rooster', 'animal_centipede'],
        conditions: { isZimo: false, playerSeat: 'west' as const },
      },
    ];

    const current = samples[sampleIndexRef.current % samples.length];
    sampleIndexRef.current++;

    setHandTiles(current.hand.map(id => getTileById(id)));
    setMelds(current.melds);
    setFlowers(current.flowers.map(id => getTileById(id)));
    setWinningConditions(prev => ({
      ...prev,
      isZimo: current.conditions.isZimo,
      playerSeat: current.conditions.playerSeat,
    }));
    setRoundRecorded(false);
  };

  useEffect(() => {
    handleLoadSample();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#092215] via-[#0d3420] to-[#06170e] text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      {/* 顶部导航 */}
      <Navbar
        lang={lang}
        onToggleLang={handleToggleLang}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenQRCode={() => setIsQRCodeOpen(true)}
        roundsCount={rounds.length}
        onOpenCamera={() => setIsCameraOpen(true)}
        onClearHand={handleClearHand}
        onLoadSample={handleLoadSample}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
      />

      {/* 主工作台 */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* 1. 当前手牌展示与胡牌条件 */}
        <HandDisplay
          handTiles={handTiles}
          melds={melds}
          flowers={flowers}
          winningConditions={winningConditions}
          onUpdateConditions={(cond) => setWinningConditions(prev => ({ ...prev, ...cond }))}
          onRemoveHandTile={handleRemoveHandTile}
          onRemoveMeld={handleRemoveMeld}
          onRemoveFlower={handleRemoveFlower}
          lang={lang}
          onCalculate={handleCalculate}
          isWinReady={isWinReady}
          totalTilesCount={totalRegularTilesCount}
        />

        {/* 2. 新手打牌与听牌指导建议 */}
        <BeginnerHelper
          analysis={shantenAnalysis}
          rules={rules}
          lang={lang}
          onSelectDiscardTile={(tile) => {
            const idx = handTiles.findIndex(t => t.id === tile.id);
            if (idx !== -1) {
              handleRemoveHandTile(idx);
            }
          }}
        />

        {/* 3. 选牌面板 (筒子、字牌、飞牌、花牌与动物) */}
        <TilePicker
          onAddTile={handleAddTile}
          onAddMeld={handleAddMeld}
          onAddFlower={handleAddFlower}
          handTiles={handTiles}
          flowers={flowers}
          lang={lang}
        />
      </main>

      {/* 底部信息 */}
      <footer className="py-4 border-t border-emerald-800/50 text-center text-xs text-emerald-400/80 bg-[#071a10]">
        <p>
          🀄 马来西亚三人麻将算番与算钱助手 · 战绩账本 · 自动对账转账结算
        </p>
      </footer>

      {/* 结算账单弹窗 */}
      <FanResultModal
        isOpen={isResultOpen}
        onClose={() => setIsResultOpen(false)}
        result={calcResult}
        rules={rules}
        conditions={winningConditions}
        lang={lang}
        players={players}
        onRecordRound={handleRecordRound}
        roundRecorded={roundRecorded}
      />

      {/* 战绩账本与终局转账弹窗 */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        players={players}
        rounds={rounds}
        onUpdatePlayerNames={setPlayers}
        onDeleteRound={handleDeleteRound}
        onResetSession={handleResetSession}
        lang={lang}
      />

      {/* 拍照识牌弹窗 */}
      <CameraScanner
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onApplyRecognizedHand={handleApplyRecognizedHand}
        lang={lang}
      />

      {/* 底价与倍数规则设置弹窗 */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        rules={rules}
        onSaveRules={handleSaveRules}
        onResetDefault={handleResetRules}
        lang={lang}
      />

      {/* 新手规则与番种大全弹窗 */}
      <RulesGuideModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
        lang={lang}
      />

      {/* 扫码分享弹窗 */}
      <QRCodeModal
        isOpen={isQRCodeOpen}
        onClose={() => setIsQRCodeOpen(false)}
        lang={lang}
      />
    </div>
  );
};
