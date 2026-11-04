#!/usr/bin/env bash
# Erzeugt ein selbstsigniertes Zertifikat für HTTPS in der lokalen Entwicklung.
# Aufruf im Ordner backend:  ./scripts/create-dev-certificate.sh <keystore-passwort>
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Aufruf: $0 <keystore-passwort>" >&2
  exit 1
fi

mkdir -p certs
keytool -genkeypair \
  -alias battlepedia \
  -keyalg RSA -keysize 2048 \
  -storetype PKCS12 \
  -keystore certs/keystore.p12 \
  -storepass "$1" \
  -validity 825 \
  -dname "CN=localhost" \
  -ext "SAN=dns:localhost,ip:127.0.0.1"

echo "Zertifikat erstellt: certs/keystore.p12"
