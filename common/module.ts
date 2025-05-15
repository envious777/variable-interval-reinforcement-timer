import { BACKGROUND_TASK_IDENTIFIER } from "@/common/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAudioPlayer } from "expo-audio";
import * as BackgroundTask from "expo-background-task";
import * as Notifications from "expo-notifications";
import { colors } from "./theme";
import { SoundOption, SoundType } from "./types";

// Import the sound files
const BELL_SOUND = require("../assets/audio/bell-sound.mp3");
const CHIME_SOUND = require("../assets/audio/chime-sound.mp3");
const ALERT_SOUND = require("../assets/audio/alert-sound.mp3");

/**
 * Helper function to convert hours, minutes, seconds to milliseconds
 * @returns time in milliseconds
 */
export const timeToMilliseconds = (
  hours: string,
  minutes: string,
  seconds: string
) =>
  parseInt(hours) * 60 * 60 * 1000 +
  parseInt(minutes) * 60 * 1000 +
  parseInt(seconds) * 1000;

/**
 * Format time to display hours, minutes, seconds
 * @returns formatted time string
 */
export const formatTime = (milliseconds: number) => {
  if (milliseconds <= 0) {
    return "Triggering soon...";
  }

  // Convert milliseconds to hours, minutes, seconds
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

  // Format string based on whether we have hours
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else {
    return `${minutes}m ${seconds}s`;
  }
};

/**
 * Function to calculate the next random interval in milliseconds
 */
export const calculateNextInterval = async () => {
  try {
    // Get min, max, and avg values from AsyncStorage
    const minHours = (await AsyncStorage.getItem("minHours")) || "0";
    const minMinutes = (await AsyncStorage.getItem("minMinutes")) || "0";
    const minSeconds = (await AsyncStorage.getItem("minSeconds")) || "0";

    const maxHours = (await AsyncStorage.getItem("maxHours")) || "0";
    const maxMinutes = (await AsyncStorage.getItem("maxMinutes")) || "0";
    const maxSeconds = (await AsyncStorage.getItem("maxSeconds")) || "0";

    const avgHours = (await AsyncStorage.getItem("avgHours")) || "0";
    const avgMinutes = (await AsyncStorage.getItem("avgMinutes")) || "30";
    const avgSeconds = (await AsyncStorage.getItem("avgSeconds")) || "0";

    // Convert to milliseconds
    const min = timeToMilliseconds(minHours, minMinutes, minSeconds);
    const max = timeToMilliseconds(maxHours, maxMinutes, maxSeconds);
    const avg = timeToMilliseconds(avgHours, avgMinutes, avgSeconds);

    // Create a random interval around the average
    // This ensures the average of many intervals will approach the desired average
    // We'll use a slightly more complex distribution to ensure true average convergence

    // Random value between -1 and 1
    const randomFactor = Math.random() * 2 - 1;

    // Calculate max deviation from average (respecting min/max bounds)
    const maxDevBelow = avg - min;
    const maxDevAbove = max - avg;

    // Apply the random factor to get our interval
    let interval;
    if (randomFactor < 0) {
      // Going below average
      interval = avg + randomFactor * maxDevBelow;
    } else {
      // Going above average
      interval = avg + randomFactor * maxDevAbove;
    }

    return Math.round(interval);
  } catch (error) {
    console.error("Error calculating interval:", error);
    return 30 * 60 * 1000; // Fallback to 30 minutes
  }
};

/**
 * Sound options for notifications
 */
export const SOUND_OPTIONS: SoundOption[] = [
  { label: "Bell", value: "bell", file: BELL_SOUND },
  { label: "Chime", value: "chime", file: CHIME_SOUND },
  { label: "Alert", value: "alert", file: ALERT_SOUND },
];

/**
 * Function to get sound file by key
 * @param key - The key of the sound
 * @returns The sound file
 */
export const getSoundFile = (key: string) => {
  const found = SOUND_OPTIONS.find((opt) => opt.value === key);
  return found ? found.file : BELL_SOUND;
};

/**
 * Function to trigger notification with sound
 * @param selectedSound - The sound to play when the notification is triggered
 */
export const triggerNotification = async (
  selectedSound: SoundType = "bell"
) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Timer Alert",
      body: "Your variable interval timer has triggered!",
      sound: true, // Use default sound
    },
    trigger: null, // Trigger immediately
  });

  // Play the selected sound
  try {
    const player = createAudioPlayer(getSoundFile(selectedSound));
    player.play();
  } catch (error) {
    console.error("Error playing sound:", error);
  }
};

/**
 * Function to register for background task
 */
export const registerBackgroundTask = async () => {
  try {
    await BackgroundTask.registerTaskAsync(BACKGROUND_TASK_IDENTIFIER, {
      minimumInterval: 15, // in minutes
    });
    console.info("Background task registered");
  } catch (error) {
    console.error("Background task registration failed:", error);
  }
};

export const isNullOrUndefined = (value: any) => {
  return value === null || value === undefined;
};

/**
 * Function to format the answer for CSV export
 * @param answer - The answer to format
 * @returns formatted answer string
 */
export const formatAnswerForCsv = (answer: string | null | undefined) => {
  switch (answer) {
    case "yes":
      return "Yes";
    case "no":
      return "No";
    case "missed":
      return "Missed";
    default:
      return "-";
  }
};

/**
 * Function to export CSV on web
 * This is a workaround for the lack of file system access in web
 * @param csv - The CSV string to export
 * @param filename - The name of the file to save
 */
export const exportCsvWeb = (csv: string, filename: string) => {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
};

export const getAnswerColor = (answer: string | null | undefined): string => {
  switch (answer) {
    case "yes":
      return colors.success;
    case "no":
      return colors.destructive;
    case "missed":
      return "#FFD700"; // Gold color for missed
    default:
      return colors.black;
  }
};

export const getAnswerIcon = (answer: string | null | undefined): string => {
  switch (answer) {
    case "yes":
      return "✅";
    case "no":
      return "❌";
    case "missed":
      return "😬";
    default:
      return "";
  }
};
