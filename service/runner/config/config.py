# Copyright 2024 Google LLC.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""PVA Lite config.

This module contains all configuration constants and runtime variables used by
PVA Lite.
"""

import os

GCP_PROJECT_ID = os.environ.get('GCP_PROJECT_ID', 'pva-lite')
GCS_BUCKET = os.environ.get('GCS_BUCKET', 'pva-lite-bucket')
PUBSUB_TOPIC = os.environ.get('PUBSUB_TOPC', 'pva-lite')
