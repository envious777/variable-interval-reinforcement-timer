import { getAnswerColor, getAnswerIcon, isNullOrUndefined } from "@/common/module";
import { colors } from "@/common/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface IntervalAnswerButtonsProps {
  answer?: "yes" | "no" | "missed";
  onAnswer: (answer?: "yes" | "no" | "missed") => void;
  primaryColor: string;
  allowEdit?: boolean;
}

const IntervalAnswerButtons: React.FC<IntervalAnswerButtonsProps> = ({ answer, onAnswer, primaryColor, allowEdit }) => {
  if (isNullOrUndefined(answer)) {
    return (
      <View style={{ flexDirection: "row", marginLeft: 8, marginTop: 4 }}>
        <TouchableOpacity
          onPress={() => onAnswer("yes")}
          style={[styles.answerBtn, { backgroundColor: colors.success }]}
        >
          <Text style={styles.answerBtnText}>✓</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onAnswer("no")}
          style={[styles.answerBtn, { backgroundColor: colors.destructive, marginLeft: 8 }]}
        >
          <Text style={styles.answerBtnText}>X</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onAnswer("missed")}
          style={[styles.answerBtn, { backgroundColor: "#FFD700", marginLeft: 8 }]}
        >
          <Text style={[styles.answerBtnText, { color: colors.black }]}>😬 (Missed it!)</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flexDirection: "row", marginLeft: 8, marginTop: 4 }}>
      <Text style={[
        styles.intervalText,
        {
          color: getAnswerColor(answer),
          fontWeight: "bold",
          marginLeft: 8,
        },
      ]}>
        Earned Token(s)? {getAnswerIcon(answer)}
      </Text>
      {allowEdit && <TouchableOpacity onPress={() => onAnswer(undefined)}>
        <Ionicons
          name="bandage-outline"
          size={20}
          color={primaryColor}
          style={{ marginLeft: 8 }}
        />
      </TouchableOpacity>}
    </View>
  );
};

const styles = StyleSheet.create({
  answerBtn: {
    padding: 8,
    borderRadius: 8,
  },
  answerBtnText: {
    color: colors.white,
    fontWeight: "bold",
  },
  intervalText: {
    fontSize: 14,
    marginBottom: 2,
  },
});

export default IntervalAnswerButtons;
