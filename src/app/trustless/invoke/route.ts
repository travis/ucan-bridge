import { NextRequest, NextResponse } from "next/server";
import { create as createW3UPClient } from '@web3-storage/w3up-client'
import * as Store from '@web3-storage/capabilities/store'
import * as Upload from '@web3-storage/capabilities/upload'
import { base64pad } from 'multiformats/bases/base64'
import * as Ucanto from '@ucanto/interface'
import { createServiceConf } from '../../service'
import { StoreMemory } from "@web3-storage/w3up-client/stores"
import * as Delegation from '@ucanto/core/delegation'
import { sha256 } from '@ucanto/core'
import { ed25519 } from '@ucanto/principal'

const abilityNameToAbility: Record<string, Ucanto.TheCapabilityParser<any>> = {
  'store/add': Store.add,
  'upload/add': Upload.add,
  'upload/list': Upload.list
}

const deriveSigner = async (password: string) => {
  const { digest } = await sha256.digest(new TextEncoder().encode(password))
  return await ed25519.Signer.derive(digest)
}

export async function POST (request: NextRequest) {
  try {
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

    // get secret from Secret header
    const secretHeader = request.headers.get('Secret')
    if (!secretHeader) {
      return new NextResponse(
        `Secret header is not set - please set it to your secret`,
        { status: 400 })
    }
    // get delegation from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return new NextResponse(
        `Authorization header is not set - please set it to a base64 encoded Delegation`,
        { status: 400 })
    }
    const delegationResult = await Delegation.extract(base64pad.decode(authHeader))
    if (delegationResult.error) {
      return new NextResponse(
        `could not extract delegation from Authorization header: ${delegationResult.error.message}`,
        { status: 400 }
      )
    }
    const delegation = delegationResult.ok
    // create the client and add the delegation to it
    const client = await createW3UPClient({
      principal: await deriveSigner(secretHeader),
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
