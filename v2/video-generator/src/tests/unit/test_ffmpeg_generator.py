from ffmpeg.ffmpeg_generator import FFMPEGGenerator


def test_resize_images():
    FFMPEGGenerator().resize_images('test.png', 'test.png', 100, 100, True)
    assert True
