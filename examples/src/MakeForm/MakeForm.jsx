import React, { useMemo } from 'react';
import { FormProvider } from './orderForm';
import OrderForm from './OrderForm';

export default function MakeForm() {
  const t = value => value.match(/\.([^.]+)$/)[1].replace(/_/g, ' ').toUpperCase();

  const config = useMemo(() => ({
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
    <FormProvider config={config}>
      <OrderForm />
    </FormProvider>
  );
}
