import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX,
  Play,
  Bot,
  Users,
  Award,
  Zap,
  ArrowRight,
  ShieldAlert,
  Info,
  Layers,
  HelpCircle,
} from 'lucide-react';
import {
  MahjongTileData,
  Meld,
  RuleSettings,
  WinningConditions,
  CalculationResult,
  GameRoundRecord,
} from '../types/mahjong';
import { GameTile, GameSeatIndex, GamePlayer, RoundSettlement } from '../types/game';
import {
  generateMalaysia3PDeck,
  shuffleDeck,
  sortHandTiles,
  replaceFlowersInHands,
  checkCanPlayerWin,
  checkCanPlayerPong,
  checkCanPlayerKong,
  chooseSmartAIDiscard,
  decideAIClaim,
} from '../utils/mahjongGameEngine';
import { getFullShantenAnalysis } from '../utils/mahjongEngine';
import { calculateMahjongScore } from '../utils/fanCalculator';
import { soundFx } from '../utils/soundEffects';
import { MahjongTile } from './MahjongTile';
import { RoomLobbyModal } from './RoomLobbyModal';
import { multiplayerService } from '../utils/multiplayerService';

interface MahjongGameTabProps {
  rules: RuleSettings;
  lang: 'zh' | 'en';
  soundEnabled: boolean;
  onRecordRoundToLedger: (record: GameRoundRecord) => void;
  onOpenRules: () => void;
}

export const MahjongGameTab: React.FC<MahjongGameTabProps> = ({
  rules,
  lang,
  soundEnabled,
  onRecordRoundToLedger,
  onOpenRules,
}) => {
  // 1. 对局基本状态
  const [roundNumber, setRoundNumber] = useState(1);
  const [dealerIndex, setDealerIndex] = useState<GameSeatIndex>(0);
  const [currentTurn, setCurrentTurn] = useState<GameSeatIndex>(0);
  const [mySeatIndex, setMySeatIndex] = useState<GameSeatIndex>(0);
  const [phase, setPhase] = useState<'idle' | 'playing' | 'claimWindow' | 'roundOver'>('idle');

  // 牌墙与 3 位玩家
  const [wall, setWall] = useState<GameTile[]>([]);
  const [players, setPlayers] = useState<GamePlayer[]>([
    {
      id: 'p0',
      name: '我',
      isAI: false,
      isHost: true,
      seat: 0,
      wind: 'east',
      hand: [],
      handCount: 0,
      melds: [],
      flowers: [],
      discards: [],
    },
    {
      id: 'p1',
      name: '电脑 1 (对家)',
      isAI: true,
      isHost: false,
      seat: 1,
      wind: 'south',
      hand: [],
      handCount: 0,
      melds: [],
      flowers: [],
      discards: [],
    },
    {
      id: 'p2',
      name: '电脑 2 (下家)',
      isAI: true,
      isHost: false,
      seat: 2,
      wind: 'west',
      hand: [],
      handCount: 0,
      melds: [],
      flowers: [],
      discards: [],
    },
  ]);

  // 最近一张打出的牌
  const [lastDiscard, setLastDiscard] = useState<{ playerIndex: GameSeatIndex; tile: GameTile } | null>(null);

  // 碰/杠/胡的响应窗口
  const [claimPrompt, setClaimPrompt] = useState<{
    actions: ('pong' | 'kong' | 'win')[];
    tile: GameTile;
    fromPlayerIndex: GameSeatIndex;
  } | null>(null);

  // 终局结算
  const [settlement, setSettlement] = useState<RoundSettlement | null>(null);
  const [isRecorded, setIsRecorded] = useState(false);

  // 房间大厅弹窗
  const [isLobbyOpen, setIsLobbyOpen] = useState(false);
  const [gameMode, setGameMode] = useState<'solo' | 'multiplayer'>('solo');

  // 游戏速度: 'normal' (1000ms) / 'fast' (350ms)
  const [gameSpeed, setGameSpeed] = useState<'normal' | 'fast'>('normal');

  // 提示信息条
  const [bannerMsg, setBannerMsg] = useState('点击「开始新对局」洗牌开局！');

  // AI 计时器引用
  const aiTimerRef = useRef<any>(null);

  // 获取桌面所有已见公共牌 (用于向听与 outs 分析)
  const allDiscards = useMemo(() => {
    return players.flatMap(p => p.discards);
  }, [players]);

  // 本机玩家的实时向听与听牌提示
  const myShantenAnalysis = useMemo(() => {
    const me = players[mySeatIndex];
    if (!me || me.hand.length === 0) return null;
    return getFullShantenAnalysis(me.hand, me.melds, allDiscards);
  }, [players, mySeatIndex, allDiscards]);

  // --------------------------------------------------------------------------
  // 初始化或开启全新对局
  // --------------------------------------------------------------------------
  const startNewGame = (customPlayers?: { name: string; isAI: boolean; seat: GameSeatIndex }[]) => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);

    // 1. 生成 84 张牌并充分洗牌
    const fullDeck = shuffleDeck(generateMalaysia3PDeck());

    // 2. 发牌：庄家 14 张，闲家各 13 张
    const initialHands: GameTile[][] = [[], [], []];
    const initialFlowers: GameTile[][] = [[], [], []];

    // 庄家先抓 14 张
    for (let i = 0; i < 14; i++) {
      initialHands[dealerIndex].push(fullDeck.pop()!);
    }
    // 两位闲家各抓 13 张
    for (let s = 0; s < 3; s++) {
      if (s !== dealerIndex) {
        for (let i = 0; i < 13; i++) {
          initialHands[s].push(fullDeck.pop()!);
        }
      }
    }

    // 3. 自动补花
    const replaced = replaceFlowersInHands(initialHands, initialFlowers, fullDeck);

    // 4. 构建 3 位玩家初始状态
    const newPlayers: GamePlayer[] = players.map((p, idx) => {
      const custom = customPlayers ? customPlayers[idx] : null;
      const seat = idx as GameSeatIndex;
      const winds: ('east' | 'south' | 'west')[] = ['east', 'south', 'west'];
      return {
        ...p,
        name: custom?.name || p.name,
        isAI: custom ? custom.isAI : p.isAI,
        seat,
        wind: winds[seat],
        hand: replaced.hands[seat],
        handCount: replaced.hands[seat].length,
        melds: [],
        flowers: replaced.flowers[seat],
        discards: [],
      };
    });

    setWall(replaced.wall);
    setPlayers(newPlayers);
    setCurrentTurn(dealerIndex);
    setLastDiscard(null);
    setClaimPrompt(null);
    setSettlement(null);
    setIsRecorded(false);
    setPhase('playing');

    const msg = replaced.totalReplaced > 0
      ? `自动补花 ${replaced.totalReplaced} 张完成！轮到 [${newPlayers[dealerIndex].name}] 出牌`
      : `开局就绪！轮到 [${newPlayers[dealerIndex].name}] 出牌`;
    setBannerMsg(msg);

    // 检查庄家起手是否有天胡或4飞
    const dealerPlayer = newPlayers[dealerIndex];
    const canDealerWin = checkCanPlayerWin(
      dealerPlayer.hand,
      dealerPlayer.melds,
      dealerPlayer.flowers,
      undefined,
      true,
      dealerPlayer.wind,
      rules
    );

    if (canDealerWin.canWin && canDealerWin.calcResult) {
      if (dealerIndex === mySeatIndex) {
        setBannerMsg('🎉 恭喜！起手天胡/满天飞达成，可直接宣胡！');
      } else {
        // AI 天胡
        setTimeout(() => {
          handleDeclareWin(dealerIndex, 'zimo', undefined, canDealerWin.calcResult!);
        }, 1000);
        return;
      }
    }

    // 若庄家是 AI，触发 AI 出牌
    if (dealerPlayer.isAI) {
      scheduleAITurn(dealerIndex, newPlayers, replaced.wall);
    }
  };

  // --------------------------------------------------------------------------
  // 出牌逻辑 (玩家或 AI)
  // --------------------------------------------------------------------------
  const handleDiscardTile = (playerIndex: GameSeatIndex, tile: GameTile) => {
    soundFx.playTileClick();

    // 1. 从该玩家手中移除该牌，并放入该玩家出牌河
    setPlayers(prev => {
      const copy = [...prev];
      const p = copy[playerIndex];
      const nextHand = p.hand.filter(t => t.uid !== tile.uid);
      copy[playerIndex] = {
        ...p,
        hand: nextHand,
        handCount: nextHand.length,
        discards: [...p.discards, tile],
      };
      return copy;
    });

    setLastDiscard({ playerIndex, tile });

    // 2. 检查另外 2 位玩家是否能 胡 / 杠 / 碰 该张牌
    const otherSeats = ([0, 1, 2] as GameSeatIndex[]).filter(s => s !== playerIndex);

    let someoneCanClaim = false;

    for (const seat of otherSeats) {
      const targetPlayer = players[seat];

      // 检查胡 (出冲胡)
      const winCheck = checkCanPlayerWin(
        targetPlayer.hand,
        targetPlayer.melds,
        targetPlayer.flowers,
        tile,
        false,
        targetPlayer.wind,
        rules
      );

      // 检查杠 (明杠)
      const kongCheck = checkCanPlayerKong(targetPlayer.hand, targetPlayer.melds, tile);

      // 检查碰
      const pongCheck = checkCanPlayerPong(targetPlayer.hand, tile);

      const availableActions: ('pong' | 'kong' | 'win')[] = [];
      if (winCheck.canWin) availableActions.push('win');
      if (kongCheck.canKong) availableActions.push('kong');
      if (pongCheck) availableActions.push('pong');

      if (availableActions.length > 0) {
        someoneCanClaim = true;

        if (seat === mySeatIndex) {
          // 本机真人玩家满足吃碰杠胡条件 -> 弹出高亮操作面板
          soundFx.playWin();
          setPhase('claimWindow');
          setClaimPrompt({
            actions: availableActions,
            tile,
            fromPlayerIndex: playerIndex,
          });
          setBannerMsg(`对家打出 [${tile.nameZh}]，你可以进行操作！`);
          return; // 暂停等待玩家抉择
        } else {
          // AI 玩家满足条件 -> AI 自动决策
          const aiChoice = decideAIClaim(availableActions, targetPlayer.hand, targetPlayer.melds, tile);
          if (aiChoice === 'win') {
            handleDeclareWin(seat, 'discard', playerIndex, winCheck.calcResult!);
            return;
          } else if (aiChoice === 'kong') {
            executeKong(seat, tile, 'ming');
            return;
          } else if (aiChoice === 'pong') {
            executePong(seat, tile);
            return;
          }
        }
      }
    }

    // 3. 若无人碰/杠/胡，牌局流转到下一位玩家
    advanceToNextTurn((playerIndex + 1) % 3 as GameSeatIndex);
  };

  // --------------------------------------------------------------------------
  // 轮转至下一位玩家：摸牌与补花
  // --------------------------------------------------------------------------
  const advanceToNextTurn = (nextSeat: GameSeatIndex) => {
    setClaimPrompt(null);
    setPhase('playing');
    setCurrentTurn(nextSeat);

    // 检查流局 (荒牌)：牌墙摸尽
    if (wall.length === 0) {
      handleDrawGame();
      return;
    }

    // 摸一张牌
    const newWall = [...wall];
    let drawn = newWall.pop()!;
    let currentHand = [...players[nextSeat].hand];
    let currentFlowers = [...players[nextSeat].flowers];

    // 摸到花牌或动物，自动补花
    while ((drawn.category === 'flower' || drawn.category === 'animal') && newWall.length > 0) {
      currentFlowers.push(drawn);
      soundFx.playTileClick();
      drawn = newWall.pop()!;
    }

    currentHand.push(drawn);
    setWall(newWall);

    setPlayers(prev => {
      const copy = [...prev];
      copy[nextSeat] = {
        ...copy[nextSeat],
        hand: currentHand,
        handCount: currentHand.length,
        flowers: currentFlowers,
      };
      return copy;
    });

    const activePlayer = players[nextSeat];
    setBannerMsg(`轮到 [${activePlayer.name}] 摸牌 (${drawn.nameZh})`);

    // 检查自摸胡
    const zimoCheck = checkCanPlayerWin(
      currentHand,
      activePlayer.melds,
      currentFlowers,
      undefined,
      true,
      activePlayer.wind,
      rules
    );

    if (zimoCheck.canWin && zimoCheck.calcResult) {
      if (nextSeat === mySeatIndex) {
        setBannerMsg('🎉 恭喜！手牌满足自摸起胡，可点击【自摸胡】！');
      } else {
        // AI 自摸胡
        setTimeout(() => {
          handleDeclareWin(nextSeat, 'zimo', undefined, zimoCheck.calcResult!);
        }, 800);
        return;
      }
    }

    // 若是 AI 回合，计划 AI 出牌
    if (activePlayer.isAI) {
      scheduleAITurn(nextSeat, players, newWall);
    }
  };

  // --------------------------------------------------------------------------
  // AI 出牌计划调度
  // --------------------------------------------------------------------------
  const scheduleAITurn = (aiSeat: GameSeatIndex, currentPlayers: GamePlayer[], currentWall: GameTile[]) => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    const delay = gameSpeed === 'fast' ? 350 : 900;

    aiTimerRef.current = setTimeout(() => {
      const p = currentPlayers[aiSeat];
      if (!p || p.hand.length === 0) return;

      // 智能挑一张牌打出
      const tileToDiscard = chooseSmartAIDiscard(p.hand, p.melds);
      handleDiscardTile(aiSeat, tileToDiscard);
    }, delay);
  };

  // --------------------------------------------------------------------------
  // 执行碰牌
  // --------------------------------------------------------------------------
  const executePong = (seat: GameSeatIndex, tile: GameTile) => {
    soundFx.playTileClick();
    setPlayers(prev => {
      const copy = [...prev];
      const p = copy[seat];
      // 从手牌移走 2 张相同的牌
      const remainingHand: GameTile[] = [];
      let removedCount = 0;
      for (const t of p.hand) {
        if (t.id === tile.id && removedCount < 2) {
          removedCount++;
        } else {
          remainingHand.push(t);
        }
      }

      const newMeld: Meld = {
        id: `meld_pong_${Date.now()}`,
        type: 'pong',
        tiles: [tile, tile, tile],
      };

      copy[seat] = {
        ...p,
        hand: remainingHand,
        handCount: remainingHand.length,
        melds: [...p.melds, newMeld],
      };
      return copy;
    });

    setCurrentTurn(seat);
    setClaimPrompt(null);
    setPhase('playing');
    setBannerMsg(`[${players[seat].name}] 碰了 [${tile.nameZh}]！请出牌`);

    // 若是 AI 碰了，继续让 AI 挑一张打出
    if (players[seat].isAI) {
      scheduleAITurn(seat, players, wall);
    }
  };

  // --------------------------------------------------------------------------
  // 执行杠牌
  // --------------------------------------------------------------------------
  const executeKong = (seat: GameSeatIndex, tile: GameTile, type: 'ming' | 'an' | 'bu') => {
    soundFx.playTileClick();
    let newWall = [...wall];
    let replacementTile = newWall.pop();

    setPlayers(prev => {
      const copy = [...prev];
      const p = copy[seat];
      let remainingHand: GameTile[] = [];

      if (type === 'ming') {
        let removed = 0;
        for (const t of p.hand) {
          if (t.id === tile.id && removed < 3) {
            removed++;
          } else {
            remainingHand.push(t);
          }
        }
      } else if (type === 'an') {
        let removed = 0;
        for (const t of p.hand) {
          if (t.id === tile.id && removed < 4) {
            removed++;
          } else {
            remainingHand.push(t);
          }
        }
      }

      if (replacementTile) {
        remainingHand.push(replacementTile);
      }

      const newMeld: Meld = {
        id: `meld_kong_${Date.now()}`,
        type: type === 'an' ? 'kong_concealed' : 'kong_exposed',
        tiles: [tile, tile, tile, tile],
      };

      copy[seat] = {
        ...p,
        hand: remainingHand,
        handCount: remainingHand.length,
        melds: [...p.melds, newMeld],
      };
      return copy;
    });

    setWall(newWall);
    setCurrentTurn(seat);
    setClaimPrompt(null);
    setPhase('playing');
    setBannerMsg(`[${players[seat].name}] 杠了 [${tile.nameZh}]！摸补牌后请出牌`);

    if (players[seat].isAI) {
      scheduleAITurn(seat, players, newWall);
    }
  };

  // --------------------------------------------------------------------------
  // 宣胡结算 (自摸或出冲)
  // --------------------------------------------------------------------------
  const handleDeclareWin = (
    winnerIndex: GameSeatIndex,
    winType: 'zimo' | 'discard',
    shooterIndex?: GameSeatIndex,
    customCalcResult?: CalculationResult
  ) => {
    soundFx.playWin();
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });

    const winner = players[winnerIndex];
    let calc = customCalcResult;

    if (!calc) {
      const conditions: WinningConditions = {
        isZimo: winType === 'zimo',
        isConcealed: winner.melds.length === 0,
        isKongBloom: false,
        isRobbingKong: false,
        isLastTileDraw: false,
        isLastTileDiscard: false,
        playerSeat: winner.wind,
        roundWind: 'east',
        isShooterDouble: true,
      };
      calc = calculateMahjongScore(winner.hand, winner.melds, winner.flowers, conditions, rules);
    }

    const settle: RoundSettlement = {
      winnerIndex,
      winType,
      shooterIndex,
      calcResult: calc,
      timestamp: Date.now(),
    };

    setSettlement(settle);
    setPhase('roundOver');
    setBannerMsg(`🏆 [${winner.name}] ${winType === 'zimo' ? '自摸胡牌' : '胡牌'}！(${calc.totalFan} 番)`);
  };

  // --------------------------------------------------------------------------
  // 荒牌 (流局)
  // --------------------------------------------------------------------------
  const handleDrawGame = () => {
    setPhase('roundOver');
    setBannerMsg('牌墙已摸完，本局流局（荒牌）！');
  };

  // --------------------------------------------------------------------------
  // 记入对局账本
  // --------------------------------------------------------------------------
  const handleRecordToLedger = () => {
    if (!settlement || isRecorded) return;

    const winner = players[settlement.winnerIndex];
    const totalPot = settlement.calcResult.payout.winnerReceivedTotal;
    const payouts: Record<string, number> = {};

    payouts[winner.id] = totalPot;

    if (settlement.winType === 'zimo') {
      players.forEach(p => {
        if (p.id !== winner.id) {
          payouts[p.id] = -settlement.calcResult.payout.eachPayIfZimo;
        }
      });
    } else if (settlement.shooterIndex !== undefined) {
      const shooter = players[settlement.shooterIndex];
      players.forEach(p => {
        if (p.id === shooter.id) {
          payouts[p.id] = -settlement.calcResult.payout.shooterPays;
        } else if (p.id !== winner.id) {
          payouts[p.id] = 0;
        }
      });
    }

    const record: GameRoundRecord = {
      id: `game_${Date.now()}`,
      roundNumber,
      timestamp: Date.now(),
      winnerId: winner.id,
      winType: settlement.winType,
      shooterId: settlement.shooterIndex !== undefined ? players[settlement.shooterIndex].id : undefined,
      fan: settlement.calcResult.totalFan,
      effectiveFan: settlement.calcResult.effectiveFan,
      handPattern: settlement.calcResult.handPatternNameZh,
      payouts,
      totalPot,
      notes: settlement.calcResult.payout.ruleSummary,
    };

    onRecordRoundToLedger(record);
    setIsRecorded(true);
    setBannerMsg('✅ 本局战绩与筹码已成功记入历史账本！');
  };

  // --------------------------------------------------------------------------
  // 下一局 (轮庄)
  // --------------------------------------------------------------------------
  const handleNextRound = () => {
    setRoundNumber(prev => prev + 1);
    // 若庄家没胡，下家当庄
    if (settlement && settlement.winnerIndex !== dealerIndex) {
      setDealerIndex((prev: GameSeatIndex) => ((prev + 1) % 3) as GameSeatIndex);
    }
    startNewGame();
  };

  // --------------------------------------------------------------------------
  // 手牌理牌
  // --------------------------------------------------------------------------
  const handleSortMyHand = () => {
    soundFx.playTileClick();
    setPlayers(prev => {
      const copy = [...prev];
      copy[mySeatIndex] = {
        ...copy[mySeatIndex],
        hand: sortHandTiles(copy[mySeatIndex].hand),
      };
      return copy;
    });
  };

  // 开局初次启动
  useEffect(() => {
    startNewGame();
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, []);

  const me = players[mySeatIndex];
  const isMyTurn = currentTurn === mySeatIndex && phase === 'playing';

  // 检查本机玩家在自己摸牌回合是否可自摸胡
  const myZimoCheck = useMemo(() => {
    if (!isMyTurn || !me || me.hand.length + me.melds.length * 3 < 14) return null;
    return checkCanPlayerWin(me.hand, me.melds, me.flowers, undefined, true, me.wind, rules);
  }, [isMyTurn, me, rules]);

  // 检查本机玩家在自己回合是否可暗杠或补杠
  const mySelfKongCheck = useMemo(() => {
    if (!isMyTurn || !me) return { canKong: false };
    return checkCanPlayerKong(me.hand, me.melds);
  }, [isMyTurn, me]);

  return (
    <div className="flex flex-col space-y-3 sm:space-y-4 max-w-5xl mx-auto w-full">
      {/* 顶部控制与状态栏 */}
      <div className="bg-[#0b331f]/90 border border-emerald-800/80 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-wrap items-center justify-between gap-2.5 backdrop-blur-md">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-black text-sm">
            🀄
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-sm sm:text-base text-amber-200">
                三人麻将第 {roundNumber} 局
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-900 border border-emerald-600 text-emerald-200 font-semibold">
                东风圈 · 庄家: {players[dealerIndex].name}
              </span>
            </div>
            <p className="text-xs text-emerald-300/80 mt-0.5 font-medium flex items-center gap-1.5">
              <span>{bannerMsg}</span>
            </p>
          </div>
        </div>

        {/* 右侧快捷设置 */}
        <div className="flex items-center gap-2">
          {/* 联机房间大厅 */}
          <button
            type="button"
            onClick={() => setIsLobbyOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md transition active:scale-95"
          >
            <Users className="w-3.5 h-3.5" />
            <span>好友开房</span>
          </button>

          {/* 速度切换 */}
          <button
            type="button"
            onClick={() => setGameSpeed(s => (s === 'normal' ? 'fast' : 'normal'))}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700 text-emerald-200 text-xs font-bold flex items-center gap-1 transition"
            title="切换电脑出牌速度"
          >
            <Zap className={`w-3.5 h-3.5 ${gameSpeed === 'fast' ? 'text-amber-400' : 'text-slate-400'}`} />
            <span>{gameSpeed === 'fast' ? '极速' : '普通'}</span>
          </button>

          {/* 重新发牌 / 新局 */}
          <button
            type="button"
            onClick={() => startNewGame()}
            className="p-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700 text-slate-200 transition"
            title="重新洗牌开局"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 绿色麻将毛毡桌台主体 */}
      <div className="relative w-full rounded-3xl bg-gradient-to-b from-[#0b3820] via-[#0e4226] to-[#072415] border-4 border-[#165b35] shadow-2xl p-3 sm:p-5 overflow-hidden flex flex-col justify-between min-h-[580px] sm:min-h-[640px]">
        {/* 桌布细致纹理背景 */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        {/* 顶部对手区域 (电脑 1 与 电脑 2) */}
        <div className="grid grid-cols-2 gap-3 relative z-10">
          {[1, 2].map(seatIdx => {
            const opponent = players[seatIdx as GameSeatIndex];
            const isTurn = currentTurn === seatIdx && phase === 'playing';
            return (
              <div
                key={seatIdx}
                className={`p-2.5 sm:p-3 rounded-2xl border transition-all ${
                  isTurn
                    ? 'bg-emerald-900/60 border-amber-400 shadow-lg ring-2 ring-amber-400/40'
                    : 'bg-emerald-950/50 border-emerald-700/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-800 border border-emerald-600 flex items-center justify-center text-xs">
                      {opponent.isAI ? '🤖' : '👤'}
                    </span>
                    <span className="font-bold text-xs sm:text-sm text-slate-100 truncate max-w-[100px] sm:max-w-[140px]">
                      {opponent.name}
                    </span>
                    {dealerIndex === seatIdx && (
                      <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1 rounded">
                        庄
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-emerald-300/80">
                    {seatIdx === 1 ? '南风' : '西风'}
                  </span>
                </div>

                {/* 对手暗牌展示 (牌背) */}
                <div className="flex flex-wrap gap-0.5 sm:gap-1 mb-2 items-center">
                  {Array.from({ length: opponent.handCount }).map((_, i) => (
                    <MahjongTile key={i} size="xs" isBack />
                  ))}
                </div>

                {/* 对手已吃/碰/杠副露 */}
                {opponent.melds.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1 items-center bg-black/20 p-1 rounded-lg">
                    {opponent.melds.map(meld => (
                      <div key={meld.id} className="flex gap-0.5 border-r border-emerald-700/60 pr-1">
                        {meld.tiles.map((t, idx) => (
                          <MahjongTile key={idx} tile={t} size="xs" />
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* 对手花牌 */}
                {opponent.flowers.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 items-center">
                    <span className="text-[10px] text-amber-300 font-bold mr-1">花:</span>
                    {opponent.flowers.map(f => (
                      <MahjongTile key={f.uid} tile={f} size="xs" />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 牌桌中央：牌墙剩余、指示盘、公共出牌河 */}
        <div className="my-3 sm:my-4 flex flex-col items-center justify-center relative z-10 space-y-3">
          {/* 中央指示盘 */}
          <div className="flex items-center gap-3 bg-[#082b19]/90 border border-amber-500/40 px-4 py-2 rounded-2xl shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-1.5">
              <span className="text-amber-400 font-black text-sm">🀄 牌墙剩余</span>
              <span className="font-mono font-black text-lg text-amber-300">
                {wall.length}
              </span>
              <span className="text-xs text-emerald-400">张</span>
            </div>

            <div className="w-px h-5 bg-emerald-700/70" />

            <div className="text-xs font-bold text-slate-200 flex items-center gap-1">
              <span>当前:</span>
              <span className="text-amber-300">
                {players[currentTurn].name}
              </span>
              {currentTurn === mySeatIndex && (
                <span className="text-[10px] px-1.5 py-0.5 bg-amber-500 text-slate-950 font-black rounded-full animate-bounce">
                  你的回合
                </span>
              )}
            </div>
          </div>

          {/* 三家公共弃牌河 (三条河或者混合池) */}
          <div className="w-full max-w-2xl bg-black/25 border border-emerald-800/60 rounded-2xl p-2.5 sm:p-3 min-h-[90px] max-h-[140px] overflow-y-auto">
            <div className="flex items-center justify-between text-[11px] text-emerald-300/80 mb-1.5 px-1">
              <span>桌面出牌河 (共 {allDiscards.length} 张)</span>
              {lastDiscard && (
                <span className="text-amber-300 font-semibold">
                  刚打出: {lastDiscard.tile.nameZh}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1 sm:gap-1.5 items-center">
              {allDiscards.length === 0 ? (
                <span className="text-xs text-emerald-500/60 py-4 w-full text-center">
                  暂未打出任何牌
                </span>
              ) : (
                allDiscards.map((tile, i) => (
                  <MahjongTile
                    key={i}
                    tile={tile}
                    size="sm"
                    highlight={lastDiscard?.tile.uid === tile.uid}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* 底部玩家 (我) 区域 */}
        <div className="relative z-10 bg-[#092917]/95 border border-emerald-700/80 rounded-3xl p-3 sm:p-4 shadow-2xl backdrop-blur-md space-y-3">
          {/* 玩家信息、副露与花牌区 */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-800/60 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs">
                我
              </span>
              <span className="font-bold text-sm text-slate-100">
                {me.name}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900 text-emerald-200 font-semibold">
                东风
              </span>
              {dealerIndex === mySeatIndex && (
                <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded">
                  庄家
                </span>
              )}
            </div>

            {/* 一键理牌与听牌提示 */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSortMyHand}
                className="px-2.5 py-1 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700 text-xs font-semibold flex items-center gap-1 transition active:scale-95"
              >
                <Layers className="w-3.5 h-3.5 text-amber-300" />
                <span>理牌</span>
              </button>
            </div>
          </div>

          {/* 我的副露 (碰/杠) 与 花牌 */}
          {(me.melds.length > 0 || me.flowers.length > 0) && (
            <div className="flex flex-wrap items-center gap-3 bg-black/20 p-2 rounded-xl">
              {me.melds.length > 0 && (
                <div className="flex items-center gap-1.5 border-r border-emerald-800/80 pr-2">
                  <span className="text-[10px] text-emerald-300 font-bold">副露:</span>
                  {me.melds.map(meld => (
                    <div key={meld.id} className="flex gap-0.5">
                      {meld.tiles.map((t, idx) => (
                        <MahjongTile key={idx} tile={t} size="sm" />
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {me.flowers.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] text-amber-300 font-bold">花牌 ({me.flowers.length}):</span>
                  {me.flowers.map(f => (
                    <MahjongTile key={f.uid} tile={f} size="sm" />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 我的手牌 (可交互点击打出) */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-emerald-300/80 mb-1.5">
              <span>手牌 ({me.hand.length} 张) - 点击可直接打出</span>
              {isMyTurn && (
                <span className="text-amber-300 font-bold animate-pulse">
                  👉 请选择一张牌打出
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1 sm:gap-1.5 items-center justify-center min-h-[60px] p-2 bg-emerald-950/40 rounded-2xl border border-emerald-800/40">
              {me.hand.map(tile => (
                <MahjongTile
                  key={tile.uid}
                  tile={tile}
                  size="md"
                  onClick={() => {
                    if (isMyTurn) {
                      handleDiscardTile(mySeatIndex, tile);
                    }
                  }}
                  disabled={!isMyTurn}
                />
              ))}
            </div>
          </div>

          {/* 实时听牌辅助建议栏 */}
          {myShantenAnalysis && (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-800/70 text-xs text-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400 font-bold">💡 牌效:</span>
                <span>{myShantenAnalysis.statusMessageZh}</span>
              </div>
              {myShantenAnalysis.isTing && myShantenAnalysis.waitingTiles.length > 0 && (
                <div className="flex items-center gap-1 text-[11px] text-amber-300 font-semibold">
                  <span>听牌等待:</span>
                  {myShantenAnalysis.waitingTiles.map((w, idx) => (
                    <span key={idx} className="bg-emerald-900 px-1 py-0.5 rounded border border-emerald-700">
                      {w.tile.nameZh} ({w.remainingCount}张)
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 动态弹出操作栏：吃碰杠胡 (浮动在手牌正上方) */}
        {claimPrompt && (
          <div className="absolute inset-x-4 bottom-28 z-30 flex items-center justify-center animate-bounce">
            <div className="bg-gradient-to-r from-[#0d3420] via-[#114b2d] to-[#0d3420] border-2 border-amber-400 p-3 rounded-2xl shadow-2xl flex items-center gap-3">
              <span className="text-xs text-amber-200 font-bold pl-1">
                对家打出 [{claimPrompt.tile.nameZh}]：
              </span>

              {claimPrompt.actions.includes('win') && (
                <button
                  type="button"
                  onClick={() => {
                    const winCheck = checkCanPlayerWin(
                      me.hand,
                      me.melds,
                      me.flowers,
                      claimPrompt.tile,
                      false,
                      me.wind,
                      rules
                    );
                    handleDeclareWin(mySeatIndex, 'discard', claimPrompt.fromPlayerIndex, winCheck.calcResult);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm shadow-lg transition active:scale-95 animate-pulse"
                >
                  🔥 胡牌！
                </button>
              )}

              {claimPrompt.actions.includes('kong') && (
                <button
                  type="button"
                  onClick={() => executeKong(mySeatIndex, claimPrompt.tile, 'ming')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg transition active:scale-95"
                >
                  ⚡ 杠！
                </button>
              )}

              {claimPrompt.actions.includes('pong') && (
                <button
                  type="button"
                  onClick={() => executePong(mySeatIndex, claimPrompt.tile)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm shadow-lg transition active:scale-95"
                >
                  🟢 碰！
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  advanceToNextTurn((claimPrompt.fromPlayerIndex + 1) % 3 as GameSeatIndex);
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition active:scale-95"
              >
                过
              </button>
            </div>
          </div>
        )}

        {/* 自摸胡与暗杠提示浮动条 */}
        {isMyTurn && (myZimoCheck?.canWin || mySelfKongCheck.canKong) && (
          <div className="absolute inset-x-4 bottom-28 z-30 flex items-center justify-center animate-bounce">
            <div className="bg-gradient-to-r from-[#0d3420] via-[#114b2d] to-[#0d3420] border-2 border-amber-400 p-3 rounded-2xl shadow-2xl flex items-center gap-3">
              {myZimoCheck?.canWin && (
                <button
                  type="button"
                  onClick={() => handleDeclareWin(mySeatIndex, 'zimo', undefined, myZimoCheck.calcResult)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-white font-black text-sm shadow-xl transition active:scale-95"
                >
                  🎉 自摸胡牌！
                </button>
              )}

              {mySelfKongCheck.canKong && mySelfKongCheck.targetTileId && (
                <button
                  type="button"
                  onClick={() => {
                    const tile = me.hand.find(t => t.id === mySelfKongCheck.targetTileId);
                    if (tile) executeKong(mySeatIndex, tile, mySelfKongCheck.type || 'an');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-sm shadow-xl transition active:scale-95"
                >
                  ⚡ 暗杠 / 补杠
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 终局结算弹窗 */}
      {settlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-gradient-to-b from-[#0d3622] to-[#061910] border border-amber-500/60 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
            <div className="p-5 text-center bg-[#072416] border-b border-emerald-800">
              <span className="text-3xl">🏆</span>
              <h3 className="font-extrabold text-xl text-amber-300 mt-1">
                {players[settlement.winnerIndex].name} {settlement.winType === 'zimo' ? '自摸胡牌！' : '出冲胡牌！'}
              </h3>
              <p className="text-xs text-emerald-300/80 mt-0.5">
                牌型：{settlement.calcResult.handPatternNameZh} · 总计 {settlement.calcResult.totalFan} 番
              </p>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* 番种清单 */}
              <div className="space-y-1.5 bg-emerald-950/80 p-3 rounded-2xl border border-emerald-800/60">
                <h4 className="font-bold text-amber-200">番数明细：</h4>
                <div className="space-y-1">
                  {settlement.calcResult.fanItems.map((item, i) => (
                    <div key={i} className="flex justify-between text-slate-300">
                      <span>{item.nameZh}</span>
                      <span className="font-bold text-amber-300">+{item.fan} 番</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 筹码收支总结 */}
              <div className="bg-amber-500/10 border border-amber-500/40 p-3 rounded-2xl space-y-1.5">
                <h4 className="font-bold text-amber-300">本局结算金额：</h4>
                <div className="text-sm font-black text-amber-200 flex justify-between">
                  <span>赢家总收筹码：</span>
                  <span>RM {settlement.calcResult.payout.winnerReceivedTotal.toFixed(2)}</span>
                </div>
                <p className="text-[11px] text-emerald-300/80">
                  {settlement.calcResult.payout.ruleSummary}
                </p>
              </div>

              {/* 按钮群 */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleRecordToLedger}
                  disabled={isRecorded}
                  className="flex-1 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-bold flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                >
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>{isRecorded ? '已记入战绩' : '记入历史账本'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextRound}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black flex items-center justify-center gap-1.5 shadow-lg transition active:scale-95"
                >
                  <span>下一局 (再来一把) →</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 好友联机开房大厅 Modal */}
      <RoomLobbyModal
        isOpen={isLobbyOpen}
        onClose={() => setIsLobbyOpen(false)}
        onStartGame={(mode, roomPlayers) => {
          setGameMode(mode);
          startNewGame(roomPlayers);
        }}
      />
    </div>
  );
};
