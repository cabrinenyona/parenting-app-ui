/// <reference types="@capacitor/local-notifications" />
/// <reference types="@capacitor/splash-screen" />

import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "${APP_ID}",
  appName: "${APP_NAME}",
  webDir: "www",
  zoomEnabled: toBoolean("${ZOOM_ENABLED}"),
  plugins: {
    SplashScreen: {
      launchShowDuration: 7000, // app.component.ts should manually dismiss before duration
      launchAutoHide: true,
      androidScaleType: "CENTER_CROP",
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com", "apple.com"],
    },
  },
  server: {
    androidScheme: "http",
    /**
     * NOTE - to support live-reload on external device (e.g. emulator)
     * 1) Uncomment url and replace with local ip to serve live-reload on local device
     * 2) Either edit capacitor.config.ts directly, or if editing capacitor.config.template.ts,
     *    run `yarn workflow <platform> configure`, replacing `<platform>` with either ios or android
     * 3) Sync to capacitor `npx cap sync`
     * 4) Serve via `yarn ng serve --configuration=external`
     * 5) Run app from android studio or xcode: `npx cap open <platform>` and run
     * Local browser (localhost:4000), device app and device browser ([ip]:4200) should all be able to access served app
     **/
    // url: "http://192.168.50.67:4200",
  },
};

export default config;

function toBoolean(v: string) {
  return v && typeof v === "string" && v.toLowerCase() === "true" ? true : false;
}
