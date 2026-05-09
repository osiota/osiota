#!/bin/bash

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

cd "${SCRIPT_DIR}" || exit 127


OSIOTA_VERSION="$(jq -r .version ../package.json)"

PACKAGE_NEW="$(jq \
  --arg version "${OSIOTA_VERSION}" \
  '.dependencies.osiota = $version' \
  "src/package.json"
)"

echo "${PACKAGE_NEW}" > "src/package.json"

cd src/ || exit 127

npm install
