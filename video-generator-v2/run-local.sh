#!/bin/bash

CREDENTIALS_FOLDER=/usr/local/google/home/rgodoy/credentials

export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8

export GOOGLE_APPLICATION_CREDENTIALS=$CREDENTIALS_FOLDER/credentials.json
export SPREADSHEET_ID=1p0mGUCP6nIeljP7Gd3hBpWFijfYvm1KC16cYmHxOweQ
export BUCKET_NAME=video-generator

cd src
pipenv run python main.py
