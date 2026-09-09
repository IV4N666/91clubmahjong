import React, { useState, useEffect } from 'react';
import {
  Users,
  Copy,
  Check,
  Bot,
  UserCheck,
  Play,
  Share2,
  X,
  Sparkles,
  LogIn,
  PlusCircle,
  ShieldCheck,
} from 'lucide-react';
import { GameSeatIndex } from '../types/game';
import { RuleSettings } from '../types/mahjong';
import { multiplayerService, RoomPeerInfo } from '../utils/multiplayerService';

interface RoomLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: RuleSettings;
  onStartGame: (
    mode: 'solo' | 'multiplayer',
    players: { name: string; isAI: boolean; seat: GameSeatIndex }[],
    activeRules: RuleSettings,
    initialPayload?: any
  ) => void;
  initialRoomCode?: string;
}

export const RoomLobbyModal: React.FC<RoomLobbyModalProps> = ({
  isOpen,
  onClose,
  rules,
  onStartGame,
  initialRoomCode = '',
}) => {
  const [view, setView] = useState<'menu' | 'create' | 'join' | 'inRoom'>('menu');
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('mahjong_user_name') || '雀圣玩家');
  const [roomCode, setRoomCode] = useState(initialRoomCode || '');
  const [isCopied, setIsCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeRules, setActiveRules] = useState<RuleSettings>(rules);

  // 房间内 3 位玩家座位状态
  const [roomPlayers, setRoomPlayers] = useState<RoomPeerInfo[]>([
    { seat: 0, name: playerName, isHost: true, isAI: false, isReady: true },
    { seat: 1, name: '等待好友加入...', isHost: false, isAI: false, isReady: false },
    { seat: 2, name: '电脑 2 (AI)', isHost: false, isAI: true, isReady: true },
  ]);

  // 如果打开时带了房间码，直接切到加入视图
  useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode.toUpperCase());
      setView('join');
    }
  }, [initialRoomCode]);

  // 注册 multiplayerService 监听 (使用事件订阅，避免重渲染覆盖)
  useEffect(() => {
    const unsubRoomUpdate = multiplayerService.on('roomUpdate', (players: RoomPeerInfo[], hostRules?: RuleSettings) => {
      setRoomPlayers([...players]);
      if (hostRules) {
        setActiveRules(hostRules);
      }
    });

    const unsubError = multiplayerService.on('error', (err: string) => {
      setErrorMsg(err);
      setLoading(false);
    });

    return () => {
      unsubRoomUpdate();
      unsubError();
    };
  }, []);

  if (!isOpen) return null;

  // 生成随机 6 位房间码
  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'MJ';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // 创建房间 (使用房主本机的 rules)
  const handleCreateRoom = async () => {
    const code = roomCode.trim() || generateRandomCode();
    setRoomCode(code);
    setLoading(true);
    setErrorMsg('');
    try {
      localStorage.setItem('mahjong_user_name', playerName);
      await multiplayerService.createRoom(code, playerName, rules);
      setRoomPlayers([...multiplayerService.roomPlayers]);
      setActiveRules(rules);
      setView('inRoom');
    } catch (err: any) {
      setErrorMsg(err.message || '创建房间失败');
    } finally {
      setLoading(false);
    }
  };

  // 加入房间
  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      setErrorMsg('请输入 6 位房间号码！');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      localStorage.setItem('mahjong_user_name', playerName);
      await multiplayerService.joinRoom(roomCode.trim(), playerName);
      setRoomPlayers([...multiplayerService.roomPlayers]);
      if (multiplayerService.hostRules) {
        setActiveRules(multiplayerService.hostRules);
      }
      setView('inRoom');
    } catch (err: any) {
      setErrorMsg(err.message || '加入房间失败，请检查房间码');
    } finally {
      setLoading(false);
    }
  };

  // 复制房间分享链接
  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  // 房主切换空座位为电脑AI或等待玩家
  const toggleSeatAI = (seatIdx: GameSeatIndex) => {
    multiplayerService.toggleSeatAI(seatIdx);
  };

  // 房主启动对战 (由 MahjongGameTab 统一生成权威牌墙并广播 GAME_START)
  const handleStartMultiplayer = () => {
    onStartGame('multiplayer', roomPlayers, activeRules);
    onClose();
  };

  // 单机立即开始 (无需网络)
  const handleStartSolo = () => {
    onStartGame(
      'solo',
      [
        { name: `${playerName} (我)`, isAI: false, seat: 0 },
        { name: '电脑 1 (对家)', isAI: true, seat: 1 },
        { name: '电脑 2 (下家)', isAI: true, seat: 2 },
      ],
      rules
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#0e3a24] to-[#071c12] border border-emerald-600/60 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-emerald-800/80 bg-[#092b1a]/90">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-base sm:text-lg text-amber-200 tracking-wide">
              {view === 'menu' && '三人麻将对战大厅'}
              {view === 'create' && '创建联机房间'}
              {view === 'join' && '加入好友房间'}
              {view === 'inRoom' && `房间候战室: ${roomCode}`}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              multiplayerService.disconnect();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-emerald-900/60 hover:bg-emerald-800 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 主内容区域 */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-950/80 border border-red-700/70 text-red-200 text-xs flex items-start gap-2">
              <span className="font-bold">⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. 主菜单选择 */}
          {view === 'menu' && (
            <div className="space-y-3.5 py-1">
              <p className="text-xs text-emerald-300/80 text-center">
                可选择与真实好友联机对战，或直接单机挑战智能电脑 AI！
              </p>

              {/* 昵称输入 */}
              <div className="space-y-1.5 bg-emerald-950/60 p-3 rounded-xl border border-emerald-800/50">
                <label className="text-xs font-semibold text-emerald-200 flex items-center justify-between">
                  <span>我的牌手昵称</span>
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={12}
                  className="w-full bg-[#072416] border border-emerald-700 rounded-lg px-3 py-2 text-sm text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="请输入您的名字"
                />
              </div>

              {/* 选项按钮卡片 */}
              <button
                type="button"
                onClick={() => {
                  setRoomCode(generateRandomCode());
                  setView('create');
                }}
                className="w-full p-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-emerald-700/40 hover:from-amber-500/30 hover:to-emerald-700/60 border border-amber-500/50 flex items-center justify-between group transition active:scale-[0.99] shadow-lg"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-lg shadow-md">
                    <PlusCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-200 group-hover:text-amber-100 text-sm sm:text-base">
                      创建好友房间 (房主)
                    </h3>
                    <p className="text-xs text-emerald-300/80">生成房间码与链接，按房主规则开战</p>
                  </div>
                </div>
                <span className="text-amber-400 text-xs font-bold shrink-0">开房 →</span>
              </button>

              <button
                type="button"
                onClick={() => setView('join')}
                className="w-full p-4 rounded-xl bg-gradient-to-r from-emerald-800/40 to-teal-800/30 hover:from-emerald-800/60 hover:to-teal-800/50 border border-emerald-600/50 flex items-center justify-between group transition active:scale-[0.99] shadow-lg"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-md">
                    <LogIn className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-100 group-hover:text-white text-sm sm:text-base">
                      加入好友房间 (客端)
                    </h3>
                    <p className="text-xs text-emerald-300/80">输入朋友发来的 6 位房间码或点击邀请链接</p>
                  </div>
                </div>
                <span className="text-emerald-300 text-xs font-bold shrink-0">加入 →</span>
              </button>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleStartSolo}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-600 hover:to-emerald-700 text-emerald-100 font-bold text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-95 border border-emerald-600/40"
                >
                  <Bot className="w-4 h-4 text-emerald-300" />
                  <span>单人立即练习（与 2 名电脑对战）</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. 创建房间配置 */}
          {view === 'create' && (
            <div className="space-y-4">
              <div className="space-y-2 bg-emerald-950/70 p-4 rounded-xl border border-emerald-800/60">
                <label className="text-xs font-medium text-emerald-200">房间号码 (6位代号)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    maxLength={8}
                    className="flex-1 bg-[#061e12] border border-emerald-600 rounded-lg px-3 py-2.5 text-center font-mono font-black text-lg text-amber-300 tracking-widest focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    placeholder="如 MJ8888"
                  />
                  <button
                    type="button"
                    onClick={() => setRoomCode(generateRandomCode())}
                    className="px-3 py-2 bg-emerald-800 hover:bg-emerald-700 text-emerald-200 text-xs rounded-lg font-semibold transition"
                  >
                    随机换号
                  </button>
                </div>
                <p className="text-[11px] text-emerald-400/80">
                  创建成功后，好友输入该代码或点击分享链接即可进入，全员统一遵守您的底价与番数设置。
                </p>
              </div>

              {/* 房主规则预览卡片 */}
              <div className="bg-emerald-950/90 border border-emerald-700/60 rounded-xl p-3 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>此房间将同步您设置的规则：</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-emerald-300/80">
                  <div>底价：<span className="text-white font-bold">RM {(rules.basePrice ?? 0.50).toFixed(2)}</span></div>
                  <div>起胡：<span className="text-white font-bold">{rules.minFan} 番起胡</span></div>
                  <div>倍数：<span className="text-white font-bold">{rules.multiplierType === 'linear' ? '1番1底' : '每番翻倍'}</span></div>
                  <div>飞牌：<span className="text-white font-bold">{rules.feiCalculationMode === 'cash' ? `现金 RM ${(rules.feiCashAmount ?? 0.50).toFixed(2)}` : '+1番'}</span></div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setView('menu')}
                  className="w-1/3 py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-slate-300 text-xs font-bold transition"
                >
                  返回
                </button>
                <button
                  type="button"
                  onClick={handleCreateRoom}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-95 disabled:opacity-50"
                >
                  {loading ? '正在开房中...' : '立即创建房间 →'}
                </button>
              </div>
            </div>
          )}

          {/* 3. 输入房间码加入 */}
          {view === 'join' && (
            <div className="space-y-4">
              <div className="space-y-2 bg-emerald-950/70 p-4 rounded-xl border border-emerald-800/60">
                <label className="text-xs font-medium text-emerald-200">请输入好友的房间号</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="w-full bg-[#061e12] border border-emerald-600 rounded-lg px-3 py-3 text-center font-mono font-black text-xl text-amber-300 tracking-widest focus:ring-2 focus:ring-amber-400 focus:outline-none uppercase"
                  placeholder="输入 6 位房间码"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setView('menu')}
                  className="w-1/3 py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-slate-300 text-xs font-bold transition"
                >
                  返回
                </button>
                <button
                  type="button"
                  onClick={handleJoinRoom}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-95 disabled:opacity-50"
                >
                  {loading ? '正在加入...' : '加入房间 →'}
                </button>
              </div>
            </div>
          )}

          {/* 4. 房间候战大厅 */}
          {view === 'inRoom' && (
            <div className="space-y-4">
              {/* 房间码与链接复制栏 */}
              <div className="bg-emerald-950/90 border border-amber-500/40 rounded-xl p-3.5 text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs text-amber-300/80">房间代码：</span>
                  <span className="font-mono font-black text-2xl text-amber-300 tracking-widest">
                    {roomCode}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? '邀请链接已复制！' : '复制房间邀请链接'}</span>
                  </button>
                </div>
              </div>

              {/* 规则生效提示栏 (全员可见) */}
              <div className="bg-emerald-950/80 border border-emerald-700/60 rounded-xl p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-amber-300 font-bold">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>本局规则（已由房主制定）</span>
                  </span>
                  <span className="text-emerald-300 font-black">{activeRules.minFan} 番起胡</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-emerald-300/80">
                  <div>底价：<span className="text-white font-bold">RM {(activeRules.basePrice ?? 0.50).toFixed(2)}</span></div>
                  <div>算番模式：<span className="text-white font-bold">{activeRules.multiplierType === 'linear' ? '1番1底' : '每番翻倍'}</span></div>
                  <div>飞牌结算：<span className="text-white font-bold">{activeRules.feiCalculationMode === 'cash' ? `每张 RM ${(activeRules.feiCashAmount ?? 0.50).toFixed(2)}` : '+1番/张'}</span></div>
                  <div>开杠收钱：<span className="text-white font-bold">{activeRules.enableKongImmediateCash ? `即收 ${activeRules.kongImmediateFan ?? 2}番` : '关闭'}</span></div>
                </div>
              </div>

              {/* 3 个座位卡片 */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-emerald-300 flex items-center justify-between">
                  <span>座位就绪状态 (3人)</span>
                  <span className="text-[11px] text-emerald-400/70">
                    {roomPlayers.filter(p => p.isReady).length} / 3 准备就绪
                  </span>
                </h4>

                {roomPlayers.map((p, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-xl border transition ${
                      p.isReady
                        ? 'bg-emerald-900/40 border-emerald-600/60'
                        : 'bg-emerald-950/40 border-emerald-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-800/80 border border-emerald-600 flex items-center justify-center text-xs font-black text-amber-300">
                        {p.isAI ? '🤖' : idx === 0 ? '👑' : '👤'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs sm:text-sm text-slate-100">
                            {p.name}
                          </span>
                          {idx === multiplayerService.mySeat && (
                            <span className="text-[9px] bg-amber-400/30 text-amber-300 border border-amber-400/50 font-bold px-1.5 py-0.5 rounded">
                              我
                            </span>
                          )}
                          {p.isHost && (
                            <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded">
                              房主
                            </span>
                          )}
                          {!p.isAI && !p.isHost && (
                            <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">
                              好友已进入
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-emerald-400/70">
                          座位 {idx + 1} ({idx === 0 ? '东风' : idx === 1 ? '南风' : '西风'})
                        </span>
                      </div>
                    </div>

                    {/* 切换 AI / 等待 按钮 (仅房主可操作) */}
                    {multiplayerService.isHost && idx !== 0 && (
                      <button
                        type="button"
                        onClick={() => toggleSeatAI(idx as GameSeatIndex)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-800/70 hover:bg-emerald-700 text-emerald-200 border border-emerald-600 transition"
                      >
                        {p.isAI ? '切为等待好友' : '设为电脑AI'}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* 开始游戏按钮 */}
              <div className="pt-2 space-y-2">
                {multiplayerService.isHost ? (
                  <button
                    type="button"
                    onClick={handleStartMultiplayer}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl transition active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>立即开始三人对战！</span>
                  </button>
                ) : (
                  <div className="py-3 px-4 rounded-xl bg-emerald-950/80 border border-emerald-700 text-center text-xs text-amber-300 animate-pulse font-medium">
                    ⏳ 已连接房主，准备完毕，等待房主点击开始...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
