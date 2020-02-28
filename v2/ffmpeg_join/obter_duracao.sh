#!/bin/bash
ffprobe -i partes/$1.mp4 -show_format -v quiet | sed -n 's/duration=//p' | xargs printf %.2f
