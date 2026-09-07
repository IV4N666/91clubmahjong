import { MahjongTileData, Meld, CalculationResult, RuleSettings } from './mahjong';

export interface GameTile extends MahjongTileData {
  uid: string; // 每张物理牌的唯一实体编号，例如 'tong_1_0', 'tong_1_1'
}

export type GameSeatIndex = 0 | 1 | 2;

export interface GamePlayer {
  id: string;
  name: string;
  isAI: boolean;
  isHost: boolean;
  seat: GameSeatIndex;
  wind: 'east' | 'south' | 'west';
  hand: GameTile[]; // 本机玩家或 Host 拥有完整手牌；客端对手暗牌依据 handCount 渲染牌背
  handCount: number;
  melds: Meld[];
  flowers: GameTile[];
  discards: GameTile[];
  isReady?: boolean;
  isOnline?: boolean;
}

export type ClaimActionType = 'pong' | 'kong' | 'win' | 'pass';

export interface PendingClaimPrompt {
  actions: ('pong' | 'kong' | 'win')[];
  tile: GameTile;
  fromPlayerIndex: GameSeatIndex;
}

export interface RoundSettlement {
  winnerIndex: GameSeatIndex;
  winType: 'zimo' | 'discard';
  shooterIndex?: GameSeatIndex;
  calcResult: CalculationResult;
  timestamp: number;
}

export interface GameState {
  roomId: string;
  isMultiplayer: boolean;
  mySeatIndex: GameSeatIndex;
  dealerIndex: GameSeatIndex;
  currentTurn: GameSeatIndex;
  phase: 'waiting' | 'dealing' | 'flowerReplacing' | 'playing' | 'claimWindow' | 'roundOver';
  wallCount: number;
  lastDiscard?: {
    playerIndex: GameSeatIndex;
    tile: GameTile;
  };
  currentDrawnTile?: GameTile; // 当前摸到的单张牌
  players: GamePlayer[];
  pendingClaimPrompt?: PendingClaimPrompt | null;
  settlement?: RoundSettlement | null;
  messageBanner?: string;
}

// 联机消息协议定义
export type NetworkMessageType =
  | 'JOIN_REQUEST'
  | 'ROOM_SYNC'
  | 'GAME_START'
  | 'PLAYER_DISCARD'
  | 'PLAYER_CLAIM'
  | 'GAME_STATE_SYNC'
  | 'ROUND_OVER_SYNC'
  | 'CHAT_MESSAGE';

export interface NetworkMessage {
  type: NetworkMessageType;
  senderId: string;
  senderSeat?: GameSeatIndex;
  payload?: any;
}
