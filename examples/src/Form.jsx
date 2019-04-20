import React from 'react';
import Input from './Input';

import { useForm, defineValidations } from '../../src';

defineValidations({
  presence(value) {
    if (!value) {
      return "Can't be blank";
    }
  }
})

export default function Form() {
  const { $, get, set, validate } = useForm({}).withValidation({
    'name': 'presence',
    'item.id': 'presence'
  });

  const reset = () => set({});

  return (
    <>
      <div>
        <Input {...$('name')} placeholder="Username" />
      </div>
      <div>
        <Input {...$('item.id')} placeholder="Item ID" />
      </div>
      <div>
        <Input {...$('item.count')} placeholder="Item Count" />
      </div>
      <button onClick={reset}>Reset</button>
      <button onClick={validate}>Submit</button>

      <div>{ JSON.stringify(get()) }</div>
    </>
  );
}
