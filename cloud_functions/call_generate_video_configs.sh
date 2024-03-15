#!/bin/bash
curl -m 70 -X POST https://europe-west1-rd-ytpva-prod61-dev-8aab.cloudfunctions.net/generate_video_configs \
-H "Authorization: bearer $(gcloud auth print-identity-token)" \
-H "Content-Type: application/json" \
-d '{
  "offers_json_file": "gs://wam-hop-prod-offers/2024/10/offers.json",
  "ranking_json_file": "gs://wam-wmps-prod-hop-ranking/2024/10/ranking.json"
}'