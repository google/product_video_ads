# Copyright 2020 Google LLC

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     https://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Log handler to write to spreadsheet"""

from logging import StreamHandler

# This handler is initialized on spreadsheet_configuration
class SpreadsheetHandler(StreamHandler):

  LOG_LINES_LIMIT = 50
  
  def __init__(self, callback):
    StreamHandler.__init__(self)
    self.callback = callback
    self.position = 0

  def emit(self, record):
    self.position = (self.position % SpreadsheetHandler.LOG_LINES_LIMIT) + 1
    self.callback(self.format(record), self.position)
