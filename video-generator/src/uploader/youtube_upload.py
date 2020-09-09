# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import http.client
import random
import time

import httplib2
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload

import log

# Explicitly tell the underlying HTTP transport library not to retry, since
# we are handling retry logic ourselves.
httplib2.RETRIES = 1

# Maximum number of times to retry before giving up.
MAX_RETRIES = 10

# Always retry when these exceptions are raised.
RETRIABLE_EXCEPTIONS = (httplib2.HttpLib2Error, IOError, http.client.NotConnected,
                        http.client.IncompleteRead, http.client.ImproperConnectionState,
                        http.client.CannotSendRequest, http.client.CannotSendHeader,
                        http.client.ResponseNotReady, http.client.BadStatusLine)

# Always retry when an apiclient.errors.HttpError with one of these status
# codes is raised.
RETRIABLE_STATUS_CODES = [500, 502, 503, 504]


class YoutubeUploader():
    logger = log.getLogger()

    def __init__(self, credentials):
        self.youtube = build('youtube', 'v3', credentials=credentials,
                             cache_discovery=False)

        self.logger.info('Youtube Video uploader initiated...')

    # This method implements an exponential backoff strategy to resume a
    # failed upload.
    def resumable_upload(self, insert_request):
        response = None
        error = None
        retry = 0
        while response is None:
            try:
                status, response = insert_request.next_chunk()
                if "id" in response:
                    self.logger.info("Video id '%s' was successfully uploaded.", response["id"])
                    error = None
                else:
                    self.logger.error("The upload failed with an unexpected response: %s",
                                      response)
                    return None
            except HttpError as e:
                if e.resp.status in RETRIABLE_STATUS_CODES:
                    error = "A retriable HTTP error %d occurred:\n%s" % (e.resp.status,
                                                                         e.content)
                else:
                    raise
            except RETRIABLE_EXCEPTIONS as e:
                error = "A retriable error occurred: %s" % e

            if error is not None:
                self.logger.error(error)
                retry += 1
                if retry > MAX_RETRIES:
                    self.logger.error("No longer attempting to retry.")
                    return None

                max_sleep = 2 ** retry
                sleep_seconds = random.random() * max_sleep
                self.logger.info("Sleeping %f seconds and then retrying...", sleep_seconds)
                time.sleep(sleep_seconds)

        return response["id"]

    def upload_video(self, name, description, visibility, output_file_path):

        body = dict(
            snippet=dict(
                title=name,
                description=description
            ),
            status=dict(privacyStatus=visibility))

        # Call the API's videos.insert method to create and upload the video.
        insert_request = self.youtube.videos().insert(
            part=",".join(list(body.keys())),
            body=body,
            # The chunksize parameter specifies the size of each chunk of data, in
            # bytes, that will be uploaded at a time. Set a higher value for
            # reliable connections as fewer chunks lead to faster uploads. Set a lower
            # value for better recovery on less reliable connections.
            #
            # Setting "chunksize" equal to -1 in the code below means that the entire
            # file will be uploaded in a single HTTP request. (If the upload fails,
            # it will still be retried where it left off.) This is usually a best
            # practice, but if you're using Python older than 2.6 or if you're
            # running on App Engine, you should set the chunksize to something like
            # 1024 * 1024 (1 megabyte).
            media_body=MediaFileUpload(
                output_file_path, chunksize=-1, resumable=True))

        self.logger.info("Uploading file: %s", output_file_path)

        return self.resumable_upload(insert_request)
