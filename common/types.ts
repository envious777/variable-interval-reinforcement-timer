export type Answer = 'yes' | 'no' | 'missed';

export type SoundType = "bell" | "chime" | "alert";

export type SoundOption = {
  label: string;
  value: SoundType;
  file: any; // The sound file
}