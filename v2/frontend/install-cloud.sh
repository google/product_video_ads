#!/bin/bash

gsutil cp -r gs://product-video-ads/frontend/dist .
gsutil cp gs://product-video-ads/frontend/app.yaml app.yaml

echo -n 'Type the Client ID: '
read FRONTEND_CLIENT_ID
export FRONTEND_CLIENT_ID=$FRONTEND_CLIENT_ID

echo -n 'Type API Key: '
read FRONTEND_API_KEY
export FRONTEND_API_KEY=$FRONTEND_API_KEY

mv dist/assets/js/env.js dist/assets/js/env.js.orig
envsubst < dist/assets/js/env.js.orig > dist/assets/js/env.js
rm dist/assets/js/env.js.orig

gcloud app deploy