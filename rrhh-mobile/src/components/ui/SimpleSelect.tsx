import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

export interface SelectOption {
  label: string;
  value: string;
}

interface SimpleSelectProps {
  options: SelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export const SimpleSelect = ({
  options,
  value,
  onValueChange,
  placeholder = "Selecciona"
}: SimpleSelectProps): JSX.Element => {
  const [open, setOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption?.label ?? placeholder;

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setOpen(false);
  };

  return (
    <>
      <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={styles.triggerText} numberOfLines={1}>
          {displayText}
        </Text>
        <Text style={styles.chevron}>▼</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.headerText}>Seleccionar opción</Text>
            </View>
            <ScrollView style={styles.scrollView} bounces={false}>
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => handleSelect(option.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected
                      ]}
                    >
                      {option.label}
                    </Text>
                    {isSelected ? <Text style={styles.checkmark}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1e293b",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44
  },
  triggerText: {
    color: "#f8fafc",
    fontSize: 14,
    flex: 1
  },
  chevron: {
    color: "#94a3b8",
    fontSize: 10,
    marginLeft: 8
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  content: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    width: "85%",
    maxWidth: 400,
    maxHeight: "70%",
    overflow: "hidden"
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#334155"
  },
  headerText: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "600"
  },
  scrollView: {
    maxHeight: 300
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#334155"
  },
  optionSelected: {
    backgroundColor: "rgba(59, 130, 246, 0.1)"
  },
  optionText: {
    color: "#f8fafc",
    fontSize: 14,
    flex: 1
  },
  optionTextSelected: {
    color: "#3b82f6",
    fontWeight: "600"
  },
  checkmark: {
    color: "#3b82f6",
    fontSize: 16,
    fontWeight: "bold"
  }
});
