import * as path from "path";

export const ROOT_DIR = path.resolve(__dirname, "../../../");
export const MAIN_PACKAGE_PATH = path.join(ROOT_DIR, "package.json");

export const IDEMS_APP_CONFIG = {
  path: path.resolve(ROOT_DIR, ".idems_app"),
  deployments: path.resolve(ROOT_DIR, ".idems_app", "deployments"),
};

export const SCRIPTS_WORKSPACE_PATH = path.join(ROOT_DIR, "packages/scripts");

export const CONFIG_FOLDER_PATH = path.join(SCRIPTS_WORKSPACE_PATH, "config");
export const PRIVATE_KEY_PATH = path.join(CONFIG_FOLDER_PATH, "private.key");
export const PUBLIC_KEY_PATH = path.join(CONFIG_FOLDER_PATH, "public.key");
export const CREDENTIALS_PATH = path.join(CONFIG_FOLDER_PATH, "credentials.json");
export const AUTH_TOKEN_PATH = path.join(CONFIG_FOLDER_PATH, "token.json");

export const RESOURCE_FOLDER_PATH = path.join(ROOT_DIR, "resources");

export const ANDROID_RES_PATH = path.join(ROOT_DIR, "android/app/src/main/res");
export const APP_BUILD_GRADLE_PATH = path.join(ROOT_DIR, "android/app/build.gradle");
