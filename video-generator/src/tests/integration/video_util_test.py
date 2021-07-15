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

import os
from mock import Mock, patch
from ffmpeg import util
import imghdr


def test_download_image_to_file():

    url = 'https://www.casasbahia-imagens.com.br/Control/ArquivoExibir.aspx?IdArquivo=1104363482'

    tmp_image = 'img.tmp'

    util._download_image_to_file(url, tmp_image, Mock())

    # Obtain image size and delete it
    image_size = os.stat(tmp_image).st_size

    extension = imghdr.what(tmp_image)

    print('Extension: %s and size %s' % (extension, image_size))

    os.remove(tmp_image)

    # Check if image has any bytes
    assert image_size > 0
