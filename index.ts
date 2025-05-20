/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const prompts = require("prompts");

import {
  AppsScriptDeploymentHandler,
  GcpDeploymentHandler,
  UserConfigManager,
} from "./common.js";

(async () => {
  const config = UserConfigManager.getCurrentConfig();

  const deploymentChoicePrompt = {
    type: "select" as const, // Important for type inference with prompts library
    name: "deploymentOption",
    message: "What components would you like to deploy?",
    choices: [
      {
        title: "Cloud Run backend + Apps Script frontend (default)",
        value: "all",
      },
      { title: "Cloud Run backend only", value: "backend" },
      { title: "Apps Script frontend only", value: "frontend" },
    ],
    initial: 0,
  };

  const deploymentResponse = await prompts(deploymentChoicePrompt);

  if (!deploymentResponse.deploymentOption) {
    console.log("Deployment option selection cancelled. Exiting.");
    return;
  }

  const deploymentOption = deploymentResponse.deploymentOption;

  // Configure and deploy GCP components if 'all' or 'backend' is chosen
  if (deploymentOption === "all" || deploymentOption === "backend") {
    const gcpPrompts = [
      {
        type: "text" as const,
        name: "gcpProjectId",
        message: `Enter your GCP Project ID [${
          config.gcpProjectId || "None"
        }]:`,
        initial: config.gcpProjectId || undefined, // prompts expects undefined for no initial, not null
        validate: (value: string) => (!value ? "Required" : true),
      },
      {
        type: "text" as const,
        name: "gcpRegion",
        message: `Enter a GCP region for the 'pva-lite' service to run in [${config.gcpRegion}]:`,
        initial: config.gcpRegion,
      },
      {
        type: "text" as const,
        name: "gcsLocation",
        message: `Enter a GCS location to store videos in (can be multi-region like 'us' or 'eu' or single region like 'us-central1' or 'europe-west4') [${config.gcsLocation}]:`,
        initial: config.gcsLocation,
      },
      {
        type: "text" as const,
        name: "pubsubTopic",
        message: `Enter a Pub/Sub Topic name [${config.pubsubTopic}]:`,
        initial: config.pubsubTopic,
      },
    ];

    const gcpConfigResponse = await prompts(gcpPrompts);

    // Check if user cancelled GCP prompts (gcpProjectId is required)
    if (!gcpConfigResponse.gcpProjectId) {
      console.log("GCP configuration cancelled. Exiting.");
      return;
    }

    UserConfigManager.setUserConfig(gcpConfigResponse);
    await GcpDeploymentHandler.checkGcloudAuth();
    GcpDeploymentHandler.deployGcpComponents();
  }

  // Create and deploy Apps Script project if 'all' or 'frontend' is chosen
  if (deploymentOption === "all" || deploymentOption === "frontend") {
    await AppsScriptDeploymentHandler.createScriptProject();
    AppsScriptDeploymentHandler.deployAppsScript();
    AppsScriptDeploymentHandler.printProjectLinks();
  }
})();
