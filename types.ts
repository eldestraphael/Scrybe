export interface TranscriptionResult {
  text: string;
  timestamp: Date;
}

export enum AudioSourceType {
  MICROPHONE = 'MICROPHONE',
  UPLOAD = 'UPLOAD'
}

export interface AudioState {
  blob: Blob | null;
  url: string | null;
  type: string | null;
  name?: string;
}

export interface TranscriptionState {
  isLoading: boolean;
  error: string | null;
  result: string | null;
}