FROM python:3.7.11-alpine3.14

# Unzip and ImageMagick dependencies
RUN apk update && apk add unzip imagemagick==7.0.11.14-r1

# FFMPEG dependencies
RUN apk update && apk add ffmpeg-libs==4.4.1-r0 ffmpeg==4.4.1-r0

# Create empty folder to custom credentials mapping
RUN mkdir -p /credentials

# Application code
ADD src/ /usr/src/app
ADD token /usr/src/app/token

# Install app
WORKDIR /usr/src/app

RUN pip install pipenv
RUN pipenv install --ignore-pipfile

ENTRYPOINT [ "pipenv", "run", "python", "main.py" ]
