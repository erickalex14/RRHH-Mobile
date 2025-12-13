import { Button, ButtonProps } from "tamagui";

export type AnimatedButtonProps = ButtonProps;

export const AnimatedButton = ({
  children,
  ...props
}: AnimatedButtonProps): JSX.Element => (
  <Button
    {...props}
    animation="bouncy"
    pressStyle={{ scale: 0.96, opacity: 0.85 }}
    bg={props.bg ?? "$brandPrimary"}
    color={props.color ?? "$text"}
    borderRadius={props.borderRadius ?? "$4"}
  >
    {children}
  </Button>
);
