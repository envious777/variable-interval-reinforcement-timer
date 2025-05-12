import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

interface TimeInputProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  editable: boolean;
  placeholder: string;
  textColor: string;
  borderColor: string;
}

const TimeInput: React.FC<TimeInputProps> = ({
  label,
  value,
  onChangeText,
  editable,
  placeholder,
  textColor,
  borderColor,
}) => (
  <View style={styles.timeInputContainer}>
    <Text style={[styles.timeInputLabel, { color: textColor }]}>{label}</Text>
    <TextInput
      style={[styles.timeInput, { color: textColor, borderColor }]}
      value={value}
      onChangeText={onChangeText}
      keyboardType="numeric"
      editable={editable}
      maxLength={2}
      placeholder={placeholder}
      placeholderTextColor={textColor + '80'}
    />
  </View>
);

const styles = StyleSheet.create({
  timeInputContainer: {
    flex: 1,
    alignItems: 'center',
  },
  timeInputLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    width: '80%',
    textAlign: 'center',
    fontSize: 18,
  },
});

export default TimeInput;
