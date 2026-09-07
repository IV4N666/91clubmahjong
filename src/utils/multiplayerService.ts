import { Peer, DataConnection } from 'peerjs';
import { GameSeatIndex, NetworkMessage } from '../types/game';
import { RuleSettings } from '../types/mahjong';

export interface RoomPeerInfo {
  seat: GameSeatIndex;
  name: string;
  isHost: boolean;
  isAI: boolean;
  isReady: boolean;
}

const PEER_CONFIG = {
  debug: 1,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' },
    ],
  },
};

export class MultiplayerService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private seatConnections: Map<GameSeatIndex, DataConnection> = new Map();
  private hostConnection: DataConnection | null = null;

  public isHost: boolean = false;
  public roomCode: string = '';
  public myPlayerId: string = '';
  public myPlayerName: string = '';
  public mySeat: GameSeatIndex = 0;
  public hostRules: RuleSettings | null = null;
  public roomPlayers: RoomPeerInfo[] = [];

  // 事件回调
  public onRoomUpdate?: (players: RoomPeerInfo[], rules?: RuleSettings) => void;
  public onGameStart?: (payload: { players: RoomPeerInfo[]; rules: RuleSettings }) => void;
  public onGameStateSync?: (payload: any) => void;
  public onPlayerAction?: (action: { seat: GameSeatIndex; actionType: string; payload?: any }) => void;
  public onRoundOver?: (settlement: any) => void;
  public onChatMessage?: (chat: { senderName: string; text: string }) => void;
  public onError?: (errMsg: string) => void;
  public onConnected?: () => void;

  constructor() {
    this.myPlayerId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  }

  /**
   * 生成规范化的 Peer ID，避免特殊字符导致 PeerJS 报错
   */
  private formatHostPeerId(code: string): string {
    const clean = code.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `91mj-${clean}`;
  }

  /**
   * 房主创建房间
   */
  public async createRoom(roomCode: string, hostName: string, rules: RuleSettings): Promise<string> {
    this.roomCode = roomCode.toUpperCase().trim();
    this.myPlayerName = hostName;
    this.isHost = true;
    this.mySeat = 0;
    this.hostRules = rules;

    this.roomPlayers = [
      { seat: 0, name: `${hostName} (房主)`, isHost: true, isAI: false, isReady: true },
      { seat: 1, name: '等待好友加入...', isHost: false, isAI: true, isReady: false },
      { seat: 2, name: '等待好友加入...', isHost: false, isAI: true, isReady: false },
    ];

    const hostPeerId = this.formatHostPeerId(this.roomCode);

    return new Promise((resolve, reject) => {
      try {
        if (this.peer) {
          this.peer.destroy();
        }

        this.peer = new Peer(hostPeerId, PEER_CONFIG);

        this.peer.on('open', (id) => {
          // 监听客端玩家连接
          this.peer?.on('connection', (conn) => {
            this.handleIncomingClientConnection(conn);
          });
          resolve(id);
        });

        this.peer.on('error', (err) => {
          if (err.type === 'unavailable-id') {
            reject(new Error(`房间号 ${this.roomCode} 正在被使用中，请更换一个号码！`));
          } else {
            reject(new Error(`P2P网络错误: ${err.message}`));
          }
        });
      } catch (err: any) {
        reject(err);
      }
    });
  }

  /**
   * 客端玩家加入房间
   */
  public async joinRoom(roomCode: string, playerName: string): Promise<void> {
    this.roomCode = roomCode.toUpperCase().trim();
    this.myPlayerName = playerName;
    this.isHost = false;

    const guestPeerId = `${this.formatHostPeerId(this.roomCode)}-g-${Date.now().toString(36)}`;
    const hostPeerId = this.formatHostPeerId(this.roomCode);

    return new Promise((resolve, reject) => {
      try {
        if (this.peer) {
          this.peer.destroy();
        }

        this.peer = new Peer(guestPeerId, PEER_CONFIG);

        this.peer.on('open', () => {
          const conn = this.peer!.connect(hostPeerId, {
            reliable: true,
          });

          this.hostConnection = conn;

          conn.on('open', () => {
            this.onConnected?.();
            // 发送加入请求给房主
            const joinMsg: NetworkMessage = {
              type: 'JOIN_REQUEST',
              senderId: this.myPlayerId,
              payload: { name: this.myPlayerName },
            };
            conn.send(joinMsg);
            resolve();
          });

          conn.on('data', (data: unknown) => {
            this.handleReceivedMessage(data as NetworkMessage);
          });

          conn.on('error', (err) => {
            this.onError?.('连接房主失败，请确认房间码并检查房主是否已开好房间！');
            reject(err);
          });

          conn.on('close', () => {
            this.onError?.('与房主的连接已断开');
          });
        });

        this.peer.on('error', (err) => {
          this.onError?.(`加入房间失败: ${err.message}`);
          reject(err);
        });
      } catch (err: any) {
        reject(err);
      }
    });
  }

  /**
   * 房主处理新的客端连接与消息
   */
  private handleIncomingClientConnection(conn: DataConnection) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
    });

    conn.on('data', (data: unknown) => {
      const msg = data as NetworkMessage;
      this.handleReceivedMessage(msg, conn);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      // 找出关闭的座位并恢复为 AI / 等待状态
      for (const [seat, seatConn] of this.seatConnections.entries()) {
        if (seatConn.peer === conn.peer) {
          this.seatConnections.delete(seat);
          this.roomPlayers[seat] = {
            seat,
            name: `电脑 ${seat} (AI)`,
            isHost: false,
            isAI: true,
            isReady: true,
          };
          this.broadcastRoomSync();
          this.onRoomUpdate?.(this.roomPlayers, this.hostRules || undefined);
          break;
        }
      }
    });
  }

  /**
   * 统一消息接收与分发
   */
  private handleReceivedMessage(msg: NetworkMessage, sourceConn?: DataConnection) {
    switch (msg.type) {
      case 'JOIN_REQUEST':
        if (this.isHost && sourceConn) {
          // 房主分配座位：优先选空位 (座位 1 或 座位 2)
          let assignedSeat: GameSeatIndex | null = null;
          if (!this.seatConnections.has(1)) {
            assignedSeat = 1;
          } else if (!this.seatConnections.has(2)) {
            assignedSeat = 2;
          }

          if (assignedSeat !== null) {
            this.seatConnections.set(assignedSeat, sourceConn);
            this.roomPlayers[assignedSeat] = {
              seat: assignedSeat,
              name: msg.payload?.name || `好友 ${assignedSeat + 1}`,
              isHost: false,
              isAI: false,
              isReady: true,
            };

            // 1. 先直接回发给新加入的客端（带上分配的座位与房主规则）
            sourceConn.send({
              type: 'ROOM_SYNC',
              senderId: this.myPlayerId,
              payload: {
                mySeat: assignedSeat,
                players: this.roomPlayers,
                hostRules: this.hostRules,
                roomCode: this.roomCode,
              },
            });

            // 2. 广播给所有客端同步全员座位
            this.broadcastRoomSync();

            // 3. 触发房主本地状态更新
            this.onRoomUpdate?.(this.roomPlayers, this.hostRules || undefined);
          } else {
            // 房间已满
            sourceConn.send({
              type: 'ROOM_SYNC',
              senderId: this.myPlayerId,
              payload: {
                error: '房间座位已满（三人麻将限3人）！',
              },
            });
          }
        }
        break;

      case 'ROOM_SYNC':
        // 客端收到同步
        if (msg.payload?.error) {
          this.onError?.(msg.payload.error);
          return;
        }
        if (msg.payload?.mySeat !== undefined) {
          this.mySeat = msg.payload.mySeat;
        }
        if (msg.payload?.hostRules) {
          this.hostRules = msg.payload.hostRules;
        }
        if (msg.payload?.players) {
          this.roomPlayers = msg.payload.players;
          this.onRoomUpdate?.(this.roomPlayers, this.hostRules || undefined);
        }
        break;

      case 'GAME_START':
        if (msg.payload?.rules) {
          this.hostRules = msg.payload.rules;
        }
        this.onGameStart?.(msg.payload);
        break;

      case 'GAME_STATE_SYNC':
        this.onGameStateSync?.(msg.payload);
        break;

      case 'PLAYER_DISCARD':
      case 'PLAYER_CLAIM':
        if (this.isHost) {
          this.onPlayerAction?.({
            seat: msg.senderSeat ?? 0,
            actionType: msg.type,
            payload: msg.payload,
          });
        }
        break;

      case 'ROUND_OVER_SYNC':
        this.onRoundOver?.(msg.payload);
        break;

      case 'CHAT_MESSAGE':
        this.onChatMessage?.(msg.payload);
        break;
    }
  }

  /**
   * 房主广播房间座位与规则
   */
  public broadcastRoomSync() {
    this.broadcast('ROOM_SYNC', {
      players: this.roomPlayers,
      hostRules: this.hostRules,
      roomCode: this.roomCode,
    });
  }

  /**
   * 房主切换某座位的 AI / 等待状态
   */
  public toggleSeatAI(seat: GameSeatIndex) {
    if (!this.isHost || seat === 0) return;
    const current = this.roomPlayers[seat];
    const nextIsAI = !current.isAI;
    this.roomPlayers[seat] = {
      ...current,
      isAI: nextIsAI,
      name: nextIsAI ? `电脑 ${seat} (AI)` : '等待好友加入...',
      isReady: nextIsAI,
    };
    this.broadcastRoomSync();
    this.onRoomUpdate?.(this.roomPlayers, this.hostRules || undefined);
  }

  /**
   * 房主发送开始游戏
   */
  public startGame() {
    if (!this.isHost) return;
    const payload = {
      players: this.roomPlayers,
      rules: this.hostRules!,
    };
    this.broadcast('GAME_START', payload);
    this.onGameStart?.(payload);
  }

  /**
   * 客端向房主发送消息
   */
  public sendToHost(type: NetworkMessage['type'], payload?: any) {
    if (this.hostConnection && this.hostConnection.open) {
      const msg: NetworkMessage = {
        type,
        senderId: this.myPlayerId,
        senderSeat: this.mySeat,
        payload,
      };
      this.hostConnection.send(msg);
    }
  }

  /**
   * 房主向所有客端广播消息
   */
  public broadcast(type: NetworkMessage['type'], payload?: any) {
    const msg: NetworkMessage = {
      type,
      senderId: this.myPlayerId,
      senderSeat: this.mySeat,
      payload,
    };
    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(msg);
      }
    });
  }

  /**
   * 断开连接
   */
  public disconnect() {
    this.connections.forEach((conn) => conn.close());
    this.connections.clear();
    this.seatConnections.clear();
    if (this.hostConnection) {
      this.hostConnection.close();
      this.hostConnection = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }
}

export const multiplayerService = new MultiplayerService();
