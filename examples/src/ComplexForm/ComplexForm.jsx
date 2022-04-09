import React, { useCallback } from 'react';
import { Input } from '../inputs';
import ItemForm from './ItemForm';

import { useForm } from '../../../src';

const initialForm = {
  username: '',
  items: [{}]
};

export default function ComplexForm() {
  const { $, get, set, getError, errors, reset: doReset, validate, usePartial, validating } = useForm({
    initial: initialForm,
    validations: {
      onChangeStrategy: 'onAfterValidate',
      rules: {
        username: {
          presence: true,
          format: {
            pattern: /^[\w\s\d.,]+$/
          },
        },
        items: 'presence'
      },
      async: {
        rules: {
          username: [{
            taken: {
              delay: 1000
            }
          }, {
            taken: {
              delay: 2000,
              message: 'Still taken'
            }
          }]
        },
        errorsStrategy: 'join'
      },
    }
  });

  const items = get('items');

  const addItem = useCallback(() => {
    set('items', [...items, {}]);
  }, [items]);

  const removeItem = useCallback((i) => {
    const nextItems = [...items];

    nextItems.splice(i, 1);
    set('items', nextItems);
  }, [items]);

  const reset = useCallback(() => doReset(), []);

  const submit = useCallback(() => {
    validate()
      .then((attrs) => {
        console.log('Validation passed', attrs);
      })
      .catch((errors) => {
        console.log('Validation errors', errors);
      });
  }, []);

  const validateUsername = useCallback(() => {
    validate('username')
      .then((value) => console.log(`Username '${value}' is valid`))
      .catch(({ username: error }) => console.log(`Username is invalid: ${error}`));
  }, []);

  return (
    <>
      <div className="username">
        <Input {...$('username')} placeholder="Username" />
      </div>

      { getError('items') &&
        <div>At least one item is required</div>
      }

      <button onClick={addItem}>Add Item</button>

      { items.map((_item, i) => (
          <ItemForm
            key={i}
            index={i}
            usePartial={usePartial}
            onRemove={() => removeItem(i)}
          />
        ))
      }

      <div>
        <button onClick={reset}>Reset</button>
        <button onClick={submit}>Validate</button>
        <button onClick={validateUsername}>Validate Username</button>
      </div>
      { validating &&
        <div>Validating...</div>
      }

      <div>{ JSON.stringify(get()) }</div>
      <div>{ JSON.stringify(errors) }</div>
    </>
  );
}
