import { makeForm } from "../../../src";

export const [FormProvider, useOrderForm] = makeForm({
  initial: {
    username: "",
    items: [{}, {}, {}]
  },
  validations: {
    "username": {
      presence: true,
      format: {
        pattern: /^[\w\s\d.,]+$/
      },
    },
    "items": "presence",
    "items.*.id": "presence",
    "items.*.count": "presence"
  }
});
