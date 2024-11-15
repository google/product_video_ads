/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

declare namespace GoogleCloud {
  export namespace Storage {
    // see https://cloud.google.com/storage/docs/json_api/v1/objects#resource-representations
    interface Object {
      kind: string;
      id: string;
      selfLink: string;
      mediaLink: string;
      name: string;
      bucket: string;
      generation: long;
      metageneration: long;
      contentType: string;
      storageClass: string;
      size: number;
      softDeleteTime?: string;
      hardDeleteTime?: string;
      md5Hash: string;
      contentEncoding?: string;
      contentDisposition?: string;
      contentLanguage?: string;
      cacheControl?: string;
      crc32c: string;
      componentCount?: integer;
      etag: string;
      kmsKeyName?: string;
      temporaryHold?: boolean;
      eventBasedHold?: boolean;
      retentionExpirationTime?: string;
      retention?: {
        retainUntilTime: string;
        mode: string;
      };
      timeCreated: string;
      updated: string;
      timeDeleted?: string;
      timeStorageClassUpdated: string;
      customTime?: string;
      metadata?: Record<string, string>;
      acl?: ObejctAccessControl[];
      owner?: {
        entity: string;
        entityId: string;
      };
      customerEncryption?: {
        encryptionAlgorithm: string;
        keySha256: string;
      };
    }
    // see https://cloud.google.com/storage/docs/json_api/v1/objectAccessControls#resource
    interface ObejctAccessControl {
      kind: string;
      object: string;
      generation: long;
      id: string;
      selfLink: string;
      bucket: string;
      entity: string;
      role: string;
      email: string;
      domain: string;
      entityId: string;
      etag: string;
      projectTeam: {
        projectNumber: string;
        team: string;
      };
    }
  }
}
