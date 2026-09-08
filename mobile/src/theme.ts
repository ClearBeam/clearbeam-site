/** Small shared style tokens. The app follows the system light/dark setting via
 *  the two palettes below; components pick one with `useColors()`. */
import { useColorScheme } from "react-native";

const light = {
  background: "#F4F6F8",
  card: "#FFFFFF",
  border: "#E2E6EA",
  text: "#0B1F33",
  textMuted: "#5B6B7B",
  primary: "#1C6DD0",
  primaryText: "#FFFFFF",
  danger: "#C0392B",
  success: "#1E8E4E",
  pillBg: "#EDF1F5",
};

const dark: typeof light = {
  background: "#0B1420",
  card: "#152232",
  border: "#243547",
  text: "#EAF0F6",
  textMuted: "#9DB0C2",
  primary: "#4C9AF5",
  primaryText: "#06131F",
  danger: "#F1706A",
  success: "#5FD08A",
  pillBg: "#1E2E40",
};

export type Colors = typeof light;

export function useColors(): Colors {
  return useColorScheme() === "dark" ? dark : light;
}

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const radius = { sm: 8, md: 12, lg: 16 } as const;
