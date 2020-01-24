FROM python:2.7-alpine

# Unzip and ImageMagick dependencies
RUN apk update && apk add unzip imagemagick==7.0.8.58-r0

# Create empty folder to custom credentials mapping
RUN mkdir -p /credentials

# Application code
ADD src/ /usr/src/app

# Zip with ffmpeg binary
ADD ffmpeg_latest.zip /
RUN unzip /ffmpeg_latest.zip -d /usr/src/app

# Install app
WORKDIR /usr/src/app

RUN pip install pipenv
RUN pipenv install --ignore-pipfile

ENTRYPOINT [ "pipenv", "run", "python", "main.py" ]
