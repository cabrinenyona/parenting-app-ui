import { AssetsPostProcessor } from "./assets";
import type { IDeploymentConfigJson } from "../../deployment/common";

// Use default imports to allow spying on functions and replacing with mock methods
import { ActiveDeployment } from "../../deployment/get";
import path from "path";

/** Mock file system folders for use in tests */
const mockDirs = {
  appSheets: "mock/app_data/sheets",
  appTranslations: "mock/app_data/translations",
  localSheets: "mock/local/sheets",
  localTranslations: "mock/local/translations",
};

// TODO
/** yarn workspace scripts test -t sheets.spec.ts */
describe("PostProcess Sheets", () => {
  it.skip("TODO", () => expect(true).toEqual(true));
});
