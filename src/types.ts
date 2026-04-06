export interface Detection {
  id: string;
  plate: string;
  bbox: [number, number, number, number];
  confidence: number;
  timestamp: string;
  status: 'new' | 'duplicate';
}

export interface StreamStatus {
  connected: boolean;
  fps: number;
  latency: number;
}
