import { Injectable } from "@angular/core";
import { initializeApp, FirebaseApp } from "firebase/app";
import { SyncServiceBase } from "../syncService.base";
import { DeploymentService } from "../deployment/deployment.service";

/** Service used to configure initialize firebase app core configuration */
@Injectable({ providedIn: "root" })
export class FirebaseService extends SyncServiceBase {
  /** Initialised firebase app. Will be undefined if firebase config unavailable */
  app: FirebaseApp | undefined;

  constructor(private deploymentService: DeploymentService) {
    super("Firebase");
    this.initialise();
  }

  /**
   * Configure app module imports dependent on what firebase features should be enabled
   */
  private initialise() {
    const { firebase } = this.deploymentService.config;

    // Check if any services are enabled, simply return if not
    const enabledServices = Object.entries(firebase)
      .filter(([key, v]) => v && v.constructor === {}.constructor && v["enabled"])
      .map(([key]) => key);
    if (enabledServices.length === 0) return;

    // Check config exists if services are enabled
    if (!firebase.config) {
      console.warn(`[Firebase] config missing, services disabled:\n`, enabledServices.join(", "));
      return;
    }

    this.app = initializeApp(firebase.config);
  }
}
