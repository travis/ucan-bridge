import { NextRequest, NextResponse } from "next/server";
import { create as createW3UPClient } from '@web3-storage/w3up-client'
import * as Store from '@web3-storage/capabilities/store'
import * as Upload from '@web3-storage/capabilities/upload'
import { base64 } from 'multiformats/bases/base64'
import { CID } from 'multiformats/cid'
import { identity } from 'multiformats/hashes/identity'
import * as Signer from '@ucanto/principal/ed25519'
import * as Ucanto from '@ucanto/interface'
import { createServiceConf } from '../service'
import { StoreMemory } from "@web3-storage/w3up-client/stores"
import { CarReader } from '@ipld/car/reader'
import { importDAG } from '@ucanto/core/delegation'

const bridgePrincipalPrivateKey = process.env.BRIDGE_PRINCIPAL_PRIVATE_KEY

const abilityNameToAbility: Record<string, Ucanto.TheCapabilityParser<any>> = {
  'store/add': Store.add,
  'upload/add': Upload.add,
  'upload/list': Upload.list
}

async function readProofFromBytes (bytes: Uint8Array) {
  const blocks = []
  const reader = await CarReader.fromBytes(bytes)
  for await (const block of reader.blocks()) {
    blocks.push(block)
  }
  // @ts-expect-error
  return importDAG(blocks)
}

export async function POST (request: NextRequest) {
  try {
    if (!bridgePrincipalPrivateKey) {
      return new NextResponse(
        'BRIDGE_PRINCIPAL_PRIVATE_KEY environment variable is not set',
        { status: 500 })
    }

    const query = await request.formData()

    // get capability to be invoked
    const ability = query.get('ability') as string
    if (!ability) {
      return new NextResponse(
        'ability search parameter is not set',
        { status: 400 })
    }
    const capability = abilityNameToAbility[ability]
    if (!capability) {
      return new NextResponse(
        `could not find capability named ${ability}`,
        { status: 400 })
    }

    // get resource (space) upon which capability will be invoked
    const resource = query.get('resource')
    if (!resource) {
      return new NextResponse(
        `resource search parameter is not set - please set it to the name of the space you want to use`,
        { status: 400 })
    }

    // get inputs (the "nb" field of the invocation)
    const inputs = JSON.parse(query.get('inputs') as string ?? '{}')

    // get delegation from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return new NextResponse(
        `Authorization header is not set - please set it to a base64 encoded Delegation`,
        { status: 400 })
    }
    const cid = CID.parse(authHeader, base64)
    if (cid.multihash.code !== identity.code) {
      return new NextResponse(
        `could not extract delegation from Authorization header`,
        { status: 400 }
      )
    }
    const delegation = await readProofFromBytes(cid.multihash.digest)
    if (!delegation) {
      return new NextResponse(
        `could not extract delegation from Authorization header`,
        { status: 400 }
      )
    }

    // create the client and add the delegation to it
    const client = await createW3UPClient({
      principal: Signer.parse(bridgePrincipalPrivateKey),
      store: new StoreMemory(),
      serviceConf: createServiceConf({})
    })
    await client.addSpace(delegation)

    // invoke and execute the capability
    const receipt = await client.agent.invokeAndExecute(capability, {
      nb: inputs
    })
    const result = receipt.out
    if (result.ok) {
      return NextResponse.json(result.ok)
    } else {
      return new NextResponse(
        `error invoking ${ability}: ${result.error} `,
        { status: 500 }
      )
    }
  } catch (e) {
    console.error(e)
    return new NextResponse(
      `request handler threw an error: ${e}`,
      { status: 500 }
    )
  }
}
