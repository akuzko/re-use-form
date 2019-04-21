React Form Hook
===============

A set of easy-to-use hooks for both controlled and uncontrolled forms for [React](https://facebook.github.io/react/)
with validation and i18n support.

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

### Uncontrolled Forms

`ok-react-use-form` provides `useForm` hook for uncontrolled forms. It accepts
object with initial form attributes and optional (yet recommended) client-side
validations (see "Form Validations" section bellow).

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
over and over again. For this reason, `useForm` and `useControlledForm` hooks also
provide a `$` helper that does the same. Basically, it's the same approach as used in
[`react-form-base`](https://github.com/akuzko/react-form-base) package. All examples
bellow will use `$` helper method as more common one.

### Controlled Forms

For controlled forms `ok-react-use-form` provides `useControlledForm` hook. Instead
of initial form state, this hook accepts form's `props` object, which by convention
has to have `attrs` and `onChange` values defined:

```js
import { useForm } from 'ok-react-use-form';
import { TextField } from 'my-components/inputs';

function Editor() {
  const [form, setForm] = useState({});

  const submit = () => {
    // do something with `form` object.
  };

  return <Form attrs={ form } onChange={ setForm } onSave={ submit } />;
}

function Form(props) {
  const {$} = useControlledForm(props);

  return (
    <>
      <TextField { ...$('email') } label="Email" />
      <TextField { ...$('fullName') } label="FullName" />
      <button onClick={ props.onSave }>Register</button>
    </>
  );
}
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
forms without defined client-side validation can use `getError, `setErrors`
and `setError` helpers returned by form hook. With no client-side validation,
you might still want to interact with the server when user works with form
and should something go wrong, you might want to set server-side errors for
form's inputs and use them in form's rendering logic, which is exactly what
mentioned helpers are about.

### Form Validations

`ok-react-use-form` provides a very easy way to declare form validations,
which will automatically validate inputs on change when required. But before
validations are used, they should be defined:

```js
import { defineValidations } from 'ok-react-use-form';

// define very primitive validations for demonstrational purposes.
// all validation has to be defined only once in some initialization file.
defineValidations({
  presence(value) {
    if (!value) {
      return "Cannot be blank";
    }
  },
  email(value) {
    if (!value) return;

    if (!/.+@.+/.test(value)) {
      return "Should be a valid email address";
    }
  },
  format(value, format) {
    if (!value) return;

    if (!format.test(value)) {
      return 'Invalid format';
    }
  }
});
```

```js
import { useForm } from 'ok-react-use-form';

// UserForm.js
function UserForm() {
  const {$, validate} = useForm({}, {
    'email': ['presence', 'email'],
    'fullName': 'presence',
    'address.city': 'presence',
    'address.line': { presence: true, format: /^[\w\s\d\.,]+$/ }
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
      <TextField { ...$('email') } label="Email" />
      <TextField { ...$('fullName') } label="Full Name" />

      <Select { ...$('address.countryId') } options={ countryOptions } label="Country" />
      <TextField { ...$('address.city') } label="City" />
      <TextField { ...$('address.line') } label="Address" />

      <button onClick={ save }>Submit</button>
    </>
  );
}
```

It's up to you how to define validation rules. But as for suggested solution,
you might want to take a look at [`validate.js`](https://validatejs.org/) project
and adopt it's functionality for validation definitions.

### Internationalized Validation Error Messages

`ok-react-use-form` also supports hook-based internationalization approach for
error messages out of the box. To have translated error messages, validations
should be defined with following arguments:
- a translation hook you want to use for i18n solution
- arguments passed to this hook (usually a single string representing a namesace)
- a function that takes hook's return value as argument and returns validation rules.

For example, integration with [`react-i18next`](https://react.i18next.com/) framework
might look like this:

```js
import { useTranslation } from 'react-i18next';
import { defineValidations } from 'ok-react-use-form';

defineValidations(useTranslation, 'common:form.validation_errors', ({t}) => {
  presence(value) {
    if (!value) {
      return t('cant_be_blank');
    }
  },
  // the rest of validations
});
```

### Hook helper object

Both `useForm` and `useControlledForm` hooks return object with following properties:

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
  Optional `meta` argument will be passed to `props.onChange` function alongside
  with new `attrs` as second argument.
- `set(object)` - sets multiple values at once. Each key in the object
  corresponds to input name, and values are input values. Optional `meta` argument
  will be passed to `props.onChange` function alongside with new `attrs` as second
  argument.
- `errors` - object representing all validation errors.
- `getError(name)` - returns validation error for an input with a given name.
- `setErrors(errors)` - sets `errors` (object) as form's errors.

In addition to properties above, if `useForm`/`uesControlledForm` hook was called
with validation rules for inputs, hook object will also have properties bellow:

- `setError(name, error)` - sets an error for a single input with a given name.
- `validate({onValid, onError})` - performs form validations. Accepts an object
  with `onValid` and `onError` callbacks that will be called in case of
  successfull/failed validation correspondingly.
- `submitWith(callback)` - performs form validation and executes a callback
  if there were no errors.

## License

MIT
