'use client'
import { FormEventHandler, useState } from "react";

interface FormElements extends HTMLFormControlsCollection {
  ability: HTMLSelectElement
  authorization: HTMLInputElement
  resource: HTMLInputElement
  inputs: HTMLInputElement

}
interface InvocationFormElement extends HTMLFormElement {
  // now we can override the elements type to be an HTMLFormControlsCollection
  // of our own design...
  readonly elements: FormElements
}

export default function Home () {
  const [formattedResult, setFormattedResult] = useState('')
  const [resultStatus, setResultStatus] = useState(0)

  const submit: FormEventHandler<InvocationFormElement> = async (e) => {
    e.preventDefault()
    const elements = e.currentTarget.elements
    const result = await fetch('/invoke',
      {
        method: 'POST',
        headers: {
          authorization: elements.authorization.value
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
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>UCAN Bridge</h1>
      <form onSubmit={submit} className='flex flex-col'>
        <label>
          Authorization
          <input type='text' name='authorization' />
        </label>
        <label>
          Ability
          <select name='ability'>
            <option value='upload/list'>upload/list</option>
            <option value='upload/add'>upload/add</option>
            <option value='store/add'>store/add</option>
          </select>
        </label>
        <label>
          Resource
          <input type='text' name='resource' />
        </label>
        <label>
          Inputs
          <textarea name='inputs' />
        </label>
        <input type='submit' value='Submit' />
      </form>
      <div>
        <h1>Result</h1>
        <div>
          <h2>status</h2>
          <p>{resultStatus}</p>
        </div>
        <pre>
          {formattedResult}
        </pre>
      </div>
    </main>
  );
}
