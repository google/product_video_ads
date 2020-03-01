#!/bin/bash

shopt -s extglob

cd src

cat Main.gs > script.js
cat -- !(Main).gs >> script.js

cd ..
mv src/script.js .

gsutil cp -r * gs://product-video-ads/adscripts/