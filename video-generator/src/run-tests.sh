#!/bin/bash

export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8

pipenv run python -m pytest $1
