import type { AppConfig } from "./tamagui.config";

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}

  interface SelectProps<Value> {
    disabled?: boolean;
  }

  interface SelectItemExtraProps {
    index?: number;
  }
}

declare module "@tamagui/web" {
  interface TamaguiCustomConfig extends AppConfig {}
}

declare module "@tamagui/select" {
  interface SelectProps<Value> {
    disabled?: boolean;
  }

  interface SelectItemExtraProps {
    index?: number;
  }
}

declare module "@tamagui/animations-react-native" {
  import type { AnimationDriver } from "tamagui";

  type AnimationPresets = {
    quick: { type: "timing"; duration: number };
    slow: { type: "timing"; duration: number };
    bouncy: { type: "spring"; damping: number; mass: number; stiffness: number };
  };

  export const animations: AnimationDriver<AnimationPresets>;
}
