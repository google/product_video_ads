#!/bin/bash

ng build --configuration=production

gsutil cp -r dist/ gs://product-video-ads/frontend/
gsutil cp app.yaml gs://product-video-ads/frontend/
gsutil cp install-cloud.sh gs://product-video-ads/frontend/