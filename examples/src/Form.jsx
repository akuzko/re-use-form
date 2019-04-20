import React, { useState } from 'react';
import Input from './Input';
import Checkbox from './Checkbox';

import { useForm, defineValidations } from '../../src';

defineValidations({
  presence(value) {
    if (!value) {
      return "Can't be blank";
    }
  }
})

const initialForm = {};

export default function Form() {
  const [loading, setLoading] = useState(false);
  const [withValidation, setWithValidation] = useState(true);
  const {$, get, set, setErrors, submitWith} = useForm(initialForm, withValidation && {
    'name': 'presence',
    'item.id': 'presence'
  });

  const reset = () => set({});

  const changeUsername = value => set('name', value.toUpperCase());

  const save = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setErrors({'item.count': 'Not enough!'});
    }, 2000);
  };

  const submit = withValidation ? submitWith(save) : save;

  return (
    <>
      <div>
        <Checkbox value={ withValidation } onChange={ setWithValidation } label="Client Validation" />
      </div>

      <div>
        <Input { ...$('name', changeUsername) } placeholder="Username" />
      </div>
      <div>
        <Input { ...$('item.id') } placeholder="Item ID" />
      </div>
      <div>
        <Input { ...$('item.count') } placeholder="Item Count" />
      </div>

      { loading &&
        <div>Loading...</div>
      }

      <button onClick={ reset }>Reset</button>
      <button onClick={ submit }>Submit</button>

      <div>{ JSON.stringify(get()) }</div>
    </>
  );
}
