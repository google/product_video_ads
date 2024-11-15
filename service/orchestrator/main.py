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

"""PVA Lite Orchestrator module.

This file is the target of a "Cloud Storage" Trigger (Finalize/Create) Cloud
Function, with `gcs_file_uploaded` as the main entry point.
"""

import json
import logging
import os
import pathlib
from concurrent import futures
from typing import Any, Callable, Collection, Dict

import functions_framework
from google.cloud import logging as cloudlogging
from google.cloud import pubsub_v1, storage


def get_callback(
    publish_future: pubsub_v1.publisher.futures.Future, data: str
) -> Callable[[pubsub_v1.publisher.futures.Future], None]:
  """Gets a callback function to check the status of message publishing.

    Args:
        publish_future (pubsub_v1.publisher.futures.Future): Future object to
          check write status.
        data (str): Data sent to the topic.


    Returns:
        Callable[[pubsub_v1.publisher.futures.Future], None]: A callback
          function.
    """

  def callback(publish_future: pubsub_v1.publisher.futures.Future) -> None:
    try:
      # Wait 60 seconds for the publish call to succeed.
      print(publish_future.result(timeout=60))
    except futures.TimeoutError:
      logging.error("Publishing %s timed out.", data)

  return callback


def publish_messages(
    publisher: pubsub_v1.PublisherClient, topic_path: str,
    messages: Collection[str]
) -> None:
  """Publishes messages to a Pub/Sub topic.


    Args:
        publisher (pubsub_v1.PublisherClient): The PubSub publisher client.
        topic_path (str): Pub/Sub topic path.
        messages (Collection[str]): A collection of messages to publish.
    """
  logging.info("BEGIN - Writing messages to topic: %s...", topic_path)
  for message_id, message_body in enumerate(messages):
    logging.info("Writing Message %d ...", message_id)
    # When you publish a message, the client returns a future.
    publish_future = publisher.publish(topic_path, message_body.encode("utf-8"))
    # Non-blocking. Publish failures are handled in the callback function.
    publish_future.add_done_callback(get_callback(publish_future, message_body))
    publish_futures = []
    publish_futures.append(publish_future)

  # Wait for all the publish futures to resolve before exiting.
  futures.wait(publish_futures, return_when=futures.ALL_COMPLETED)

  logging.info(
      "END - Published %d messages to topic: %s...", len(messages), topic_path
  )


@functions_framework.cloud_event
def gcs_file_uploaded(cloud_event: Dict[str, Any]):
  """Triggered by a change in a storage bucket.

    Args:
      cloud_event: The Eventarc trigger event.
    """

  lg_client = cloudlogging.Client()
  lg_client.setup_logging()

  data = cloud_event.data
  filepath = data["name"]
  logging.info("Config path: %s", filepath)

  if filepath.endswith("config.json"):
    logging.info("BEGIN - Processing uploaded file: %s...", filepath)
    config_folder_path = str(
        pathlib.Path(os.path.splitext(filepath)[0]).parents[0]
    )
    # Read the config file from GCS
    storage_client = storage.Client()
    bucket = storage_client.get_bucket(data["bucket"])
    blob = bucket.blob(filepath)
    config_data = json.loads(blob.download_as_string())
    logging.info("END - Finished processing uploaded file: %s.", filepath)

    # Write to PubSub topic.
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(
        os.environ["GCP_PROJECT_ID"], os.environ["PUBSUB_TOPIC"]
    )
    messages = []
    for video_config in config_data:
      video_config["output_path"] = config_folder_path
      messages.append(json.dumps(video_config))
    publish_messages(publisher, topic_path, messages)
