# UCAN Bridge

This is a prototype of a bridge from HTML/HTTP to w3up

## Getting Started

Copy .env.tmpl to .env.local and use `ucan-key` to generate a private key:

```sh
npx ucan-key ed
# add the private key to .env.local and use the DID to create a delegation
```

Next, use the DID you just generate to create a delegation with the `w3` command:

```sh
w3 delegation create did:key:z6MkvAjxkVLVQYzdyqU18a3sTq5TrraGcsWgFmTvohsunCkH --can 'upload/list' --base64
```

Plug the resulting value in to the "Authorization" field of the form on the home page.