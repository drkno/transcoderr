#!/bin/bash

FILE="[\"${1}\"]"
SERVER="${2-localhost:4300}"

echo "Sending ${FILE} to ${SERVER}..."

curl --header 'Content-Type: application/json' \
     --request POST \
     --data "$FILE" \
     "${SERVER}/api/v1/manual"
