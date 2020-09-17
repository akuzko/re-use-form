import { makeForm } from '../../../src';

export const [FormProvider, useOrderForm] = makeForm({
  validations: {
    'username': {
      format: {
        pattern: /^[\w\s\d.,]+$/
      }
    },
    'items': 'presence',
    'items.*.id': 'presence',
    'items.*.count': 'presence'
  },
  helpers: ({ attrs }) => ({
    isFreeDelivery: attrs.address.includes('123')
  })
});
