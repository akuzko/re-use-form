import { makeForm } from '../../../src';

function promisedSetters({ set }) {
  return {
    set(...args) {
      return new Promise((resolve) => {
        set(...args);
        resolve(args);
      });
    }
  };
}

export const [FormProvider, useOrderForm] = makeForm({
  initial: {
    guest: false,
    username: '',
    address: '',
    items: [{}, {}]
  },
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
  helpers: [
    promisedSetters,
    ({ attrs }) => ({
      isFreeDelivery: attrs.address.includes('123')
    })
  ]
});
