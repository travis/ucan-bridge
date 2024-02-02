# Experimental UCAN Bridge

This is a prototype of a bridge from HTML/HTTP to w3up

## Getting Started

Copy .env.tmpl to .env.local and use `ucan-key` to generate a bridge private key and DID:

```sh
npx ucan-key ed
# add the private key to .env.local and use the DID to create a delegation
```

Next, use the DID you just generate to create a delegation to the bridge DID with the `w3` command:

```sh
w3 delegation create did:key:yourBridgeDidHere --can 'upload/list' --base64
```

Plug the resulting value in to the "Authorization" field of the form on the home page.

Choose an ability to invoke and specify the space to invoke it upon (it should be the same
space you had selected when you ran the `w3 delegation create` command above).

Finally, specify the inputs as JSON.