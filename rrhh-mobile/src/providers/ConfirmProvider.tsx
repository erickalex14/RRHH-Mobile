import { PropsWithChildren, createContext, useCallback, useMemo, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

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

const defaultOptions: Required<ConfirmDialogOptions> = {
  title: "Confirmar acción",
  message: "¿Deseas continuar?",
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
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={handleDismiss}
      >
        <Pressable style={styles.overlay} onPress={handleDismiss}>
          <Pressable style={styles.content} onPress={(e) => e.stopPropagation()}>
            <View style={styles.card}>
              <View style={styles.header}>
                {options.title ? (
                  <Text style={styles.title}>{options.title}</Text>
                ) : null}
                <Text style={styles.message}>{options.message}</Text>
              </View>
              <View style={styles.buttons}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => confirmAction(false)}
                >
                  <Text style={styles.cancelText}>
                    {options.cancelLabel ?? defaultOptions.cancelLabel}
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.confirmButton,
                    options.destructive && styles.destructiveButton
                  ]}
                  onPress={() => confirmAction(true)}
                >
                  <Text style={[styles.confirmText, options.destructive && styles.destructiveText]}>
                    {options.confirmLabel ?? defaultOptions.confirmLabel}
                  </Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ConfirmContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  content: {
    maxWidth: "90%",
    width: 340
  },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 20,
    gap: 16
  },
  header: {
    gap: 8
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#f8fafc"
  },
  message: {
    fontSize: 14,
    color: "#94a3b8"
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end"
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#334155"
  },
  cancelText: {
    color: "#f8fafc",
    fontWeight: "600"
  },
  confirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#3b82f6"
  },
  confirmText: {
    color: "#f8fafc",
    fontWeight: "600"
  },
  destructiveButton: {
    backgroundColor: "#ef4444"
  },
  destructiveText: {
    color: "#ffffff"
  }
});

