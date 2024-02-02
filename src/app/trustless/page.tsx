'use client'
import { FormEventHandler, useState } from "react";
import { base64pad } from 'multiformats/bases/base64'

interface FormElements extends HTMLFormControlsCollection {
  ability: HTMLSelectElement
  secret: HTMLInputElement
  authorization: HTMLInputElement
  resource: HTMLInputElement
  inputs: HTMLInputElement

}
interface InvocationFormElement extends HTMLFormElement {
  // now we can override the elements type to be an HTMLFormControlsCollection
  // of our own design...
  readonly elements: FormElements
}

export default function Trustless () {
  const [formattedResult, setFormattedResult] = useState('')
  const [resultStatus, setResultStatus] = useState(0)

  const submit: FormEventHandler<InvocationFormElement> = async (e) => {
    e.preventDefault()
    const elements = e.currentTarget.elements
    if (!e.currentTarget.elements.authorization.files) throw new Error('upload an authorization file please')
    const authorizationBytes = new Uint8Array(await e.currentTarget.elements.authorization.files[0].arrayBuffer())
    const authorization = base64pad.encode(authorizationBytes)
    const result = await fetch('/trustless/invoke',
      {
        method: 'POST',
        headers: {
          authorization,
          secret: elements.secret.value
        },
        body: new URLSearchParams({
          ability: elements.ability.value,
          resource: elements.resource.value,
          inputs: elements.inputs.value
        })
      })
    setResultStatus(result.status)
    if (result.status === 200) {
      setFormattedResult(JSON.stringify(await result.json(), null, 4))
    } else {
      setFormattedResult(await result.text())
    }
  }
  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-[url('/portland.jpg')] bg-invert bg-cover">
      <div className='w-full bg-white/80 dark:bg-black/80 rounded flex flex-col items-center p-8 flex-grow'>

        <a href='https://www.urbandictionary.com/define.php?term=you+can%27t+get+there+from+here'>
          <h1 className='text-3xl font-bold'>UCAN Get There From Here Without Us!</h1>
        </a>
        <h3 className='mb-6'>A Trustless HTTP-to-UCAN Bridge</h3>
        <form onSubmit={submit} className='flex flex-col w-full space-y-2'>
        <label className='flex flex-row p-4 bg-blue-500/80 rounded'>
            <h4 className='w-36 font-bold uppercase text-sm'>
              Secret
            </h4>
            <input type='text' name='secret' className='dark:bg-black flex-grow p-2 rounded' />
          </label>
          <label className='flex flex-row p-4 bg-blue-500/80 rounded'>
            <h4 className='w-36 font-bold uppercase text-sm'>
              Authorization
            </h4>
            <input type='file' name='authorization' className='dark:bg-black flex-grow p-2 rounded' />
          </label>
          <label className='flex flex-row p-4 bg-blue-500/80 rounded'>
            <h4 className='w-36 font-bold uppercase text-sm'>
              Ability
            </h4>
            <select name='ability' className='dark:bg-black flex-grow p-2 rounded'>
              <option value='upload/list'>upload/list</option>
              <option value='upload/add'>upload/add</option>
              <option value='store/add'>store/add</option>
            </select>
          </label>
          <label className='flex flex-row p-4 bg-blue-500/80 rounded'>
            <h4 className='w-36 font-bold uppercase text-sm'>
              Resource
            </h4>
            <input type='text' name='resource' className='dark:bg-black flex-grow p-2 rounded' />
          </label>
          <label className='flex flex-row p-4 bg-blue-500/80 rounded'>
            <h4 className='w-36 font-bold uppercase text-sm'>
              Inputs
            </h4>
            <textarea name='inputs' className='dark:bg-black flex-grow p-2 rounded' />
          </label>
          <input type='submit' value='Submit' className='bg-blue-500/60 rounded p-4 hover:bg-blue-500/80 cursor-pointer' />
        </form>
        <div className='m-8 rounded p-8 bg-blue-500/80 w-full'>
          <h1 className='font-bold uppercase text-2xl mb-6'>Result</h1>
          <div className='flex flex-row'>
            <h2 className='w-36 font-bold uppercase text-sm'>status</h2>
            <p>{resultStatus}</p>
          </div>
          <pre>
            {formattedResult}
          </pre>
        </div>
      </div>
    </main>
  );
}
