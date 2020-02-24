import { makeForm } from "../../../src";

export const [FormProvider, useOrderForm] = makeForm({
  initial: {
    guest: false,
    username: "",
    items: [{}, {}]
  },
  validations: {
    "username": {
      format: {
        pattern: /^[\w\s\d.,]+$/
      }
    },
    "items": "presence",
    "items.*.id": "presence",
    "items.*.count": "presence"
  }
});
