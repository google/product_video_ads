# Copyright 2016 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from io import BytesIO
import json
import logging
import os
import pickle
import traceback
import uuid

from io import BytesIO
from flask import Flask, session, request, render_template, redirect, send_file
from google_auth_oauthlib.flow import InstalledAppFlow

API_SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/devstorage.read_write'
]

app = Flask(__name__)
app.secret_key = os.urandom(24)

# Memory store to flows
flows = {}


@app.route('/', methods=['GET', 'POST'])
def authenticate():

  error = ''
  success = ''

  global flows

  # From query
  code = request.args.get('code')

  try:
    if code is not None:

      user_uuid = session.get('user_uuid')

      flow = flows.pop(user_uuid)
      flow.fetch_token(code=code)

      flows[user_uuid] = pickle.dumps(flow.credentials)
      success = True

    # Receiving secrets from upload
    if request.method == 'POST':

      # Read uploaded file
      if 'auth' in request.files:

        # Read secret file
        secrets = json.loads(request.files['auth'].read())

        # Starts flow and get auth URL
        flow = InstalledAppFlow.from_client_config(secrets, API_SCOPES)
        flow.redirect_uri = request.host_url[:-1]
        auth_url, _ = flow.authorization_url(prompt='consent')

        # Save flow to that user with uuid session key
        user_uuid = str(uuid.uuid4())
        flows[user_uuid] = flow
        session['user_uuid'] = user_uuid

        return redirect(auth_url)

  except Exception as e:
    error = traceback.format_exc()

  return render_template('index.html', error=error, success=success)


@app.route('/download', methods=['GET'])
def download_token():

  global flows

  buffer = BytesIO()
  buffer.write(flows.get(session.get('user_uuid')))
  buffer.seek(0)

  return send_file(buffer, as_attachment=True, attachment_filename='token')


@app.errorhandler(500)
def server_error():
  logging.exception('An error occurred during a request.')
  return 'An internal error occurred.', 500
