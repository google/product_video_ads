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

"""Manages long-running video processing jobs in a pool of IO-bound threads.

from concurrent.futures import ThreadPoolExecutor
import log
import traceback

logger = log.getLogger()


def process_tasks(tasks, max_workers=1):

  logger.info('About to process %s tasks with %s workers',
              len(tasks), max_workers)

  with ThreadPoolExecutor(max_workers=int(max_workers)) as executor:
    for task in tasks:
      executor.submit(task)

  logger.info('All %s tasks completed!', len(tasks))
"""
