import { Tabs } from "expo-router";
import { useMemo, useEffect } from "react";
import { useTheme } from "tamagui";
import { Home, CalendarDays, ClipboardList, FileText, User } from "@tamagui/lucide-icons";
import Animated, {
  Easing,
  useSharedValue,
  withTiming,
  useAnimatedStyle
} from "react-native-reanimated";

interface TabIconProps {
  focused: boolean;
  Icon: typeof Home;
}

const AnimatedIcon = ({ focused, Icon }: TabIconProps): JSX.Element => {
  const scale = useSharedValue(focused ? 1 : 0.9);
  const opacity = useSharedValue(focused ? 1 : 0.65);

  useEffect(() => {
    scale.value = withTiming(focused ? 1 : 0.9, {
      duration: 220,
      easing: Easing.out(Easing.quad)
    });
    opacity.value = withTiming(focused ? 1 : 0.65, {
      duration: 220,
      easing: Easing.out(Easing.quad)
    });
  }, [focused, opacity, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value
  }));

  return (
    <Animated.View style={style}>
      <Icon size={22} />
    </Animated.View>
  );
};

export default function TabsLayout(): JSX.Element {
  const theme = useTheme();
  const surface = theme?.surface?.val ?? "#0f172a";
  const border = theme?.borderColor?.val ?? "rgba(148,163,184,0.3)";
  const color = theme?.color?.val ?? "#f8fafc";
  const tabBarStyle = useMemo(
    () => ({
      position: "absolute" as const,
      left: 16,
      right: 16,
      bottom: 12,
      backgroundColor: `${surface}E6`,
      borderTopColor: "transparent",
      borderWidth: 1,
      borderColor: `${border}80`,
      borderRadius: 24,
      height: 70,
      paddingBottom: 12,
      paddingTop: 8,
      shadowColor: "#000",
      shadowOpacity: 0.25,
      shadowOffset: { width: 0, height: 10 },
      shadowRadius: 22,
      elevation: 8
    }),
    [border, surface]
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: color,
        tabBarInactiveTintColor: color,
        tabBarStyle
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Inicio",
          tabBarIcon: ({ focused }) => <AnimatedIcon focused={focused} Icon={Home} />
        }}
      />
      <Tabs.Screen
        name="jornadas"
        options={{
          title: "Jornadas",
          tabBarIcon: ({ focused }) => <AnimatedIcon focused={focused} Icon={CalendarDays} />
        }}
      />
      <Tabs.Screen
        name="solicitudes"
        options={{
          title: "Solicitudes",
          tabBarIcon: ({ focused }) => <AnimatedIcon focused={focused} Icon={ClipboardList} />
        }}
      />
      <Tabs.Screen
        name="documentos"
        options={{
          title: "Docs",
          tabBarIcon: ({ focused }) => <AnimatedIcon focused={focused} Icon={FileText} />
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ focused }) => <AnimatedIcon focused={focused} Icon={User} />
        }}
      />
    </Tabs>
  );
}
