import { isNullOrUndefined } from "@/common/module";
import { colors } from "@/common/theme";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useIntervalContext } from '../common/IntervalContext';

const EditCurrentSession = () => {
  const { intervals, updateIntervalAnswer } = useIntervalContext();
  const textColor = useThemeColor({}, "text");
  const cardColor = useThemeColor({}, "card");
  const primaryColor = useThemeColor({}, "primary");

  // Save answer for an interval using context
  const saveAnswer = (
    intervalIdx: number,
    answer?: "yes" | "no" | "missed"
  ) => {
    updateIntervalAnswer(intervalIdx, answer);
  };

  // Sort intervals ascending by index
  const sortedIntervals = [...intervals].sort((a, b) => a.index - b.index);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <FlatList
        data={sortedIntervals}
        keyExtractor={(item) => item.index.toString()}
        renderItem={({ item }) => (
          <View
            style={[
              styles.intervalCard,
              {
                backgroundColor: cardColor,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              },
            ]}
          >
            <View>
              <Text style={[styles.intervalText, { color: textColor }]}>
                Interval #{item.index + 1}
              </Text>
              <Text style={[styles.intervalText, { color: textColor }]}>
                Start: {new Date(item.start).toLocaleTimeString()}
              </Text>
              <Text style={[styles.intervalText, { color: textColor }]}>
                Duration: {Math.round(item.duration / 1000)}s
              </Text>
            </View>
            {isNullOrUndefined(item.answer) ? (
              <View
                style={{ flexDirection: "row", marginLeft: 8, marginTop: 4 }}
              >
                <TouchableOpacity
                  onPress={() => saveAnswer(item.index, "yes")}
                  style={[
                    styles.answerBtn,
                    { backgroundColor: colors.success },
                  ]}
                >
                  <Text style={styles.answerBtnText}>✔</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => saveAnswer(item.index, "no")}
                  style={[
                    styles.answerBtn,
                    { backgroundColor: colors.destructive, marginLeft: 8 },
                  ]}
                >
                  <Text style={styles.answerBtnText}>✘</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => saveAnswer(item.index, "missed")}
                  style={[
                    styles.answerBtn,
                    { backgroundColor: "#FFD700", marginLeft: 8 },
                  ]}
                >
                  <Text style={[styles.answerBtnText, { color: colors.black }]}>
                    😬 (Missed it!)
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View
                style={{ flexDirection: "row", marginLeft: 8, marginTop: 4 }}
              >
                <Text
                  style={[
                    styles.intervalText,
                    {
                      color:
                        item.answer === "yes"
                          ? colors.success
                          : item.answer === "no"
                          ? colors.destructive
                          : "#FFD700",
                      fontWeight: "bold",
                      marginLeft: 8,
                    },
                  ]}
                >
                  Earned Token(s)?{" "}
                  {item.answer === "yes"
                    ? "✔"
                    : item.answer === "no"
                    ? "✘"
                    : "😬"}
                </Text>
                <TouchableOpacity onPress={() => saveAnswer(item.index)}>
                  <Ionicons
                    name="bandage-outline"
                    size={20}
                    color={primaryColor}
                    style={{ marginLeft: 8 }}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  intervalCard: {
    backgroundColor: "#f2f2f7",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  intervalText: {
    fontSize: 14,
    marginBottom: 2,
  },
  answerBtn: {
    padding: 8,
    borderRadius: 8,
  },
  answerBtnText: {
    color: colors.white,
    fontWeight: "bold",
  },
});

export default EditCurrentSession;
