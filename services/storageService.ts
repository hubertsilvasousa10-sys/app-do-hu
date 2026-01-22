
import { Account, MetricEntry, EarningEntry } from '../types';

const KEYS = {
  ACCOUNTS: 'sg_accounts',
  METRICS: 'sg_metrics',
  EARNINGS: 'sg_earnings',
};

export const storage = {
  getAccounts: (): Account[] => {
    const data = localStorage.getItem(KEYS.ACCOUNTS);
    return data ? JSON.parse(data) : [];
  },
  saveAccounts: (accounts: Account[]) => {
    localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
  },
  getMetrics: (): MetricEntry[] => {
    const data = localStorage.getItem(KEYS.METRICS);
    return data ? JSON.parse(data) : [];
  },
  saveMetrics: (metrics: MetricEntry[]) => {
    localStorage.setItem(KEYS.METRICS, JSON.stringify(metrics));
  },
  getEarnings: (): EarningEntry[] => {
    const data = localStorage.getItem(KEYS.EARNINGS);
    return data ? JSON.parse(data) : [];
  },
  saveEarnings: (earnings: EarningEntry[]) => {
    localStorage.setItem(KEYS.EARNINGS, JSON.stringify(earnings));
  }
};
