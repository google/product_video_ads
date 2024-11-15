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

const fs = require("fs-extra");
const os = require("os");
const path = require("path");
const replace = require("replace");
const spawn = require("cross-spawn");

export const DEFAULT_GCP_REGION = "us-central1";
export const DEFAULT_GCS_LOCATION = "us";
export const DEFAULT_PUBSUB_TOPIC = "pva-lite";
const GCS_BUCKET_NAME_SUFFIX = "-bucket";

interface ConfigReplace {
  regex: string;
  replacement: string;
  paths: string[];
}

export interface PromptsResponse {
  gcpProjectId: string;
  gcpRegion?: string;
  gcsLocation?: string;
  pubsubTopic?: string;
}

class ClaspManager {
  private static async isLoggedIn() {
    return await fs.exists(path.join(os.homedir(), ".clasprc.json"));
  }

  static async login() {
    const loggedIn = await this.isLoggedIn();

    if (!loggedIn) {
      console.log("Logging in via clasp...");
      spawn.sync("clasp", ["login"], { stdio: "inherit" });
    }
  }

  static async isConfigured(rootDir: string) {
    return (
      (await fs.exists(path.join(rootDir, ".clasp-dev.json"))) ||
      (await fs.exists(path.join(rootDir, "dist", ".clasp.json")))
    );
  }

  static async alreadyConfiguredSheetLink(rootDir: string) {
    const claspConfig = JSON.parse(
      fs.readFileSync(path.join(rootDir, ".clasp-dev.json"))
    );
    return `https://docs.google.com/spreadsheets/d/${claspConfig.parentId}`;
  }

  static async alreadyConfiguredScriptLink(rootDir: string) {
    const claspConfig = JSON.parse(
      fs.readFileSync(path.join(rootDir, ".clasp-dev.json"))
    );
    return `https://script.google.com/home/projects/${claspConfig.scriptId}`;
  }

  static extractSheetsLink(output: string) {
    const sheetsLink = output.match(/Google Sheet: ([^\n]*)/);

    return sheetsLink?.length ? sheetsLink[1] : "Not found";
  }

  static extractScriptLink(output: string) {
    const scriptLink = output.match(/Google Sheets Add-on script: ([^\n]*)/);

    return scriptLink?.length ? scriptLink[1] : "Not found";
  }

  static async create(
    title: string,
    scriptRootDir: string,
    filesRootDir: string
  ) {
    fs.ensureDirSync(path.join(filesRootDir, scriptRootDir));
    const res = spawn.sync(
      "clasp",
      [
        "create",
        "--type",
        "sheets",
        "--rootDir",
        scriptRootDir,
        "--title",
        title,
      ],
      { encoding: "utf-8" }
    );
    if (res.status !== 0) {
      throw res.error;
    }

    await fs.move(
      path.join(scriptRootDir, ".clasp.json"),
      path.join(filesRootDir, ".clasp-dev.json")
    );
    await fs.copyFile(
      path.join(filesRootDir, ".clasp-dev.json"),
      path.join(filesRootDir, ".clasp-prod.json")
    );
    await fs.remove(path.join(scriptRootDir, "appsscript.json"));
    const output = res.output.join();

    return {
      sheetLink: this.extractSheetsLink(output),
      scriptLink: this.extractScriptLink(output),
    };
  }
}

export class GcpDeploymentHandler {
  static async checkGcloudAuth() {
    const gcloudAuthExists = await fs.exists(
      path.join(os.homedir(), ".config", "gcloud", "credentials.db")
    );
    const gcloudAppDefaultCredsExists = await fs.exists(
      path.join(
        os.homedir(),
        ".config",
        "gcloud",
        "application_default_credentials.json"
      )
    );
    if (!gcloudAuthExists) {
      console.log("Logging in via gcloud...");
      spawn.sync("gcloud auth login", { stdio: "inherit", shell: true });
      console.log();
    }
    if (!gcloudAppDefaultCredsExists) {
      console.log(
        "Setting Application Default Credentials (ADC) via gcloud..."
      );
      spawn.sync("gcloud auth application-default login", {
        stdio: "inherit",
        shell: true,
      });
      console.log();
    }
  }

  static deployGcpComponents() {
    console.log(
      "Deploying the 'pva-lite' service on Cloud Run / Cloud Functions..."
    );
    const res = spawn.sync("npm run deploy-service", {
      stdio: "inherit",
      shell: true,
    });
    if (res.status !== 0) {
      throw new Error("Failed to deploy GCP components.");
    }
  }
}

export class AppsScriptDeploymentHandler {
  static async createScriptProject() {
    console.log();
    await ClaspManager.login();
    const claspConfigExists = await ClaspManager.isConfigured("./appsscript");
    if (!claspConfigExists) {
      console.log("Creating Apps Script Project...");
      await ClaspManager.create("Product Video Ads", "./dist", "./appsscript");
    } else {
      console.log("Using existing Apps Script Project");
    }
    console.log();
  }

  static deployAppsScript() {
    console.log("Deploying Apps Script...");
    spawn.sync("npm run deploy-appsscript", { stdio: "inherit", shell: true });
  }

  static async printProjectLinks() {
    console.log(
      `IMPORTANT -> Apps Script Link: ${await ClaspManager.alreadyConfiguredScriptLink(
        "./appsscript"
      )}.`
    );
    console.log(
      `IMPORTANT -> Google Sheets Link: ${await ClaspManager.alreadyConfiguredSheetLink(
        "./appsscript"
      )}`
    );
  }
}

export class UserConfigManager {
  static alreadyCopiedFiles: string[] = [];

  static getCurrentConfig() {
    if (fs.existsSync(".config.json")) {
      return JSON.parse(fs.readFileSync(".config.json"));
    } else {
      console.log("No config found, using default values");
      return {
        gcpRegion: DEFAULT_GCP_REGION,
        gcsLocation: DEFAULT_GCS_LOCATION,
        pubsubTopic: DEFAULT_PUBSUB_TOPIC,
      };
    }
  }

  static saveConfig(config: any) {
    fs.writeFileSync(".config.json", JSON.stringify(config));
  }

  static setUserConfig(response: PromptsResponse) {
    const configReplace = (config: ConfigReplace) => {
      config.paths.forEach((path: string) => {
        if (!UserConfigManager.alreadyCopiedFiles.includes(path)) {
          console.log(`Copying the template: ${path}.TEMPLATE -> ${path}`);
          fs.copySync(`${path}.TEMPLATE`, path);
          UserConfigManager.alreadyCopiedFiles.push(path);
        }
      });

      replace({
        regex: config.regex,
        replacement: config.replacement,
        paths: config.paths,
        recursive: false,
        silent: true,
      });
    };

    console.log();
    console.log("Setting user configuration...");
    const gcpProjectId = response.gcpProjectId;
    const gcpRegion = response.gcpRegion || DEFAULT_GCP_REGION;
    const gcsLocation = response.gcsLocation || DEFAULT_GCS_LOCATION;
    const gcpProjectIdSanitized = `${gcpProjectId
      .replace("google.com:", "")
      .replace(".", "-")
      .replace(":", "-")}`;
    const gcsBucket = `${gcpProjectIdSanitized}${GCS_BUCKET_NAME_SUFFIX}`;
    const pubSubTopic = response.pubsubTopic || DEFAULT_PUBSUB_TOPIC;

    const config = {
      gcpProjectId: gcpProjectIdSanitized,
      gcpRegion: gcpRegion,
      gcsLocation: gcsLocation,
      pubsubTopic: pubSubTopic,
    };
    this.saveConfig(config);

    configReplace({
      regex: "<gcp-project-id>",
      replacement: gcpProjectId,
      paths: ["./service/deploy-config.sh", "./service/.env.yaml"],
    });

    configReplace({
      regex: "<gcp-region>",
      replacement: gcpRegion,
      paths: ["./service/deploy-config.sh"],
    });

    configReplace({
      regex: "<gcs-location>",
      replacement: gcsLocation,
      paths: ["./service/deploy-config.sh"],
    });

    configReplace({
      regex: "<gcs-bucket>",
      replacement: gcsBucket,
      paths: ["./service/deploy-config.sh", "./service/.env.yaml"],
    });

    configReplace({
      regex: "<pubsub-topic>",
      replacement: pubSubTopic,
      paths: ["./service/.env.yaml", "./service/deploy-config.sh"],
    });
    console.log();
  }
}
