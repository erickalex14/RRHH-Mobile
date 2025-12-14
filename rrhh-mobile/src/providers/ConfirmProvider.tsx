import { PropsWithChildren, createContext, useCallback, useMemo, useRef, useState } from "react";
import { Adapt, Dialog, Paragraph, Sheet, Text, XStack, YStack } from "tamagui";
import { AnimatedButton } from "@/components/ui/AnimatedButton";

export interface ConfirmDialogOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
}

const defaultOptions: Required<Omit<ConfirmDialogOptions, "message">> = {
  title: "Confirmar acción",
  confirmLabel: "Confirmar",
  cancelLabel: "Cancelar",
  destructive: false
};

export const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export const ConfirmProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [options, setOptions] = useState<ConfirmDialogOptions>(defaultOptions);
  const [open, setOpen] = useState(false);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const pendingRef = useRef(false);

  const resolve = useCallback((accepted: boolean) => {
    if (!pendingRef.current) {
      return;
    }
    pendingRef.current = false;
    resolverRef.current?.(accepted);
    resolverRef.current = null;
  }, []);

  const handleDismiss = useCallback(() => {
    setOpen(false);
    resolve(false);
  }, [resolve]);

  const confirm = useCallback<ConfirmContextValue["confirm"]>((incomingOptions) => {
    return new Promise<boolean>((resolvePromise) => {
      setOptions({ ...defaultOptions, ...incomingOptions });
      resolverRef.current = resolvePromise;
      pendingRef.current = true;
      setOpen(true);
    });
  }, []);

  const contextValue = useMemo(() => ({ confirm }), [confirm]);

  const confirmAction = useCallback(
    (accepted: boolean) => {
      setOpen(false);
      resolve(accepted);
    },
    [resolve]
  );

  return (
    <ConfirmContext.Provider value={contextValue}>
      {children}
      <Dialog modal open={open} onOpenChange={(nextOpen) => (nextOpen ? setOpen(true) : handleDismiss())}>
        <Adapt when="sm" platform="touch">
          <Sheet modal snapPoints={[80]}>
            <Sheet.Frame padding="$4" backgroundColor="$color2">
              <Sheet.ScrollView>
                <Adapt.Contents />
              </Sheet.ScrollView>
            </Sheet.Frame>
            <Sheet.Overlay enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
          </Sheet>
        </Adapt>
        <Dialog.Portal>
          <Dialog.Overlay
            key="overlay"
            animation="quick"
            opacity={0.5}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
          <Dialog.Content
            key="content"
            elevate
            bordered
            animation="quick"
            enterStyle={{ opacity: 0, scale: 0.95 }}
            exitStyle={{ opacity: 0, scale: 0.95 }}
            backgroundColor="$color2"
            gap="$4"
          >
            <YStack gap="$2">
              {options.title ? (
                <Dialog.Title>
                  <Text fontFamily="$heading" fontSize="$6" color="$text">
                    {options.title}
                  </Text>
                </Dialog.Title>
              ) : null}
              <Dialog.Description>
                <Paragraph color="$muted">{options.message}</Paragraph>
              </Dialog.Description>
            </YStack>
            <XStack gap="$3">
              <AnimatedButton flex={1} backgroundColor="$color4" color="$text" onPress={() => confirmAction(false)}>
                {options.cancelLabel ?? defaultOptions.cancelLabel}
              </AnimatedButton>
              <AnimatedButton
                flex={1}
                backgroundColor={options.destructive ? "$danger" : "$brandPrimary"}
                color={options.destructive ? "#fff" : "$text"}
                onPress={() => confirmAction(true)}
              >
                {options.confirmLabel ?? defaultOptions.confirmLabel}
              </AnimatedButton>
            </XStack>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </ConfirmContext.Provider>
  );
};

