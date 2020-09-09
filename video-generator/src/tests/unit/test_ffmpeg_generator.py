from ffmpeg.ffmpeg_generator import FFMPEGGenerator


def test_resize_images_png():
    FFMPEGGenerator().resize_images('test.png', 'test.png', 100, 100, True)
    assert True


def test_resize_images_jpg():
    FFMPEGGenerator().resize_images('test.jpg', 'test.jpg', 100, 100, True)
    assert True
