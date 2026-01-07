import { Platform } from "react-native";
import { Adapt, Select, Sheet } from "tamagui";
import { SimpleSelect, type SelectOption } from "./SimpleSelect";

export type HybridSelectProps = {
  options: SelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export const HybridSelect = ({
  options,
  value,
  onValueChange,
  placeholder = "Selecciona",
  disabled = false
}: HybridSelectProps): JSX.Element => {
  if (Platform.OS === "web") {
    return (
      <SimpleSelect
        options={options}
        value={value}
        onValueChange={onValueChange}
        placeholder={placeholder}
        disabled={disabled}
      />
    );
  }

  return (
    <Select value={value || undefined} onValueChange={onValueChange} disabled={disabled}>
      <Select.Trigger borderColor="$borderColor">
        <Select.Value placeholder={placeholder} />
      </Select.Trigger>
      <Adapt when="sm" platform="touch">
        <Sheet modal dismissOnSnapToBottom>
          <Sheet.Frame>
            <Sheet.ScrollView>
              <Adapt.Contents />
            </Sheet.ScrollView>
          </Sheet.Frame>
          <Sheet.Overlay enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        </Sheet>
      </Adapt>
      <Select.Content>
        <Select.ScrollUpButton />
        <Select.Viewport>
          {options.map((option) => (
            <Select.Item key={option.value} value={option.value} disabled={disabled}>
              <Select.ItemText>{option.label}</Select.ItemText>
            </Select.Item>
          ))}
        </Select.Viewport>
        <Select.ScrollDownButton />
      </Select.Content>
    </Select>
  );
};
