import os
from mock import Mock, patch
from ffmpeg import util


def test_download_image_to_file():

    url = 'https://t-static.dafiti.com.br/CK54mycsP4nuVNXeOu7DPUpHybg=/fit-in/430x623/static.dafiti.com.br/p/vans' \
          '-moletom-fechado-vans-check-piece-crew-preto%2foff-white-8151-3742265-1-zoom.jpg'

    tmp_image = 'img.jpg'

    util._download_image_to_file(url, tmp_image, Mock())

    # Obtain image size and delete it
    image_size = os.stat(tmp_image).st_size
    os.remove(tmp_image)

    # Check if image has any bytes
    assert image_size > 0
