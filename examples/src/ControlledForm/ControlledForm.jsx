import React, { useState, useMemo, useCallback } from 'react';
import { FormProvider } from './orderForm';
import OrderForm from './OrderForm';

export default function ControlledForm() {
  const t = value => value.match(/\.([^.]+)$/)[1].replace(/_/g, ' ').toUpperCase();
  const [attrs, setAttrs] = useState({
    guest: false,
    username: '',
    address: '',
    items: [{}, {}]
  });

  const onChange = useCallback((attrs) => {
    setAttrs(attrs);
  }, []);

  const onSet = useCallback((setAttrs, { attrs, nextAttrs }) => {
    console.log({ attrs, nextAttrs });
    setAttrs({ validate: false });
  }, []);

  const addItem = useCallback(() => {
    setAttrs((attrs) => {
      return {
        ...attrs,
        items: [...attrs.items, {}]
      };
    });
  }, []);

  const config = useMemo(() => ({
    helpers: () => ({
      fillForm: () => {
        setAttrs({
          guest: true,
          username: 'Guest',
          address: 'Home',
          items: [{
            id: '303322',
            count: 5
          }]
        });
      }
    }),
    validations: {
      defaultOptions: { t },
      rules: {
        'items.*.count': {
          deps: ['items.*.id'],
          rules: function(value, { name, attrs }) {
            const index = +name.split('.')[1];

            if (+attrs.items[index].id > 10 && +value > 10) {
              return 'Too Many';
            }
          }
        }
      }
    }
  }), []);

  return (
    <FormProvider config={config} attrs={attrs} onChange={onChange} onSet={onSet}>
      <OrderForm />
      <div>
        <button onClick={addItem}>Add item</button>
      </div>
    </FormProvider>
  );
}
