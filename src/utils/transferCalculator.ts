import { Player, GameRoundRecord, TransferInstruction } from '../types/mahjong';

export interface SettlementSummary {
  playerBalances: { player: Player; balance: number }[];
  transfers: TransferInstruction[];
  totalRounds: number;
  totalPotPlayed: number;
  formattedShareText: string;
}

/**
 * 规范化单局战绩记录（自动兼容历史遗留的 p0 ID 或座位索引错位数据，实现自动修复自愈）
 */
export function normalizeRoundRecord(
  round: GameRoundRecord,
  players: Player[]
): GameRoundRecord {
  const p1Id = players[0]?.id || 'p1';
  const p2Id = players[1]?.id || 'p2';
  const p3Id = players[2]?.id || 'p3';

  // 检测是否存在旧版 MahjongGameTab 的 p0 编号体系 (p0 对应 Seat 0 / 玩家 1，p1 对应 Seat 1 / 玩家 2，p2 对应 Seat 2 / 玩家 3)
  const hasLegacyP0 =
    round.winnerId === 'p0' ||
    round.shooterId === 'p0' ||
    round.payouts['p0'] !== undefined;

  let winnerId = round.winnerId;
  let shooterId = round.shooterId;
  const normalizedPayouts: Record<string, number> = {};

  if (hasLegacyP0) {
    const legacySeatMap: Record<string, string> = {
      p0: p1Id,
      p1: p2Id,
      p2: p3Id,
    };

    winnerId = legacySeatMap[round.winnerId] || round.winnerId;
    if (round.shooterId) {
      shooterId = legacySeatMap[round.shooterId] || round.shooterId;
    }

    for (const [key, amount] of Object.entries(round.payouts)) {
      const targetId = legacySeatMap[key] || key;
      normalizedPayouts[targetId] = (normalizedPayouts[targetId] || 0) + amount;
    }
  } else {
    for (const [key, amount] of Object.entries(round.payouts)) {
      normalizedPayouts[key] = amount;
    }
  }

  // 确保 winnerId 若异常则回退到首位玩家
  if (!players.some(p => p.id === winnerId)) {
    winnerId = p1Id;
  }

  return {
    ...round,
    winnerId,
    shooterId,
    payouts: normalizedPayouts,
  };
}

/**
 * 结算牌局战绩，计算最简化转账方案 (支持 DuitNow / TNG 快速平账)
 */
export function calculateSessionSettlement(
  players: Player[],
  rounds: GameRoundRecord[]
): SettlementSummary {
  // 1. 初始化每位玩家净余额
  const balanceMap: Record<string, number> = {};
  players.forEach(p => {
    balanceMap[p.id] = 0;
  });

  let totalPotPlayed = 0;

  // 2. 累加每一局每位玩家收支 (自动执行数据规范化)
  rounds.forEach(rawRound => {
    const round = normalizeRoundRecord(rawRound, players);
    totalPotPlayed += round.totalPot;
    for (const [playerId, amount] of Object.entries(round.payouts)) {
      if (balanceMap[playerId] !== undefined) {
        balanceMap[playerId] += amount;
      }
    }
  });

  // 四舍五入到分 (避免浮点数精度误差)
  const playerBalances = players.map(player => ({
    player,
    balance: Number((balanceMap[player.id] || 0).toFixed(2)),
  }));

  // 3. 计算最优转账方案 (Debtors -> Creditors)
  const transfers: TransferInstruction[] = [];

  // 分离赢家 (净正) 和输家 (净负)
  const creditors = playerBalances
    .filter(p => p.balance > 0.001)
    .map(p => ({ ...p, remaining: p.balance }));

  const debtors = playerBalances
    .filter(p => p.balance < -0.001)
    .map(p => ({ ...p, remaining: Math.abs(p.balance) }));

  // 贪心匹配转账
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amount = Number(Math.min(debtor.remaining, creditor.remaining).toFixed(2));

    if (amount > 0) {
      transfers.push({
        fromPlayerId: debtor.player.id,
        fromPlayerName: debtor.player.name,
        toPlayerId: creditor.player.id,
        toPlayerName: creditor.player.name,
        amount,
      });

      debtor.remaining -= amount;
      creditor.remaining -= amount;
    }

    if (debtor.remaining < 0.005) i++;
    if (creditor.remaining < 0.005) j++;
  }

  // 4. 生成适合发到微信 / WhatsApp 群的精简转账对账单
  const shareLines: string[] = [
    `🀄 【马来西亚三人麻将 终局对账转账单】`,
    `共进行了 ${rounds.length} 局对决 | 流水总计：RM ${totalPotPlayed.toFixed(2)}`,
    `----------------------------------`,
    `📊 【各位战绩净收益】:`,
    ...playerBalances.map(pb => {
      const sign = pb.balance > 0 ? '+' : '';
      const emoji = pb.balance > 0 ? '🟢 赢' : pb.balance < 0 ? '🔴 输' : '⚪ 平';
      return `${emoji} ${pb.player.name}：${sign}RM ${pb.balance.toFixed(2)}`;
    }),
    `----------------------------------`,
    `📲 【最终一键转账方案 (DuitNow / TNG)】:`,
  ];

  if (transfers.length === 0) {
    shareLines.push(`🎉 各位平局或暂无对局，无需转账！`);
  } else {
    transfers.forEach((tr, idx) => {
      shareLines.push(
        `${idx + 1}. 👉 由【${tr.fromPlayerName}】转账 RM ${tr.amount.toFixed(2)} 给【${tr.toPlayerName}】`
      );
    });
  }

  shareLines.push(`----------------------------------`);
  shareLines.push(`（账目已核平，祝各位好牌连连！🀄）`);

  return {
    playerBalances,
    transfers,
    totalRounds: rounds.length,
    totalPotPlayed: Number(totalPotPlayed.toFixed(2)),
    formattedShareText: shareLines.join('\n'),
  };
}
