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

    if (Array.isArray(value) && value.length === 0) {
      return t('form.validations.cant_be_blank');
    }
  },
  format(value, format) {
    if (!value) return;

    if (!format.test(value)) {
      return 'Invalid format';
    }
  }
}));

const initialForm = {
  username: '',
  items: []
};

export default function Form() {
  const [saving, setSaving] = useState(false);
  const [withValidation, setWithValidation] = useState(true);
  const {t} = useTranslation();
  const {$, get, set, getError, setErrors, submitWith} = useForm(initialForm, withValidation && {
    'username': {
      presence: true,
      format: /^[\w\s\d\.,]+$/,
    },
    'items': 'presence',
    'items.*.id': 'presence',
    'items.*.count': 'presence'
  });

  const reset = () => set(initialForm);

  const items = get('items');

  const changeUsername = (key, value) => set(key, value.toUpperCase());
  const changeItemCount = (key, value) => {
    if (isFinite(+value)) {
      set(key, value);
    }
  };

  const addItem = () => set('items', [...items, {}]);
  const removeItem = (i) => {
    const nextItems = [...items];

    nextItems.splice(i, 1);
    set('items', nextItems);
  };

  const save = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setErrors({'items.0.count': t('form.validations.not_enough!')});
    }, 2000);
  };

  const submit = withValidation ? submitWith(save) : save;

  return (
    <>
      <div>
        <Checkbox value={ withValidation } onChange={ setWithValidation } label="Client Validation" />
      </div>

      <div>
        <Input { ...$('username', changeUsername) } placeholder="Username" />
      </div>

      { getError('items') &&
        <div>At least one item is required</div>
      }

      <button onClick={ addItem }>Add Item</button>

      { items.map((_item, i) => (
          <div key={ i }>
            <div>
              <Input { ...$(`items.${i}.id`) } placeholder="Item ID" />
            </div>
            <div>
              <Input { ...$(`items.${i}.count`, changeItemCount) } placeholder="Item Count" />
            </div>

            <button onClick={ () => removeItem(i) }>Remove this Item</button>
          </div>
        ))
      }

      { saving &&
        <div>Saving...</div>
      }

      <div>
        <button onClick={ reset }>Reset</button>
        <button onClick={ submit }>Submit</button>
      </div>

      <div>{ JSON.stringify(get()) }</div>
    </>
  );
}
