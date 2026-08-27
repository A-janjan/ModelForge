import { apiClient } from './client';
import { PredictionRequest, PredictionResponse } from '../types';

export const predict = (data: PredictionRequest) =>
  apiClient.post<PredictionResponse>('/predict', data).then((res) => res.data);