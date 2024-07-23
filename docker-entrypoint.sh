#!/bin/sh


JSON_STRING='window.configs = { \
  "appBuilder":"'"${appBuilder}"'", \
  "restClientService":"'"${restClientService}"'", \
  "restBackendService":"'"${restBackendService}"'", \
}'
sed -i "s@// CONFIGURATIONS_PLACEHOLDER@${JSON_STRING}@" /usr/share/nginx/html/index.html

exec "$@"