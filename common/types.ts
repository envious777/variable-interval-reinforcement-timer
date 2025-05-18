export type Answer = 'yes' | 'no' | 'missed';

export type SoundType = "bell" | "chime" | "alert";

export type SoundOption = {
  label: string;
  value: SoundType;
  fileName: string;
  file: any; // The sound file
}