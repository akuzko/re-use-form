import React, { useMemo } from 'react';
import { FormProvider } from './orderForm';
import OrderForm from './OrderForm';

export default function MakeForm() {
  const t = value => value.match(/\.([^.]+)$/)[1].replace(/_/g, ' ').toUpperCase();

  const config = useMemo(() => ({
    validations: {
      defaultOptions: { t },
      rules: {
        'items.(itemIndex).count': {
          deps: ['items.^.id', 'username'],
          rules: (value, { itemIndex, attrs }) => {
            if (+attrs.items[itemIndex].id > 10 && +value > 10 && attrs.username !== 'rich') {
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
