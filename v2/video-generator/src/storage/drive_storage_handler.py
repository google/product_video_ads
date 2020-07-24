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

"""The Drive Storage Handler encapsulates all interaction with drive."""

import io
import os
from datetime import datetime

from apiclient.http import MediaFileUpload
from apiclient.http import MediaIoBaseDownload
from googleapiclient.discovery import build

import log


class DriveStorageHandler():

  TMP_FOLDER = '/tmp/video-generator'
  FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder'
  TRACKED_FOLDERS = ['base_videos', 'fonts']

  PREVIEW_FOLDER = 'preview'
  PREVIEW_FOLDER_ID = None

  logger = log.getLogger()

  def __init__(self, drive_folder, credentials):

    # Init drive API
    self.drive = build('drive', 'v3', credentials=credentials)
    self.drive_folder = drive_folder

    # Starts updating all files
    self.last_update = None

    # Create temp folder if not exists
    if not os.path.exists(self.TMP_FOLDER):
      os.makedirs(self.TMP_FOLDER)

    if self.PREVIEW_FOLDER_ID is None:
      self._find_preview_folder_id()

    self.logger.info('Drive storage handler initialized to %s', drive_folder)

  def upload_to_preview(self, output_file_path):

    title = output_file_path.split('/')[-1]

    file_metadata = {
        'name': title,
        'parents': [self.PREVIEW_FOLDER_ID]
    }

    media = MediaFileUpload(output_file_path,
                            mimetype='video/mp4',
                            resumable=True)

    file = self.drive.files().create(body=file_metadata,
                                        media_body=media,
                                        fields='id').execute()

    self.logger.info('Uploaded preview video %s to drive preview folder', title)

    return file.get('id')

  def update_local_files(self, folder_id=None):

    if folder_id is None:
      folder_id = self.drive_folder

    page_token = None

    while True:
      response = self._retrieve_files_from_drive_folder(folder_id, page_token)

      # Loop through all files in this page
      for file in response.get('files', []):

        # File metadata
        file_id = file.get('id')
        name = file.get('name')
        modifiedTime = file.get('modifiedTime')
        mimeType = file.get('mimeType')

        # Recurse to all folders
        if mimeType == self.FOLDER_MIME_TYPE:
          if name in self.TRACKED_FOLDERS:
            self.update_local_files(file_id)
        else:
          try:
            self._update_file(file_id, name, modifiedTime)
          except Exception as e:
            self.logger.info('File %s NOT downloaded (it is probably NOT binary)', name)

      # Go to next file page
      page_token = response.get('nextPageToken', None)

      if page_token is None:
          break

    # Save time for next update
    if folder_id == self.drive_folder:
      self.last_update = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.000Z')

  def _update_file(self, file_id, name, modifiedTime):

    absolute_file_path = self.get_absolute_path(name)

    # If it`s a new file or has been modified, download it
    if self._should_reload_file(os.path.exists(absolute_file_path), modifiedTime):

      # Downloads file to disk
      request = self.drive.files().get_media(fileId=file_id)
      fh = io.FileIO(absolute_file_path, 'wb')
      downloader = MediaIoBaseDownload(fh, request)
      done = False
      while done is False:
        status, done = downloader.next_chunk()

      self.logger.info('Downloaded file %s modified on %s', name, modifiedTime)

  def _should_reload_file(self, exists, modifiedTime):

    if (not exists) or (self.last_update is None):
      return True

    return self.last_update < modifiedTime

  def _retrieve_files_from_drive_folder(self, folder_id, page_token):
    return self.drive.files().list(q=("'%s' in parents and trashed = false" % folder_id),
                                   spaces='drive',
                                   fields='nextPageToken, \
                                   files(id, name, modifiedTime, mimeType)',
                                   pageToken=page_token).execute()

  def _find_preview_folder_id(self):

    self.logger.info('Finding preview folder...')

    response = self._retrieve_files_from_drive_folder(self.drive_folder, None)

    # Loop through all files in this page
    for file in response.get('files', []):

      # File metadata
      file_id = file.get('id')
      name = file.get('name')
      mime = file.get('mimeType')

      if mime == self.FOLDER_MIME_TYPE and name == self.PREVIEW_FOLDER:
        self.PREVIEW_FOLDER_ID = file_id
        self.logger.info('Preview folder found: %s', file_id)
        return

    self.logger.error('Preview folder not found - this can be a problem!')

  def delete_file(self, file_path):
    os.remove(file_path)
    self.logger.info('Deleting local file %s', file_path)

  def get_absolute_path(self, file_name):
    """Gives the absolute path for any file."""
    return os.path.join(self.TMP_FOLDER, file_name)

  def get_absolute_output_video_path(self, id, output_video_path):
    """Gives the absolute output video path for relative path in the project's directory."""

    absolute_output_path = os.path.join(self.TMP_FOLDER, id)

    # Case it is first video
    if not os.path.exists(absolute_output_path):
      os.makedirs(absolute_output_path)

    return os.path.join(absolute_output_path, output_video_path)
