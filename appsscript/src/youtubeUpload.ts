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

import { GcsApi } from './gcsApi';

/**
 * Transfers a file from Cloud Storage to YouTube.
 * @param bucket
 * @param sourcePath
 * @param channelId
 * @param title
 * @param description
 * @returns
 */
export function uploadFromGcs(
  bucket: string,
  sourcePath: string,
  channelId: string,
  title: string,
  description: string
): GoogleAppsScript.YouTube.Schema.Video {
  const gcs = new GcsApi(bucket);
  const response = gcs.getFile(sourcePath);
  const blob = response.getBlob();
  const newVideoData = YouTube.newVideo();
  const snippet = {
    title: title,
    description: description,
    channelId: channelId,
  };
  newVideoData.snippet = snippet;
  const videoData = YouTube.Videos?.insert(newVideoData, 'snippet,id', blob);
  if (videoData === undefined) {
    throw new Error(`Failed to upload video from gs://${bucket}/${sourcePath}`);
  }
  return videoData;
}
