# Experimental UCAN Bridge

This is a prototype of a two possible bridging patterns from HTML/HTTP to w3up

## Getting Started

### "Trusted" Bridge

The bridge at `/` requires a "principal" to be configured with a private key.

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

### "Trustless" Bridge

The bridge at `/trustless` does not require a principal. 

You can use the `w3` command to generate a "coupon" that will be multibase base64 encoded:

```sh
w3 coupon create did:key:yourSpaceDIDHere --can upload/list -o coupon.ucan --password pickYourOwnSecretPassword
```

You can choose `coupon.ucan` in the `Authorization` filepicker on the bridge page. Use the password you chose
in the `coupon` command as the `Secret` on the bridge page.

Finally choose an ability and specify a space and inputs as described above.