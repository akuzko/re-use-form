import React, { useState, useMemo, useCallback } from 'react';
import { Input, Checkbox } from '../inputs';

import { useForm } from '../../../src';

function useTranslation() {
  return { t };

  function t(key) {
    return key.match(/\.([^.]+)$/)[1]
      .replace(/^.|_./g, s => s[1] ? ` ${s[1].toUpperCase()}` : s[0].toUpperCase());
  }
}

const initialForm = {
  username: '',
  items: []
};

export default function MonoForm() {
  const [saving, setSaving] = useState(false);
  const [validationEnabled, setValidationEnabled] = useState(true);
  const [itemsValidationEnabled, setItemsValidationEnabled] = useState(true);
  const { t } = useTranslation();
  const {
    $,
    get,
    set,
    getError,
    setError,
    withValidation,
    reset: doReset,
    validate: doValidate,
    useConfig
  } = useForm({
    initial: initialForm,
    validations: {
      defaultOptions: { t }
    }
  });

  useConfig(() => {
    return validationEnabled && {
      validations: {
        'username': {
          presence: true,
          format: {
            pattern: /^[\w\s\d.,]+$/
          }
        }
      }
    };
  }, [validationEnabled]);

  useConfig(() => {
    return validationEnabled && itemsValidationEnabled && {
      validations: {
        'items': 'presence',
        'items.*.id': 'presence',
        'items.*.count': 'presence',
        'items.*.maxCount': {
          rules: function(value, { name, attrs }) {
            const index = name.split('.')[1];

            if (value && +value < +attrs.items[index].count) {
              return `Should be greater than ${attrs.items[index].count}`;
            }
          },
          deps: ['items.*.count']
        }
      }
    };
  }, [validationEnabled, itemsValidationEnabled]);

  const items = get('items');

  const changeUsername = useCallback((value) => {
    set('username', value.toUpperCase());
  }, []);

  const changeItemId = useCallback((value, { name }) => {
    const index = +name.split('.')[1];

    set({
      [name]: value,
      [`items.${index}.count`]: ''
    });
  }, []);

  const changeItemCount = useCallback((value, { name }) => {
    if (isFinite(+value)) {
      set(name, value);
    }
  }, []);

  const addItem = useCallback(() => {
    set('items', [...items, {}]);
  }, [items]);

  const removeItem = useCallback((i) => {
    const nextItems = [...items];

    nextItems.splice(i, 1);
    set('items', nextItems);
  }, [items]);

  const validate = useCallback(() => {
    doValidate()
      .then(attrs => console.log('Form is valid', attrs))
      .catch(errors => console.log('Form has errors', errors));
  }, []);

  const validateUsername = useCallback(() => {
    doValidate('username');
  }, []);

  const save = useCallback(() => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setError('items.0.count', t('form.validations.not_enough!'));
    }, 2000);
  }, []);

  const submit = useMemo(() => {
    return validationEnabled ? withValidation(save) : save;
  }, [validationEnabled, save]);

  const reset = useCallback(() => doReset(), []);

  return (
    <>
      <div>
        <Checkbox value={validationEnabled} onChange={setValidationEnabled} label="Username Validation" />
      </div>
      <div>
        <Checkbox value={itemsValidationEnabled} onChange={setItemsValidationEnabled} label="Items Validation" />
      </div>

      <div className="username">
        <Input {...$('username', changeUsername)} onBlur={validateUsername} placeholder="Username" />
      </div>

      { getError('items') &&
        <div>At least one item is required</div>
      }

      <button onClick={addItem}>Add Item</button>

      { items.map((_item, i) => (
          <div key={i}>
            <div>
              <Input {...$(`items.${i}.id`, changeItemId)} placeholder="Item ID" />
            </div>
            <div>
              <Input {...$(`items.${i}.count`, changeItemCount)} placeholder="Item Count" />
            </div>
            <div>
              <Input {...$(`items.${i}.maxCount`, changeItemCount)} placeholder="Max Count" />
            </div>

            <button onClick={() => removeItem(i)}>Remove this Item</button>
          </div>
        ))
      }

      { saving &&
        <div>Saving...</div>
      }

      <div>
        <button onClick={reset}>Reset</button>
        <button onClick={validate}>Validate</button>
        <button onClick={submit}>Submit</button>
      </div>

      <div>{ JSON.stringify(get()) }</div>
    </>
  );
}
