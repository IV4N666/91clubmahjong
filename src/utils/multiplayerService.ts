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

// 包含 Google STUN 与 OpenRelay 免费公用 TURN 中继服务器，确保移动网络 (4G/5G 对等 NAT) 畅连
const PEER_CONFIG = {
  debug: 1,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' },
      {
        urls: [
          'turn:openrelay.metered.ca:80',
          'turn:openrelay.metered.ca:443',
          'turn:openrelay.metered.ca:443?transport=tcp',
        ],
        username: 'openrelay',
        credential: 'openrelay',
      },
    ],
  },
};

export class MultiplayerService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private seatConnections: Map<GameSeatIndex, DataConnection> = new Map();
  private hostConnection: DataConnection | null = null;
  private eventListeners: Map<string, Set<Function>> = new Map();

  public isHost: boolean = false;
  public roomCode: string = '';
  public myPlayerId: string = '';
  public myPlayerName: string = '';
  public mySeat: GameSeatIndex = 0;
  public hostRules: RuleSettings | null = null;
  public roomPlayers: RoomPeerInfo[] = [];

  // 事件回调 (同时支持直接属性赋值与多监听器订阅)
  public onRoomUpdate?: (players: RoomPeerInfo[], rules?: RuleSettings) => void;
  public onGameStart?: (payload: any) => void;
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
   * 事件订阅机制，避免组件重新渲染时覆盖回调
   */
  public on(event: string, fn: Function): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(fn);
    return () => {
      this.eventListeners.get(event)?.delete(fn);
    };
  }

  public emit(event: string, ...args: any[]) {
    this.eventListeners.get(event)?.forEach((fn) => {
      try {
        fn(...args);
      } catch (err) {
        console.error(`[MultiplayerService] Error in event listener for ${event}:`, err);
      }
    });
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
      { seat: 1, name: '等待好友加入...', isHost: false, isAI: false, isReady: false },
      { seat: 2, name: '电脑 2 (AI)', isHost: false, isAI: true, isReady: true },
    ];

    const hostPeerId = this.formatHostPeerId(this.roomCode);

    return new Promise((resolve, reject) => {
      let isResolved = false;
      try {
        if (this.peer) {
          this.peer.destroy();
          this.peer = null;
        }

        this.peer = new Peer(hostPeerId, PEER_CONFIG);

        // 立即挂载客端接入监听
        this.peer.on('connection', (conn) => {
          this.handleIncomingClientConnection(conn);
        });

        this.peer.on('open', (id) => {
          if (!isResolved) {
            isResolved = true;
            this.emit('roomUpdate', [...this.roomPlayers], this.hostRules || undefined);
            this.onRoomUpdate?.([...this.roomPlayers], this.hostRules || undefined);
            resolve(id);
          }
        });

        this.peer.on('error', (err: any) => {
          if (!isResolved) {
            isResolved = true;
            if (err.type === 'unavailable-id') {
              reject(new Error(`房间号 ${this.roomCode} 正在被使用或刚关闭，请更换一个房间号码！`));
            } else {
              reject(new Error(`P2P网络错误 (${err.type || 'network'}): ${err.message}`));
            }
          } else {
            this.emit('error', `网络提示: ${err.message}`);
            this.onError?.(`网络提示: ${err.message}`);
          }
        });
      } catch (err: any) {
        if (!isResolved) {
          isResolved = true;
          reject(err);
        }
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

    const guestPeerId = `${this.formatHostPeerId(this.roomCode)}-g-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const hostPeerId = this.formatHostPeerId(this.roomCode);

    return new Promise((resolve, reject) => {
      let isResolved = false;
      const timeoutTimer = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          this.disconnect();
          reject(new Error('连接房间超时，请确认房主已创建房间并处于候战大厅！'));
        }
      }, 12000);

      try {
        if (this.peer) {
          this.peer.destroy();
          this.peer = null;
        }

        this.peer = new Peer(guestPeerId, PEER_CONFIG);

        this.peer.on('open', () => {
          const conn = this.peer!.connect(hostPeerId, {
            reliable: true,
          });

          this.hostConnection = conn;

          conn.on('open', () => {
            // 发送加入请求给房主
            const joinMsg: NetworkMessage = {
              type: 'JOIN_REQUEST',
              senderId: this.myPlayerId,
              payload: { name: this.myPlayerName },
            };
            conn.send(joinMsg);
          });

          conn.on('data', (data: unknown) => {
            const msg = data as NetworkMessage;
            if (msg.type === 'ROOM_SYNC') {
              if (msg.payload?.error) {
                if (!isResolved) {
                  isResolved = true;
                  clearTimeout(timeoutTimer);
                  reject(new Error(msg.payload.error));
                }
                return;
              }
              if (msg.payload?.mySeat !== undefined && !isResolved) {
                isResolved = true;
                clearTimeout(timeoutTimer);
                this.mySeat = msg.payload.mySeat;
                if (msg.payload.hostRules) {
                  this.hostRules = msg.payload.hostRules;
                }
                if (msg.payload.players) {
                  this.roomPlayers = [...msg.payload.players];
                }
                this.emit('roomUpdate', [...this.roomPlayers], this.hostRules || undefined);
                this.onRoomUpdate?.([...this.roomPlayers], this.hostRules || undefined);
                this.emit('connected');
                this.onConnected?.();
                resolve();
                return;
              }
            }
            this.handleReceivedMessage(msg);
          });

          conn.on('error', (err) => {
            if (!isResolved) {
              isResolved = true;
              clearTimeout(timeoutTimer);
              reject(new Error(`连接房主失败: ${err.message}`));
            }
          });

          conn.on('close', () => {
            this.emit('error', '与房主的连接已断开');
            this.onError?.('与房主的连接已断开');
          });
        });

        this.peer.on('error', (err: any) => {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeoutTimer);
            if (err.type === 'peer-unavailable') {
              reject(new Error(`未找到房间 ${this.roomCode}，请确认房主已创建房间且代码无误！`));
            } else {
              reject(new Error(`加入房间失败 (${err.type || 'network'}): ${err.message}`));
            }
          } else {
            this.emit('error', `网络提示: ${err.message}`);
            this.onError?.(`网络提示: ${err.message}`);
          }
        });
      } catch (err: any) {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutTimer);
          reject(err);
        }
      }
    });
  }

  /**
   * 房主处理新的客端连接与消息
   */
  private handleIncomingClientConnection(conn: DataConnection) {
    this.connections.set(conn.peer, conn);

    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
    });

    conn.on('data', (data: unknown) => {
      const msg = data as NetworkMessage;
      this.handleReceivedMessage(msg, conn);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      // 找出关闭的座位并恢复为 AI
      let changed = false;
      for (const [seat, seatConn] of this.seatConnections.entries()) {
        if (seatConn.peer === conn.peer) {
          this.seatConnections.delete(seat);
          this.roomPlayers = [...this.roomPlayers];
          this.roomPlayers[seat] = {
            seat,
            name: `电脑 ${seat} (AI)`,
            isHost: false,
            isAI: true,
            isReady: true,
          };
          changed = true;
          break;
        }
      }
      if (changed) {
        this.broadcastRoomSync();
        this.emit('roomUpdate', [...this.roomPlayers], this.hostRules || undefined);
        this.onRoomUpdate?.([...this.roomPlayers], this.hostRules || undefined);
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
          // 清理可能存在的旧连接
          for (const [s, c] of this.seatConnections.entries()) {
            if (c.peer === sourceConn.peer) {
              this.seatConnections.delete(s);
            }
          }

          // 房主分配座位：优先选空位 (座位 1 或 座位 2)
          let assignedSeat: GameSeatIndex | null = null;
          if (!this.seatConnections.has(1)) {
            assignedSeat = 1;
          } else if (!this.seatConnections.has(2)) {
            assignedSeat = 2;
          }

          if (assignedSeat !== null) {
            this.seatConnections.set(assignedSeat, sourceConn);
            this.connections.set(sourceConn.peer, sourceConn);

            this.roomPlayers = [...this.roomPlayers];
            this.roomPlayers[assignedSeat] = {
              seat: assignedSeat,
              name: msg.payload?.name || `好友 ${assignedSeat + 1}`,
              isHost: false,
              isAI: false,
              isReady: true,
            };

            // 1. 回发给新加入的客端（带上分配的座位与房主规则）
            sourceConn.send({
              type: 'ROOM_SYNC',
              senderId: this.myPlayerId,
              payload: {
                mySeat: assignedSeat,
                players: [...this.roomPlayers],
                hostRules: this.hostRules,
                roomCode: this.roomCode,
              },
            });

            // 2. 广播给所有客端同步全员座位
            this.broadcastRoomSync();

            // 3. 触发房主本地状态更新 (确保新数组引用触发 React 渲染)
            this.emit('roomUpdate', [...this.roomPlayers], this.hostRules || undefined);
            this.onRoomUpdate?.([...this.roomPlayers], this.hostRules || undefined);
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
          this.emit('error', msg.payload.error);
          if (!this.eventListeners.get('error')?.size) {
            this.onError?.(msg.payload.error);
          }
          return;
        }
        if (msg.payload?.mySeat !== undefined) {
          this.mySeat = msg.payload.mySeat;
        }
        if (msg.payload?.hostRules) {
          this.hostRules = msg.payload.hostRules;
        }
        if (msg.payload?.players) {
          this.roomPlayers = [...msg.payload.players];
          this.emit('roomUpdate', [...this.roomPlayers], this.hostRules || undefined);
          if (!this.eventListeners.get('roomUpdate')?.size) {
            this.onRoomUpdate?.([...this.roomPlayers], this.hostRules || undefined);
          }
        }
        break;

      case 'GAME_START':
        if (msg.payload?.rules) {
          this.hostRules = msg.payload.rules;
        }
        if (msg.payload?.assignedSeat !== undefined) {
          this.mySeat = msg.payload.assignedSeat;
        }
        // 客端向房主回复 ACK 确认已成功收到权威开局发牌包
        this.sendToHost('GAME_START_ACK', { seat: this.mySeat });
        this.emit('gameStart', msg.payload);
        if (!this.eventListeners.get('gameStart')?.size) {
          this.onGameStart?.(msg.payload);
        }
        break;

      case 'GAME_START_ACK':
        if (this.isHost) {
          console.log(`[MultiplayerService] 房主已确认收到来自座位 ${msg.senderSeat ?? msg.payload?.seat} 的开局同步确认`);
        }
        break;

      case 'GAME_STATE_SYNC':
        this.emit('gameStateSync', msg.payload);
        if (!this.eventListeners.get('gameStateSync')?.size) {
          this.onGameStateSync?.(msg.payload);
        }
        break;

      case 'PLAYER_DISCARD':
      case 'PLAYER_CLAIM':
        if (this.isHost) {
          const action = {
            seat: msg.senderSeat ?? 0,
            actionType: msg.type,
            payload: msg.payload,
          };
          this.emit('playerAction', action);
          if (!this.eventListeners.get('playerAction')?.size) {
            this.onPlayerAction?.(action);
          }
        }
        break;

      case 'ROUND_OVER_SYNC':
        this.emit('roundOver', msg.payload);
        if (!this.eventListeners.get('roundOver')?.size) {
          this.onRoundOver?.(msg.payload);
        }
        break;

      case 'CHAT_MESSAGE':
        this.emit('chatMessage', msg.payload);
        if (!this.eventListeners.get('chatMessage')?.size) {
          this.onChatMessage?.(msg.payload);
        }
        break;
    }
  }

  /**
   * 房主广播房间座位与规则 (针对不同座位的客端精准携带专属 mySeat)
   */
  public broadcastRoomSync() {
    // 1. 点对点向每个有特定座位的客端发送带专属 mySeat 的 ROOM_SYNC
    this.seatConnections.forEach((conn, seat) => {
      if (conn.open) {
        conn.send({
          type: 'ROOM_SYNC',
          senderId: this.myPlayerId,
          payload: {
            mySeat: seat,
            players: [...this.roomPlayers],
            hostRules: this.hostRules,
            roomCode: this.roomCode,
          },
        });
      }
    });

    // 2. 向未分配座位的其他通用连接广播
    this.connections.forEach((conn) => {
      let isSeatConn = false;
      for (const sConn of this.seatConnections.values()) {
        if (sConn.peer === conn.peer) {
          isSeatConn = true;
          break;
        }
      }
      if (!isSeatConn && conn.open) {
        conn.send({
          type: 'ROOM_SYNC',
          senderId: this.myPlayerId,
          payload: {
            players: [...this.roomPlayers],
            hostRules: this.hostRules,
            roomCode: this.roomCode,
          },
        });
      }
    });
  }

  /**
   * 房主切换某座位的 AI / 等待状态
   */
  public toggleSeatAI(seat: GameSeatIndex) {
    if (!this.isHost || seat === 0) return;
    const current = this.roomPlayers[seat];
    const nextIsAI = !current.isAI;
    this.roomPlayers = [...this.roomPlayers];
    this.roomPlayers[seat] = {
      ...current,
      isAI: nextIsAI,
      name: nextIsAI ? `电脑 ${seat} (AI)` : '等待好友加入...',
      isReady: nextIsAI,
    };
    this.broadcastRoomSync();
    this.emit('roomUpdate', [...this.roomPlayers], this.hostRules || undefined);
    if (!this.eventListeners.get('roomUpdate')?.size) {
      this.onRoomUpdate?.([...this.roomPlayers], this.hostRules || undefined);
    }
  }

  /**
   * 房主发送开始游戏 (针对每个客端精准指定其所属座位 assignedSeat，杜绝视角错位与独立洗牌)
   */
  public startGame(initialState?: any) {
    if (!this.isHost) return;
    const basePayload = initialState || {
      players: [...this.roomPlayers],
      rules: this.hostRules!,
    };

    // 1. 点对点向每个真实客端连接下发开局权威发牌，并锁定指定客端席位
    this.seatConnections.forEach((conn, seat) => {
      if (conn.open) {
        conn.send({
          type: 'GAME_START',
          senderId: this.myPlayerId,
          senderSeat: this.mySeat,
          payload: {
            ...basePayload,
            assignedSeat: seat,
          },
        });
      }
    });

    // 2. 对其他可能存在的连接广播兜底
    this.connections.forEach((conn) => {
      let alreadySent = false;
      for (const sConn of this.seatConnections.values()) {
        if (sConn.peer === conn.peer) {
          alreadySent = true;
          break;
        }
      }
      if (!alreadySent && conn.open) {
        conn.send({
          type: 'GAME_START',
          senderId: this.myPlayerId,
          senderSeat: this.mySeat,
          payload: basePayload,
        });
      }
    });
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
