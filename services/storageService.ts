
import { Account, MetricEntry, EarningEntry } from '../types';

const KEYS = {
  ACCOUNTS: 'sg_accounts',
  METRICS: 'sg_metrics',
  EARNINGS: 'sg_earnings',
};

const safeParse = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key);
    if (!data) return defaultValue;
    return JSON.parse(data) as T;
  } catch (e) {
    console.error(`Erro ao carregar chave ${key} do storage:`, e);
    return defaultValue;
  }
};

export const storage = {
  getAccounts: (): Account[] => safeParse(KEYS.ACCOUNTS, []),
  saveAccounts: (accounts: Account[]) => {
    localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
  },
  getMetrics: (): MetricEntry[] => safeParse(KEYS.METRICS, []),
  saveMetrics: (metrics: MetricEntry[]) => {
    localStorage.setItem(KEYS.METRICS, JSON.stringify(metrics));
  },
  getEarnings: (): EarningEntry[] => safeParse(KEYS.EARNINGS, []),
  saveEarnings: (earnings: EarningEntry[]) => {
    localStorage.setItem(KEYS.EARNINGS, JSON.stringify(earnings));
  }
};
