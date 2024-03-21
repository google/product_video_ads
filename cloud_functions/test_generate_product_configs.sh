#!/bin/bash
cat env.yaml | sed 's/: /=/' > .env.tmp
set -a
source .env.tmp
set +a
functions-framework --target=generate_product_configs --debug