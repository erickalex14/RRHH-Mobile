import { Screen } from "@/components/ui/Screen";
import { AnimatedInput } from "@/components/ui/AnimatedInput";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { useAuthStore } from "@/store/auth";
import { useEffect, useMemo, useState } from "react";
import { Stack } from "expo-router";
import { Alert } from "react-native";
import { AnimatePresence, Paragraph, Spinner, Text, YStack } from "tamagui";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";

export default function PerfilScreen(): JSX.Element {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);

  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.employeeDetail?.phone ?? "");
  const [address, setAddress] = useState(user?.employeeDetail?.address ?? "");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    setEmail(user?.email ?? "");
    setPhone(user?.employeeDetail?.phone ?? "");
    setAddress(user?.employeeDetail?.address ?? "");
  }, [user]);

  const companyInfo = useMemo(() => {
    const company = user?.employeeDetail?.department?.branch?.company?.name;
    const branch = user?.employeeDetail?.department?.branch?.name;
    const schedule = user?.employeeDetail?.schedule?.name;
    return `${company ?? ""} · ${branch ?? ""} · ${schedule ?? ""}`;
  }, [user]);

  const handleSave = async (): Promise<void> => {
    setSaving(true);
    try {
      await updateProfile({ email, phone, address });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar el perfil.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    await logout();
  };

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <YStack gap="$4" flex={1}>
        <Text fontFamily="$heading" fontSize="$6" color="$text">
          Perfil
        </Text>
        <Paragraph color="$text" opacity={0.7}>
          {companyInfo}
        </Paragraph>

        <YStack gap="$3">
          <AnimatedInput label="Nombre" value={`${user?.first_name ?? ""} ${user?.last_name ?? ""}`} editable={false} />
          <AnimatedInput label="Correo" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <AnimatedInput label="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <AnimatedInput label="Dirección" value={address} onChangeText={setAddress} />
        </YStack>

        <AnimatePresence>
          {success ? (
            <Animated.View entering={FadeInDown} exiting={FadeOutUp} style={{ backgroundColor: "rgba(34,197,94,0.2)", padding: 12, borderRadius: 16 }}>
              <Text color="$success" fontWeight="700">
                Perfil actualizado correctamente
              </Text>
            </Animated.View>
          ) : null}
        </AnimatePresence>

        <YStack gap="$3" mt="auto">
          <AnimatedButton onPress={handleSave} disabled={saving}>
            {saving ? <Spinner color="$text" /> : "Guardar cambios"}
          </AnimatedButton>
          <AnimatedButton bg="$danger" onPress={handleLogout}>
            Cerrar sesión
          </AnimatedButton>
        </YStack>
      </YStack>
    </Screen>
  );
}
