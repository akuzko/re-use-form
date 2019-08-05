React Form Hook
===============

Simple and robust form hook for [React](https://facebook.github.io/react/) with validation
support and simple internationalization.

[![build status](https://img.shields.io/travis/akuzko/ok-react-use-form/master.svg?style=flat-square)](https://travis-ci.org/akuzko/ok-react-use-form)

## Installation

```
npm install --save ok-react-use-form
```

## Usage

### Input Prerequisites

`ok-react-use-form` provides a `useForm` and `useControlledForm` hooks that are
intended to be used alongside with custom **Input** components. An **Input** is
any component that consumes three properties: `value`, `error` and `onChange`
(note that there is also `name` property supplied for input by form's helpers).
It also has to provide it's `value` as first argument to `onChange` function
supplied in props.

### `useForm` Hook

`ok-react-use-form` provides `useForm` hook for uncontrolled forms. It accepts
object with initial form attributes and optional config. Config can be used to
define client-side validations (see *"Form Validations"* section bellow) and to
ease internationalization.

```js
import { useForm } from 'ok-react-use-form';
import { TextField, Select } from 'my-components/inputs';

function MyForm({onSave}) {
  const {input, get} = useForm({}); // initialize form attributes with empty object.

  const save = () => onSave(get()); // get() returns all current form state

  return (
    <>
      <TextField { ...input('email') } label="Email" />
      <TextField { ...input('fullName') } label="Full Name" />

      <Select { ...input('address.countryId') } options={ countryOptions } label="Country" />
      <TextField { ...input('address.city') } label="City" />
      <TextField { ...input('address.line') } label="Address" />

      <button onClick={save}>Submit</button>
    </>
  );
}
```

#### Note on `$` alias for `input` helper.

`useForm` hook returns an object that has both `input` and `$` keys with the same
value. While `input` is more explicit name, it might become cumbersome to use it
over and over again. For this reason, `useForm` hook also provides a `$` helper
that does the same. Basically, it's the same approach as used in
[`react-form-base`](https://github.com/akuzko/react-form-base) package. All examples
bellow will use `$` helper method as more common one.

### Hook Config

`useForm` hook accepts a config as a second argument. This `config` object is
mainly used for declaring form validations and **is memoized by default**. Also,
config itself may be replaced by validation rules (see *"Form Validations"* section
bellow), removing need of extra nesting.

Bellow are examples of `useForm` hook call with valid configs:
```js
// Using input validation setup directly in place of config:
const {$} = useForm({}, {
  username: "presence"
});
```

To be able to have dynamic config, you should disable default memoization by using
`useMemo: false` config option. But doing just this is **highly discouraged**, since
on each render hook will receive new object literal re-setting config with no
real changes every time. So whenever you disable default memoization, make sure
to provide custom one with proper dependencies:
```js
const [validationEnabled, setValidationEnabled] = useState(false);
const {$} = useForm({}, useMemo(() => ({
  useMemo: false,
  validations: validationEnabled && {
    username: "presence"
  }
}), [validationEnabled]));
```

Finally, in cases when validation setup needs to share common options for all
validation rules (like for internationalizing error messages, see corresponding
section bellow), you can specify `defaultOptions` within validation setup:
```js
const {t} = useTranslation("common");
const {$} = useForm({}, {
  validations: {
    defaultOptions: {t},
    rules: {
      username: "presence"
    }
  }
});
```

### Custom `onChange` Input Handler

The most common use-case when you need custom logic is to have custom onChange
handler for handling any input's change. For this, `$`/`input` function takes
this function as second attribute. This function will be called with input
name as first argument and input value as second one:

```js
function Form() {
  const {$, set} = useForm({});

  // uppercases user's input
  const changeInput = (name, value) => {
    set(name, value.toUpperCase());
  };

  return (
    <>
      <TextField { ...$('username', changeInput) } label="Username" />
      <TextField { ...$('address.postalCode', changeInput) } label="Postal Code" />
    </>
  );
}
```

### Note on Validation-less Forms

Before we go to validation section bellow, it should be mentioned that even
forms without defined client-side validation can use `getError`, `setErrors`
and `setError` helpers returned by form hook. With no client-side validation,
you might still want to interact with the server when user works with form
and should something go wrong, you might want to set server-side errors for
form's inputs and use them in form's rendering logic, which is exactly what
mentioned helpers are about.

### Form Validations

`ok-react-use-form` provides a very easy way to declare form validations,
which will automatically validate inputs on change when required. But before
validations are used, they should be defined. Each validation rule is defined
via `defValidation` function call. Validation handler function used in this
call should accept two arguments - input's `value` and validation `options`.
Even considering that not all validation rules need additional options for
their business logic, the most common use case scanario is to allow user
to specify custom error message when validation is failed.

```js
import { defValidation } from 'ok-react-use-form';

// Define very primitive validations for demonstrational purposes.
// All validation rules should be defined only once on your app initialization.
defValidations("presence", (value, {message}) => {
  if (!value) {
    return message || "Cannot be blank";
  }
});

defValidation("email", (value, {message}) => {
  if (!value) return;

  if (!/.+@.+/.test(value)) {
    return message || "Should be a valid email address";
  }
});

defValidation("format", (value, {pattern, message}) => {
  if (!value) return;

  if (!pattern.test(value)) {
    return message || "Invalid format";
  }
});
```

With generic validations defined, they can be used in form hook (alongside with
custom function validations, if needed)

```js
// UserForm.js
// ...other imports...
import { useForm } from 'ok-react-use-form';

function UserForm() {
  const {$, validate} = useForm({}, {
    "email": ["presence", "email"],
    "fullName": "presence",
    "address.city": ["presence", function(value) {
      if (!value) return;

      if (!/^[A-Z]/.test(value)) {
        return "Should start with capital letter";
      }
    }],
    "address.line": {
      presence: true,
      format: {
        pattern: /^[\w\s\d\.,]+$/,
        message: "Please enter a valid address"
      }
    }
  });

  const save = () => {
    validate({
      onValid() {
        // do something on successfull validation
      },
      onError(errors) {
        // do something if validation failed
      }
    });
  };

  return (
    <>
      <TextField { ...$("email") } label="Email" />
      <TextField { ...$("fullName") } label="Full Name" />

      <Select { ...$("address.countryId") } options={ countryOptions } label="Country" />
      <TextField { ...$("address.city") } label="City" />
      <TextField { ...$("address.line") } label="Address" />

      <button onClick={ save }>Submit</button>
    </>
  );
}
```

It's up to you how to define validation rules. But as for suggested solution,
you might want to take a look at [`validate.js`](https://validatejs.org/) project
and adopt it's functionality for validation definitions.

### Internationalized Validation Error Messages

Depending on adopted i18n solution in your application, there are different ways of
internationalizing validation error messages. The most common ones would include
global `t` function and hook-based `t` function.

#### Global `t` Function

Projects like [`ttag`](https://ttag.js.org/) give you a global `t` function
with gettext-like usage. Probably, this approach provides the most simple and
easy-to-use way to internationalize error messages:

```js
import { defValidation } from "ok-react-use-form";
import { t } from "ttag";

defValidation("presence", (value, {message}) => {
  if (!value) {
    return message || t`Can't be blank`;
  }
});
```

#### Hook-based `t` Function

Frameworks like [`react-i18next`](https://react.i18next.com/) provide translation
hooks to be used within components themselves. In case of `react-i18next` we have
a `useTranslation` hook, which provides access to `t` function. Since this function
is locally scoped to component, it should be passed to validation options explicitly.
Luckily, `useForm` hook allows to provide default validation options to have
this `t` function specified only once without need to explicitly mention it
over and over again:

```js
import { defValidation } from "ok-react-use-form";

defValidation("presence", (value, {t, message}) => {
  if (!value) {
    return message || t("errors.cannot_be_blank");
  }
});
```
And then in form:
```jsx
import { useForm } from "ok-react-use-form";
import { useTranslation } from "react-i18next";

export function Form() {
  const {t} = useTranslation("common");
  const {$} = useForm({}, {
    validations: {
      defaultOptions: {t},
      rules: {
        username: "presence",
        email: ["presence", "email"]
      }
    }
  });

  // rest of component
}
```

### Hook helper object

`useForm` hook returns object with following properties:

- `$(name)`, `input(name)` - returns a set of properties for input with a given
  name. `name` is a dot-separated string, i.e. `'foo.bar'` (for `bar` property
  nested in object under `foo`), or `'foos.1'` (value at index 1 of `foos` array),
  or `'foos.2.bar'` (`bar` property of object at index 2 of `foos` array)
- `get(name)` - returns a value for a given name. For example, if you have an
  attributes like `{foos: [{bar: 'baz'}, {bar: 'bak'}]}`, you might have:
  - `get('foos')       // => [{bar: 'baz'}, {bar: 'bak'}]`
  - `get('foos.1')     // => {bar: 'bak'}`
  - `get('foos.1.bar') // => 'bak'`
  - `get() // returns whole form's attributes object`
- `set(name, value)` - sets a `value` for an input with a specified `name`.
- `set(object)` - sets multiple values at once. Each key in the object
  corresponds to input name, and values are input values.
- `errors` - object representing all validation errors.
- `getError(name)` - returns validation error for an input with a given name.
- `setErrors(errors)` - sets `errors` (object) as form's errors.
- `setError(name, error)` - sets an error for a single input with a given name.
- `validate({onValid, onError})` - performs form validations. Accepts an object
  with `onValid` and `onError` callbacks that will be called in case of
  successful/failed validation correspondingly.
- `withValidation(callback)` - performs form validation and executes a callback
  if there were no errors.
- `reset(initial)` - clears form errors and sets form attributes provided value.
  If no value provided, uses object that was passed to initial `useForm` hook call.

## License

MIT
