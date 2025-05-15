import { colors } from "@/common/theme";
import { useThemeColor } from "@/hooks/useThemeColor";
import React from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    View
} from "react-native";
import { useIntervalContext } from '../common/IntervalContext';
import IntervalAnswerButtons from '../components/IntervalAnswerButtons';

const EditCurrentSession = () => {
  const { intervals, updateIntervalAnswer } = useIntervalContext();
  const textColor = useThemeColor({}, "text");
  const cardColor = useThemeColor({}, "card");
  const primaryColor = useThemeColor({}, "primary");
  const backgroundColor = useThemeColor({}, 'background');

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
    <View style={{ flex: 1, padding: 16, backgroundColor }}>
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
            <IntervalAnswerButtons
              answer={item.answer ?? undefined}
              onAnswer={ans => saveAnswer(item.index, ans)}
              primaryColor={primaryColor}
              allowEdit={true} // Allow editing the answer
            />
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
