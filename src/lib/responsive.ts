import { Platform, useWindowDimensions } from "react-native";

export function useBreakpoint() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  return {
    isWeb,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    width,
  };
}
