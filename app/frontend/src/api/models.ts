import { apiClient } from './client';
import { Model, ModelCreate, ModelResponse } from '../types';

export const getModels = () =>
  apiClient.get<Model[]>('/admin/models').then((res) => res.data);

export const getModelById = (id: number) =>
  apiClient.get<Model>(`/admin/models/${id}`).then((res) => res.data);

export const getModelByVersion = (version: string) =>
  apiClient.get<Model>(`/admin/models/version/${version}`).then((res) => res.data);

export const createModel = (data: ModelCreate) =>
  apiClient.post<ModelResponse>('/admin/models', data).then((res) => res.data);

export const updateWeight = (version: string, weight: number) =>
  apiClient.put(`/admin/models/${version}/weight`, { traffic_weight: weight });

export const updateStatus = (version: string, status: string) =>
  apiClient.put(`/admin/models/${version}/status`, { status });

export const rollback = (version: string) =>
  apiClient.put(`/admin/models/${version}/rollback`);

export const promote = (version: string) =>
  apiClient.post(`/admin/promote/${version}`);

export const drain = (version: string) =>
  apiClient.post(`/admin/drain/${version}`);

export const getDriftStatus = (version: string) =>
  apiClient.get(`/admin/models/${version}/drift`).then((res) => res.data);