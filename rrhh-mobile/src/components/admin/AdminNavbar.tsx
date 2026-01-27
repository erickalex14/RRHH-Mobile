import { memo } from "react";
import { usePathname, useRouter } from "expo-router";
import { LayoutDashboard, FileText, ClipboardList, Building2, Users, Sparkles } from "@tamagui/lucide-icons";
import { Button, ScrollView, Text, XStack } from "tamagui";
import { AnimatedButton } from "@/components/ui/AnimatedButton";

const NAV_ITEMS = [
  { label: "Inicio", path: "/(app)/(admin)/dashboard", Icon: LayoutDashboard },
  { label: "Solicitudes", path: "/(app)/(admin)/solicitudes", Icon: ClipboardList },
  { label: "Documentos", path: "/(app)/(admin)/documentos", Icon: FileText },
  { label: "Catálogos", path: "/(app)/(admin)/crud", Icon: Sparkles },
  { label: "Usuarios", path: "/(app)/(admin)/users", Icon: Users },
  { label: "Sucursales", path: "/(app)/(admin)/branches", Icon: Building2 }
];

export const AdminNavbar = memo(() => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <XStack
      alignItems="center"
      justifyContent="space-between"
      backgroundColor="rgba(255,255,255,0.04)"
      borderColor="rgba(255,255,255,0.08)"
      borderWidth={1}
      borderRadius="$6"
      padding="$3"
      gap="$3"
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
        <XStack gap="$2" alignItems="center">
          {NAV_ITEMS.map(({ label, path, Icon }) => {
            const isActive = pathname?.startsWith(path);
              return (
                <AnimatedButton
                  key={path}
                  size="$3"
                  backgroundColor={isActive ? "rgba(99,102,241,0.22)" : "rgba(255,255,255,0.03)"}
                  color="$text"
                  borderColor={isActive ? "#7c8cff" : "rgba(255,255,255,0.08)"}
                  borderWidth={1}
                  icon={<Icon size={16} color="#93c5fd" />}
                  onPress={() => router.push(path as never)}
                  fontFamily="$heading"
                  size="$6"
                  paddingVertical="$2"
                  paddingHorizontal="$4"
                  backgroundColor="rgba(255,255,255,0.10)"
                  color="$blue10"
                  borderRadius="$8"
                />
            );
          })}
        </XStack>
      </ScrollView>
    </XStack>
  );
});

AdminNavbar.displayName = "AdminNavbar";
