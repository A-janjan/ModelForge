export interface Model {
  id: number;
  name: string;
  version: string;
  artifact_path: string;
  status: 'pending' | 'active' | 'inactive' | 'archived' | 'failed';
  traffic_weight: number;
}

export interface ModelCreate {
  name: string;
  version: string;
  artifact_path: string;
  status: string;
  traffic_weight: number;
}

export interface ModelResponse {
  id: number;
  name: string;
  version: string;
  artifact_path: string;
  status: string;
  traffic_weight: number;
}

export interface PredictionRequest {
  sepal_length: number;
  sepal_width: number;
  petal_length: number;
  petal_width: number;
}

export interface PredictionResponse {
  prediction: string;
  model_version: string;
}

export interface DriftStatus {
  version: string;
  psi_per_feature: number[];
  average_psi: number;
  drift_detected: boolean;
  threshold: number;
  status?: string;
  samples?: number;
}