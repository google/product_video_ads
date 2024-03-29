#!/bin/bash

gcloud container node-pools update default-pool --cluster video-generator-cluster --region europe-west1-b --machine-type e2-highcpu-4
# gcloud container clusters resize video-generator-cluster --node-pool default-pool --region europe-west1 --num-nodes 1
kubectl scale deployment video-generator --replicas=4