import apiClient from './client';
import type { User } from '../types';

export const usersApi = {
  getAgents: async (): Promise<User[]> => {
    const res = await apiClient.get<User[]>('/users/agents');
    return res.data;
  },
};
