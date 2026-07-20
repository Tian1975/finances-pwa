import type { Account } from '../accounts/Account';
import type { AccountRepository } from '../accounts/AccountRepository';
import type { Transaction } from '../transactions/Transaction';
import type { TransactionRepository } from '../transactions/TransactionRepository';

export interface AccountWithBalance {
  account: Account;
  balanceMinor: number;
}

/**
 * Servei d'aplicació: coordina AccountRepository i TransactionRepository
 * per aplicar regles de negoci que no pertanyen a cap dels dos per
 * separat. La UI no calcula res — només mostra el que aquest servei
 * retorna.
 *
 * Regla implementada (disseny-finances-pwa.md, Regles de negoci):
 * el saldo actual d'un compte = openingBalanceMinor + Σ(Transaction.amountMinor),
 * considerant només transaccions amb deletedAt = null.
 */
export class DashboardService {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly transactionRepository: TransactionRepository
  ) {}

  async getAccountBalance(accountId: string): Promise<number> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new Error(`No existeix cap compte amb id ${accountId}`);
    }

    const transactions = await this.transactionRepository.findAll({
      where: { accountId },
    });

    const activeSum = transactions
      .filter((t) => t.deletedAt === null)
      .reduce((sum, t) => sum + t.amountMinor, 0);

    return account.openingBalanceMinor + activeSum;
  }

  /** Tots els comptes (no eliminats) amb el seu saldo ja calculat. */
  async getAccountsWithBalance(): Promise<AccountWithBalance[]> {
    const accounts = await this.accountRepository.findAll({
      where: { deletedAt: null },
    });

    const results: AccountWithBalance[] = [];
    for (const account of accounts) {
      const balanceMinor = await this.getAccountBalance(account.id);
      results.push({ account, balanceMinor });
    }
    return results;
  }

  /** Últims N moviments (de tots els comptes), més recents primer. */
  async getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
    const all = await this.transactionRepository.findAll({
      where: { deletedAt: null },
    });
    return all
      .slice()
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      .slice(0, limit);
  }
}
