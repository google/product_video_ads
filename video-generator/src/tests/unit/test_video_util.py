from mock import Mock, patch
from pytest import fixture

from video import util

def test_convert_text_overlay_for_title_multiline():

  config = {
      'field': 'Title',
      'x': '200',
      'y': '400',
      'start_time': 3,
      'end_time': 10,
      'font': 'Roboto.ttf',
      'font_color': '#FF0000',
      'font_size': '10',
      'width': '100'
  }

  product_data = {
      'title': 'nice product with a very very long title',
      'price': 120
  }

  storage = Mock()
  storage.get_absolute_path.return_value = 'abs/path/'

  title_overlay_list = util.convert_text_overlay(config, product_data, storage)

  #for a in title_overlay_list:
  #  print a
  #assert 1==2


def test_convert_text_overlay_for_title():

  config = {
      'field': 'Title',
      'x': 200,
      'y': 400,
      'start_time': 3,
      'end_time': 10,
      'font': 'Roboto.ttf',
      'font_color': '#FF0000',
      'font_size': '30'
  }

  product_data = {
      'title': 'nice product',
      'price': 120
  }

  storage = Mock()
  storage.get_absolute_path.return_value = 'abs/path/'

  title_overlay_list = util.convert_text_overlay(config, product_data, storage)

  title_overlay = title_overlay_list[0]

  assert title_overlay['text'] == product_data['title']
  assert title_overlay['x'] == config['x']
  assert title_overlay['y'] == config['y']
  assert title_overlay['start_time'] == config['start_time']
  assert title_overlay['end_time'] == config['end_time']
  assert title_overlay['font'] == 'abs/path/'
  assert title_overlay['font_color'] == config['font_color']
  assert title_overlay['font_size'] == config['font_size']


def test_convert_text_overlay_for_price():

  config = {
      'field': 'Price',
      'x': 200,
      'y': 400,
      'start_time': 3,
      'end_time': 10,
      'font': 'Roboto.ttf',
      'font_color': '#FF0000',
      'font_size': '30'
  }

  product_data = {
      'title': 'nice product',
      'price': 120
  }

  storage = Mock()
  storage.get_absolute_path.return_value = 'abs/path/'

  title_overlay_list = util.convert_text_overlay(config, product_data, storage)

  title_overlay = title_overlay_list[0]

  assert title_overlay['text'] == product_data['price']
  assert title_overlay['x'] == config['x']
  assert title_overlay['y'] == config['y']
  assert title_overlay['start_time'] == config['start_time']
  assert title_overlay['end_time'] == config['end_time']
  assert title_overlay['font'] == 'abs/path/'
  assert title_overlay['font_color'] == config['font_color']
  assert title_overlay['font_size'] == config['font_size']


@patch('video.util.urllib')
def test_convert_image_overlay(mock_urllib):

  config = {
      'product': '1000023',
      'field': 'Image',
      'x': 200,
      'y': 400,
      'start_time': 3,
      'end_time': 10,
      'width': 30,
      'height': 30
  }

  product_data = {
      'title': 'nice product',
      'price': 120,
      'image': 'http://my-product/image.jpg'
  }

  storage = Mock()
  storage.get_absolute_path.return_value = 'abs/path/'

  title_overlay = util.convert_image_overlay(config, product_data, storage)

  assert title_overlay['image'] == 'abs/path/'
  assert title_overlay['x'] == config['x']
  assert title_overlay['y'] == config['y']
  assert title_overlay['start_time'] == config['start_time']
  assert title_overlay['end_time'] == config['end_time']
  assert title_overlay['width'] == config['width']
  assert title_overlay['height'] == config['height']
