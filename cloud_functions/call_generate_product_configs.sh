#!/bin/bash
curl -m 70 -X POST https://europe-west1-rd-ytpva-prod61-dev-8aab.cloudfunctions.net/generate_product_configs \
-H "Authorization: bearer $(gcloud auth print-identity-token)"

