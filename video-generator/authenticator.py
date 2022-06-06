#!/usr/bin/env python
#
# Copyright 2014 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Generates refresh token for AdWords using the Installed Application flow."""

import argparse
import sys

import pickle
from urllib import parse
from google_auth_oauthlib.flow import InstalledAppFlow
from oauthlib.oauth2.rfc6749.errors import InvalidGrantError

SCOPES = ['https://www.googleapis.com/auth/content',
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/devstorage.read_write']

# The redirect URI set for the given Client ID. The redirect URI for Client ID
# generated for an installed application will always have this value.
_REDIRECT_URI = 'http://localhost:8080'

class ClientConfigBuilder(object):
    """Helper class used to build a client config dict used in the OAuth 2.0 flow.
    """
    _DEFAULT_AUTH_URI = 'https://accounts.google.com/o/oauth2/auth'
    _DEFAULT_TOKEN_URI = 'https://accounts.google.com/o/oauth2/token'
    CLIENT_TYPE_WEB = 'web'
    CLIENT_TYPE_INSTALLED_APP = 'installed'

    def __init__(self, client_type=None, client_id=None, client_secret=None,
                 auth_uri=_DEFAULT_AUTH_URI, token_uri=_DEFAULT_TOKEN_URI):
        self.client_type = client_type
        self.client_id = client_id
        self.client_secret = client_secret
        self.auth_uri = auth_uri
        self.token_uri = token_uri

    def Build(self):
        """Builds a client config dictionary used in the OAuth 2.0 flow."""
        if all((self.client_type, self.client_id, self.client_secret,
                self.auth_uri, self.token_uri)):
            client_config = {
                self.client_type: {
                    'client_id': self.client_id,
                    'client_secret': self.client_secret,
                    'auth_uri': self.auth_uri,
                    'token_uri': self.token_uri
                }
            }
        else:
            raise ValueError('Required field is missing.')

        return client_config


def main(client_id, client_secret, scopes):
    """Retrieve and display the access and refresh token."""
    client_config = ClientConfigBuilder(
        client_type=ClientConfigBuilder.CLIENT_TYPE_WEB, client_id=client_id,
        client_secret=client_secret)

    flow = InstalledAppFlow.from_client_config(
        client_config.Build(), scopes=scopes)
    # Note that from_client_config will not produce a flow with the
    # redirect_uris (if any) set in the client_config. This must be set
    # separately.
    flow.redirect_uri = _REDIRECT_URI

    auth_url, _ = flow.authorization_url(prompt='consent')

    print('Log into the Google Account you use to access your MerchantCenter account '
          'and go to the following URL: \n%s\n' % auth_url)
    print('After approving the token copy and paste the full URL.')
    url = input('URL: ').strip()
    code = parse.parse_qs(parse.urlparse(url).query)['code'][0]

    try:
        flow.fetch_token(code=code)
    except InvalidGrantError as ex:
        print('Authentication has failed: %s' % ex)
        sys.exit(1)

    print('Access token: %s' % flow.credentials.token)
    print('Refresh token: %s' % flow.credentials.refresh_token)
    with open('token', 'wb') as token_file:
        token_file.write(pickle.dumps(flow.credentials))

if __name__ == '__main__':
    #args = parser.parse_args()
    configured_scopes = SCOPES
    client_id = input('Desktop Client ID: ')
    client_secret = input('Desktop Client Secret: ')
    if not (client_id and client_secret):
        raise AttributeError('No client_id or client_secret specified.')
    main(client_id, client_secret, configured_scopes)
