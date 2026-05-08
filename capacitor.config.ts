import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.gounion.app",
  appName: "GoUnion",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
