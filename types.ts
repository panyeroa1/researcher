
export enum AppMode {
  PITCH_GENERATOR = 'pitch_generator',
  IMAGE_ANALYZER = 'image_analyzer',
  AUDIO_TRANSCRIBER = 'audio_transcriber',
  VIDEO_ANALYZER = 'video_analyzer',
  QUICK_ANSWER = 'quick_answer',
  TTS = 'tts',
}

export interface PresentationSlideData {
  sectionTitle: string;
  script: string;
  imagePrompt: string;
}

export interface PresentationSlide extends PresentationSlideData {
  imageUrl: string | null;
}