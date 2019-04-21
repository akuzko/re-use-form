import React, { useState } from 'react';
import Input from './Input';
import Checkbox from './Checkbox';

import { useForm, defineValidations } from '../../src';

function useTranslation() {
  return {t};

  function t(key) {
    return key.match(/\.([^.]+)$/)[1]
      .replace(/^.|_./g, s => s[1] ? ` ${s[1].toUpperCase()}` : s[0].toUpperCase());
  }
}

defineValidations(useTranslation, 'common', ({t}) => ({
  presence(value) {
    if (!value) {
      return t('form.validations.cant_be_blank');
    }
  }
}));

const initialForm = {};

export default function Form() {
  const [saving, setSaving] = useState(false);
  const [withValidation, setWithValidation] = useState(true);
  const {t} = useTranslation();
  const {$, get, set, setErrors, submitWith} = useForm(initialForm, withValidation && {
    'name': 'presence',
    'item.id': 'presence'
  });

  const reset = () => set({});

  const changeUsername = value => set('name', value.toUpperCase());

  const save = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setErrors({'item.count': t('form.validations.not_enough!')});
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

      { saving &&
        <div>Saving...</div>
      }

      <button onClick={ reset }>Reset</button>
      <button onClick={ submit }>Submit</button>

      <div>{ JSON.stringify(get()) }</div>
    </>
  );
}
