#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

if [[ ! -f private.key ]] ; then
  openssl genrsa \
    -out private.key 2048
fi

if [[ ! -f private.csr ]] ; then
  openssl req \
    -new \
    -sha256 \
    -out private.csr \
    -key private.key \
    -config ssl.conf
fi

openssl x509 \
  -req \
  -days 3650 \
  -in private.csr \
  -signkey private.key \
  -out private.crt \
  -extensions req_extensions \
  -extfile ssl.conf

sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain private.crt
