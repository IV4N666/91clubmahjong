import { Peer, DataConnection } from 'peerjs';
import { GameSeatIndex, NetworkMessage } from '../types/game';

export interface RoomPeerInfo {
  seat: GameSeatIndex;
  name: string;
  isHost: boolean;
  isAI: boolean;
  isReady: boolean;
}

export class MultiplayerService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private hostConnection: DataConnection | null = null;
  public isHost: boolean = false;
  public roomCode: string = '';
  public myPlayerId: string = '';
  public myPlayerName: string = '';
  public mySeat: GameSeatIndex = 0;

  // 事件订阅回调
  public onRoomUpdate?: (players: RoomPeerInfo[]) => void;
  public onGameStart?: (data: any) => void;
  public onGameStateSync?: (data: any) => void;
  public onPlayerAction?: (action: { seat: GameSeatIndex; actionType: string; payload?: any }) => void;
  public onRoundOver?: (settlement: any) => void;
  public onChatMessage?: (chat: { senderName: string; text: string }) => void;
  public onError?: (errMsg: string) => void;
  public onConnected?: () => void;

  constructor() {
    this.myPlayerId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  }

  /**
   * 房主创建房间
   */
  public async createRoom(roomCode: string, hostName: string): Promise<string> {
    this.roomCode = roomCode.toUpperCase().trim();
    this.myPlayerName = hostName;
    this.isHost = true;
    this.mySeat = 0;

    const hostPeerId = `91mj-${this.roomCode.toLowerCase()}`;

    return new Promise((resolve, reject) => {
      try {
        if (this.peer) {
          this.peer.destroy();
        }

        this.peer = new Peer(hostPeerId, {
          debug: 1,
        });

        this.peer.on('open', (id) => {
          // 监听客端玩家连接
          this.peer?.on('connection', (conn) => {
            this.handleIncomingClientConnection(conn);
          });
          resolve(id);
        });

        this.peer.on('error', (err) => {
          if (err.type === 'unavailable-id') {
            reject(new Error(`房间号 ${this.roomCode} 已被占用，请更换一个房间号！`));
          } else {
            reject(err);
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

    const guestPeerId = `91mj-${this.roomCode.toLowerCase()}-g-${Date.now().toString(36)}`;
    const hostPeerId = `91mj-${this.roomCode.toLowerCase()}`;

    return new Promise((resolve, reject) => {
      try {
        if (this.peer) {
          this.peer.destroy();
        }

        this.peer = new Peer(guestPeerId, {
          debug: 1,
        });

        this.peer.on('open', () => {
          const conn = this.peer!.connect(hostPeerId, {
            reliable: true,
          });

          this.hostConnection = conn;

          conn.on('open', () => {
            this.onConnected?.();
            // 发送加入请求
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
            this.onError?.('连接房主失败，请检查房间号是否正确！');
            reject(err);
          });

          conn.on('close', () => {
            this.onError?.('与房主的连接已断开');
          });
        });

        this.peer.on('error', (err) => {
          this.onError?.(`网络错误: ${err.message}`);
          reject(err);
        });
      } catch (err: any) {
        reject(err);
      }
    });
  }

  /**
   * 房主处理新的客端连接
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
    });
  }

  /**
   * 处理接收到的所有协议消息
   */
  private handleReceivedMessage(msg: NetworkMessage, sourceConn?: DataConnection) {
    switch (msg.type) {
      case 'JOIN_REQUEST':
        if (this.isHost && sourceConn) {
          // 房主分配座位并同步
          this.onPlayerAction?.({
            seat: 0,
            actionType: 'CLIENT_JOIN',
            payload: { peerId: sourceConn.peer, name: msg.payload?.name, playerId: msg.senderId },
          });
        }
        break;

      case 'ROOM_SYNC':
        // 客端收到房间座位同步
        if (msg.payload?.mySeat !== undefined) {
          this.mySeat = msg.payload.mySeat;
        }
        if (msg.payload?.players) {
          this.onRoomUpdate?.(msg.payload.players);
        }
        break;

      case 'GAME_START':
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
   * 发送给房主 (客端调用)
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
   * 广播给所有客端 (房主调用)
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
   * 断开并销毁
   */
  public disconnect() {
    this.connections.forEach((conn) => conn.close());
    this.connections.clear();
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
