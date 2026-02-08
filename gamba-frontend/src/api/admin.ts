// src/api/admin.ts
import { api } from "./client";

export const adminApi = {
  createTournament: (data: any) => api.post("/tournaments", data),
  updateTournament: (id: string, data: any) => api.put(`/tournaments/${id}`, data),
  deleteTournament: (id: string) => api.delete(`/tournaments/${id}`),
  endTournament: (id: string) => api.post(`/tournaments/${id}/end`),
  // Helper to refresh scores manually if needed
  updateScore: (id: string, userId: string, score: number) => 
    api.post(`/tournaments/${id}/score`, { user_id: userId, score })
};