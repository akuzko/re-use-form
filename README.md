React Form Hook
===============

Simple and robust form hook for [React](https://facebook.github.io/react/) with
validation support and simple internationalization.

[![build status](https://img.shields.io/travis/akuzko/re-use-form/master.svg?style=flat-square)](https://travis-ci.org/akuzko/re-use-form)
[![npm version](https://img.shields.io/npm/v/re-use-form.svg?style=flat-square)](https://www.npmjs.com/package/re-use-form)

## Installation

```
npm install --save re-use-form
```

## Usage

### Input Prerequisites

`re-use-form` provides a `useForm` hook that is intended to be used alongside
with custom **Input** components. An **Input** is any component that consumes
three properties: `value`, `error` and `onChange` (note that there is also `name`
property supplied for input by form's helpers). It also has to provide it's
`value` as first argument to `onChange` function supplied in props (see
"Custom `onChange` Input Handler" section bellow for more info and examples).

### `useForm` Hook

`useForm` hook is primary hook provided by the package. It accepts an optional
configuration object that can be used to specify form's initial attributes,
client-side validations (see *"Form Validations"* section bellow) and to
ease internationalization of error messages by providing default validation
options.

```js
import { useForm } from 're-use-form';
import { TextField, Select } from 'my-components/inputs';

function MyForm({ onSave }) {
  const { input, attrs } = useForm(); // initializes form attributes with empty object.

  const save = () => onSave(attrs);

  return (
    <>
      <TextField {...input('email')} label="Email" />
      <TextField {...input('fullName')} label="Full Name" />

      <Select {...input('address.countryId')} options={countryOptions} label="Country" />
      <TextField {...input('address.city')} label="City" />
      <TextField {...input('address.line')} label="Address" />

      <button onClick={save}>Submit</button>
    </>
  );
}
```

#### Note on `$` alias for `input` helper.

`useForm` hook returns an object that has both `input` and `$` properties with the same
value. While `input` is more explicit name, it might become cumbersome to use it
over and over again. For this reason, `useForm` hook also provides a `$` helper
that does the same. Basically, it's the same approach as used in
[`react-form-base`](https://github.com/akuzko/react-form-base) package. All examples
bellow will use `$` helper method as more common one.

Keep in mind that although `$` is available by default, you can use any alias
you find convenient when destructuring form helpers object returned by hook:

```js
const { input: inp } = useForm();

// and then you can use `<Input {...inp('name')} />`
```

### Hook Config

`useForm` hook accepts a config as it's only argument. This `config` object is
used to specify form's initial values, client-side validations (see
*"Form Validations"* section bellow), their dependencies, etc.
This config object **is memoized with no dependencies by default**. For dynamic
configuration one should use `useConfig` hook (see bellow).

Bellow are examples of `useForm` hook call with different config examples:
```js
const { $ } = useForm({
  initial: {
    username: '',
    items: [{}]
  },
  validations: {
    username: 'presence'
  }
});
```

In cases when validation setup needs to share common options for all
validation rules (like for internationalizing error messages, see corresponding
section bellow), you can specify `defaultOptions` within validation setup:
```js
const { t } = useTranslation('common');
const { $ } = useForm({
  validations: {
    defaultOptions: { t },
    rules: {
      username: 'presence'
    }
  }
});
```

To apply a dynamic configuration, for instance, input value-dependent validation,
one can use `useConfig` helper hook. It has the same signature as `useMemo`
hook, and should it's function provide a config object, it will be merged with
the configuration form already has:
```js
const { $, useConfig, attrs: { guest } } = useForm({
  initial: { username: '', address: '', guest: false }
});

useConfig(() => {
  return !guest && {
    validations: {
      username: 'presence',
      address: 'presence'
    }
  };
}, [guest]);
````

### Custom `onChange` Input Handler

The most common use-case when you need custom logic is to have custom onChange
handler for handling any input's change. For this, `$`/`input` function takes
this function as second attribute. This function will be called with input
value as first argument and an object with meta information as second one.
As a bare minimum, this object will have `name` property that corresponds
to input's name (the string value passed to `$`/`input` function call), and
other properties can be populated by your input components:

```js
function TextField({ value, error, onChange, ...rest }) {
  const handleChange = useCallback((e) => {
    onChange(e.target.value, { event: e });
  }, []);

  return (
    <div>
      <input value={value} onChange={handleChange} {...rest} />
      { error &&
        <div className="error">{ error }</div>
      }
    </div>
  );
}

function Form() {
  const { $, set } = useForm();

  // uppercases user's input and logs event provided by TextField input component
  const changeInput = useCallback((value, { name, event }) => {
    console.log(event);
    set(name, value.toUpperCase());
  }, []);

  return (
    <>
      <TextField {...$('username', changeInput)} label="Username" />
      <TextField {...$('address.postalCode', changeInput)} label="Postal Code" />
    </>
  );
}
```

### Purity Support

All of the helper functions returned by `useForm` hook, with the exception of
`get` and `getError` functions that depend on form attributes and errors whenever
they change, are persistent and do not change on per render basis. The same goes
for values returned by `$`/`input` helper - as long as on-change handler passed
to `$` function is persistent (or if it was omitted), it's `onChange` property
will be persistent as well, i.e. pure input components that consume it won't be
re-rendered if other properties do not change too.

If, for some reason, you want to disable input onChange handlers persistence,
you can use `pureHandlers: false` config option.

### Note on Validation-less Forms

Before we go to validation section bellow, it should be mentioned that even
forms without defined client-side validation can use `getError`, `setErrors`
and `setError` helpers returned by form hook. With no client-side validation,
you might still want to interact with the server when user works with form
and should something go wrong, you might want to set server-side errors for
form's inputs and use them in form's rendering logic, which is exactly what
mentioned helpers are about.

### Form Validations

`re-use-form` provides a very easy way to declare form validations,
which will automatically validate inputs on change when required. Each
validation rule is defined via `defValidation` function call. Validation
handler function used in this call should accept two arguments - input's
`value` and validation `options`. By default, `re-use-form` will pass
form attributes as `attrs` option, and name of the input being validated
as `name` option. Even if not used very often, this may become in handy
when defining custom wildcard validations that depend on other values
of the form. Also, the most common use case scenario is to allow user to
specify custom error message when validation is failed.

```js
import { defValidation } from 're-use-form';

// Bellow are very primitive validations defined for demonstration purposes.
// All validation rules should be defined only once on your app initialization.
defValidation('presence', (value, { message }) => {
  if (!value) {
    return message || 'Cannot be blank';
  }
});

defValidation('email', (value, { message }) => {
  if (!value) return;

  if (!/.+@.+/.test(value)) {
    return message || 'Should be a valid email address';
  }
});

defValidation('format', (value, { pattern, message }) => {
  if (!value) return;

  if (!pattern.test(value)) {
    return message || 'Invalid format';
  }
});
```

With generic validations defined, they can be used in form hook (alongside with
custom function validations, if needed)

```js
// UserForm.js
// ...other imports...
import { useForm } from 're-use-form';

function UserForm() {
  const { $, validate } = useForm({
    validations: {
      'email': ['presence', 'email'],
      'fullName': 'presence',
      'address.city': [
        'presence',
        (value) => {
          if (!value) return;

          if (!/^[A-Z]/.test(value)) {
            return 'Should start with capital letter';
          }
        }
      ],
      'address.line': {
        presence: true,
        format: {
          pattern: /^[\w\s\d\.,]+$/,
          message: 'Please enter a valid address'
        }
      }
    }
  });

  const save = useCallback(() => {
    validate()
      .then((attrs) => {
        // Do something on successful validation.
        // `attrs` is identical to `get()` helper call
      })
      .catch((errors) {
        // Do something if validation failed. At this moment
        // errors are already rendered.
        // It is safe to omit this `.catch` closure - no
        // exception will be thrown.
      });
  }, []);

  return (
    <>
      <TextField {...$('email')} label="Email" />
      <TextField {...$('fullName')} label="Full Name" />

      <Select {...$('address.countryId')} options={countryOptions} label="Country" />
      <TextField {...$('address.city')} label="City" />
      <TextField {...$('address.line')} label="Address" />

      <button onClick={save}>Submit</button>
    </>
  );
}
```

It's up to you how to define validation rules. But as for suggested solution,
you might want to take a look at [`validate.js`](https://validatejs.org/) project
and adopt it's functionality for validation definitions.

#### Validation Dependencies

Sometimes your inputs can have custom validation that depends on values of
other inputs. In such cases, when form is in "validate on change" state,
validation rules on dependent inputs should be triggered whenever their
dependencies change. Such validation with dependencies is defined by using
object with `rules` and `deps` properties, where `rules` specify any acceptable
validation rules, and `deps` is an array of dependency input names.

For example:

```js
function ItemForm() {
  const { $ } = useForm({
    validations: {
      min: ['presence', 'numericality'],
      max: {
        rules: [
          'presence',
          'numericality',
          (value, { attrs }) => {
            if (value <= attrs.min) {
              return 'Should be greater than \'min\'';
            }
          }
        ],
        deps: ['min']
      }
    }
  });
}
```
And now, if form has any errors rendered, `max` input will be validated whenever
its `min` dependency input changes.

#### Validation Wildcards and Index Capture

If your form deals with collections of items, it is possible to declare validation
for them using wildcards:

```js
function OrderForm() {
  const { $ } = useForm({
    initial: { items: [] },
    validations: {
      'email': ['presence', 'email'],
      'items.*.name': 'presence',
      'items.*.count': {
        presence: true,
        numericality: { greaterThan: 10 }
      }
    }
  });

  // ...
}
```

It is also possible to specify dependencies for wildcard validation:

```js
function OrderForm() {
  const { $ } = useForm({
    initial: { items: [] },
    validations: {
      'items.*.id': 'presence',
      'items.*.min': 'presence',
      'items.*.max': {
        rules: [
          'presence',
          (value, { name, attrs }) => {
            const index = +name.split('.')[1];

            if (value <= attrs.items[index].min) {
              return `Should be greater than ${attrs.items[index].min}`;
            }
          }
        ],
        deps: ['items.*.min']
      }
    }
  });
}
```

Keep in mind, though, that such wildcard dependency means that change of
_any_ `min` input will trigger validation of _every_ `max` input. If such
behavior is not desired, one might want to use **pinned validation dependencies**
by using "pin" `^` symbol instead of wildcard `*`:

```js
function OrderForm() {
  const { $ } = useForm({
    initial: { items: [] },
    validations: {
      'items.*.id': 'presence',
      'items.*.min': 'presence',
      'items.*.max': {
        rules: [
          'presence',
          (value, { name, attrs }) => {
            const index = +name.split('.')[1];

            if (value <= attrs.items[index].min) {
              return `Should be greater than ${attrs.items[index].min}`;
            }
          }
        ],
        deps: ['items.^.min']
      }
    }
  });
}
```

Such dependency means that change of `'items.1.min'` input would trigger
validation only for corresponding `'items.1.max'` input.

As can be seen from the example above, in some cases custom validation functions
rely on item index when validating collection item. To ease it's access
one may use validation rule with **index capturing**. When used, corresponding
property will be added to validation options:

```js
function OrderForm() {
  const { $ } = useForm({
    initial: { items: [] },
    validations: {
      'items.*.id': 'presence',
      'items.*.min': 'presence',
      'items.(index).max': {
        rules: [
          'presence',
          (value, { index, attrs }) => {
            if (value <= attrs.items[index].min) {
              return `Should be greater than ${attrs.items[index].min}`;
            }
          }
        ],
        deps: ['items.^.min']
      }
    }
  });
}

````

#### `withValidation` Helper

It's pretty common to perform some action as soon as form has no errors and
validation passes. For such case there is `withValidation` helper that accepts
a callback and wraps it in validation routines. This callback will be called
only if form had no errors:

```js
const { $, withValidation } = useForm({
  validations: {
    name: 'presence'
  }
});

const save = withValidation((attrs) => {
  // send `attrs` to server
});

return (
  <>
    <Input {...$('name')} />
    <button onClick={save}>Submit</button>
  </>
);
```

#### Validation onChange strategy

By default, form will validate input values onChange only if there are any
errors rendered on the form. This might not be the most suitable behavior
in some cases. To specify other behavior one can use `onChangeStrategy`
validation configuration option:

```js
const { $ } = useForm({
  validations: {
    onChangeStrategy: 'onAfterValidate',
    rules: {
      username: 'presence'
    }
  }
});
```

Following strategies are supported:
- `'onAnyError'` - default one. Will validate inputs on change only if form
  has any errors.
- `'onAfterValidate'` - form will validate values on change only if `validate`
  helper has been called. This flag is set to initial `false` value after
  `reset` helper call.
- `'none'` - form will not validate inputs on change, but **will** drop any
  errors rendered on this input on change.

### Form Partials (`usePartial` Helper Hook)

One of the features of `re-use-form` package is that it's `useForm` hook also
provides a `usePartial` helper, which is a hook itself, and can be used to define
"nested" forms with their own validation and other business logic. This can help
you improve code organization and extract independent parts into dedicated
components for better maintainability.

```js
function OrderForm() {
  const { $, get, validate, usePartial } = useForm({
    initial: { username: '', items: [{}] },
    validations: {
      username: 'presence'
    }
  });

  return (
    <div>
      <Input {...$('username')} />
      { get('items').map((item, i) => (
          <ItemForm key={i} usePartial={usePartial} index={i} />
        ))
      }
      <button onClick={validate}>Validate</button>
    </div>
  );
}

function ItemForm({ usePartial, index }) {
  const { $ } = usePartial({
    prefix: `items.${index}`,
    validations: {
      name: 'presence',
      count: {
        rules: [
          'presence',
          (value, { attrs }) => {
            if (attrs.username === 'guest' && +value > 10) {
              return 'Guests are not allowed that many';
            }
          },
          (value, { attrs }) => {
            if (attrs.items[index].name === 'rare item' && +value > 1) {
              return 'Only one rare item is available';
            }
          }
        ],
        deps: ['username'],
        partialDeps: ['name']
      }
    }
  });

  return (
    <div>
      <Input {...$('name')} />
      <Input {...$('count')} />
    </div>
  );
}
```

As can be seen in example above, `usePartial`'s configuration object should
specify attributes prefix, instead of form initial attributes. Also note that
when specifying validation dependencies, full name of dependency should be
specified, since partial's validation might depend on "root" form attributes.

To specify "local" dependencies that are related only to inputs governed by
`usePartial` hook, one should use `partialDeps` configuration key. It is only
available when used together with `usePartial` hook.

Also note that "Dedicated Form Hook" feature bellow, which appeared later than
form partials, might provide even more convenient form usage and code organization.

When called, `usePartial` hook returns object with following properties:
`attrs`, `get`, `set`, `getError`, `input`, `$` (alias of `input`). All of them
are "scoped" to prefix of the partial and have similar behavior in terms of usage.

### Dedicated Form Hook

It is also possible to define a form hook that can be available in any of your
components without need to pass form helper functions in props. To do this,
one can use `makeForm` helper function:

```js
const [FormProvider, useOrderForm] = makeForm({
  initial: { username: '', items: [{}] },
  validations: {
    'username': 'presence',
    'items.*.name': 'presence',
    'items.*.count': 'presence'
  }
});

function OrderForm() {
  const { $, attrs } = useOrderForm();

  return (
    <div>
      <Input {...$('username')} />
      { attrs.items.map((item, i) => (
          <ItemForm key={i} index={i} />
        ))
      }
      <FormControls />
    </div>
  );
}

function FormControls() {
  const { reset, validate } = useOrderForm();

  return (
    <div>
      <button onClick={reset}>Reset</button>
      <button onClick={validate}>Validate</button>
    </div>
  );
}

function ItemForm({ index }) {
  const { $ } = useOrderForm();

  return (
    <div>
      <Input {...$(`items.${index}.name`)} />
      <Input {...$(`items.${index}.count`)} />
    </div>
  );
}

function OrderEditor() {
  const { t } = useTranslation('common');
  const config = useMemo(() => ({
    validations: {
      defaultOptions: { t }
    }
  }), []);

  return (
    <FormProvider config={config}>
      <OrderForm />
    </FormProvider>
  );
}
```

`makeForm` function accepts configuration object as it's single argument.
As can be seen from the example above, generated `FormProvider` component also
accepts an options `config` object that can be used to append configuration options
that cannot be declared during `makeForm` function call (such as values returned
by other hooks). It is OK to use any configuration object, including additional
validations, alongside with new validation dependencies - everything will be
merged into original config. The only dependency of resulting config object is
the `config` from props, so make sure to memoize it to prevent unnecessary
resolving on each render.

### Controlled Form

When using dedicated form hook, it is also possible to work with the form in
a controlled fashion:

```jsx
function OrderEditor() {
  const [attrs, setAttrs] = useState(initial);

  const fillForm = useCallback(() => {
    setAttrs({
      username: 'Guest',
      address: 'Home'
    });
  }, []);

  return (
    <>
      <FormProvider attrs={attrs} onChange={onChange}>
        <OrderForm />
      </FormProvider>
      <button onClick={fillForm}>Prefill form</button>
    </>
  );
}
```

#### Additional Helpers

In `makeForm` use-case scenarios there might also be a need in some additional
custom form helpers. For this purpose, one can use `helpers` config option.
It's value should be a function that accepts existing helpers as it's only
attributes and returns object with additional helpers that will be merged
with existing ones.

```js
const [FormProvider, useOrderForm] = makeForm({
  helpers: ({ attrs }) => ({
    isNew: !!attrs.id
  })
});
````

And then in any of your form components:

```js
const { $, isNew } = useOrderForm();
````

### Internationalized Validation Error Messages

Depending on adopted i18n solution in your application, there are different ways of
internationalizing validation error messages. The most common ones would include
global `t` function and hook-based `t` function.

#### Global `t` Function

Projects like [`ttag`](https://ttag.js.org/) give you a global `t` function
with gettext-like usage. Probably, this approach provides the most simple and
easy-to-use way to internationalize error messages:

```js
import { defValidation } from 're-use-form';
import { t } from 'ttag';

defValidation('presence', (value, { message }) => {
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
import { defValidation } from 're-use-form';

defValidation('presence', (value, { t, message }) => {
  if (!value) {
    return message || t('errors.cannot_be_blank');
  }
});
```
And then in form:
```js
import { useForm } from 're-use-form';
import { useTranslation } from 'react-i18next';

export function Form() {
  const { t } = useTranslation('common');
  const { $ } = useForm({
    validations: {
      defaultOptions: { t },
      rules: {
        username: 'presence',
        email: ['presence', 'email']
      }
    }
  });

  // rest of component
}
```

### Hook helper object

`useForm` hook returns object with following properties:

- `useConfig(fn, deps)` - helper hook used to declare dynamic form configuration that
  depends on dynamic values (external variables or form's input values).
- `$(name)`, `input(name)` - returns a set of properties for input with a given
  name. `name` is a dot-separated string, i.e. `'foo.bar'` (for `bar` property
  nested in object under `foo`), or `'foos.1'` (value at index 1 of `foos` array),
  or `'foos.2.bar'` (`bar` property of object at index 2 of `foos` array).
- `attrs` - corresponds to form's current attributes.
- `get(name)` - returns a value for a given name. For example, if you have an
  attributes like `{foos: [{bar: 'baz'}, {bar: 'bak'}]}`, you might have:
  - `get('foos')       // => [{bar: 'baz'}, {bar: 'bak'}]`
  - `get('foos.1')     // => {bar: 'bak'}`
  - `get('foos.1.bar') // => 'bak'`
  - `get() // returns whole form's attributes object`
- `set(name, value)` - sets a `value` for an input with a specified `name`.
- `set(attrs)` - when object is provided, sets multiple values at once.
  Each key in the object corresponds to input name, and values are input values.
- `set(fn)` - uses `fn` to fetch updates. `fn` takes current form attributes
  as only argument and should return object with updates to be assigned to the
  form (just like when calling `set(attrs)`).
- `getError(name)` - returns validation error for an input with a given name.
- `setErrors(errors)` - sets `errors` (object) as form's errors. Returns a Promise
  object that is resolved (with errors object) when errors are rendered.
- `setError(name, error)` - sets an error for a single input with a given name.
  Just like `setErrors`, returns a promise that is resolved with an errors object
  with one key-value pair of input name and error message.
- `dropError(name)` - drops error for a single input with a given name.
  Essentially calls `setError(name, undefined)`.
- `isValid` - boolean flag indicating whether or not there are any errors
  currently set.
- `isPristine` - boolean flag indicating whether or not form attributes were
  changed. Gets back to `true` on `reset` helper call.
- `validate()` - performs form validations. Return a promise-like object that
  responds to `then` and `catch` methods. On successful validation, resolves
  promise with form attributes. On failed validation, rejects promise with
  validation errors. It is safe to omit `catch` clause - no exception will
  leak outside.
- `validate(name)` - validates a single input. Just like form validation,
  can be chained with `then` and `catch` callbacks. On successful validation,
  resolves promise with input value. On failed, rejects promise with errors
  object containing single key-value corresponding to input name and error.
- `withValidation(callback)` - returns a function that performs form validation
  and executes a callback if there were no errors.
- `reset([attrsOrFn])` - clears form errors and sets form attributes provided value.
  If no value provided, uses object that was passed to initial `useForm` hook call.
  If function is provided, current form attributes are passed as the only function
  argument and it is expected to return full object of attributes to be set (unlike
  `set` method that should return object of updates in similar case). One can use
  this behavior to amend "clean" form attributes without affecting it's pristine state.
- `usePartial(config)` - helper hook used to define form partials.
- `setState(fn)` - helper hook that allows update form internal state. `fn` takes
  current form state as it's only argument and should return new complete form
  state. For advanced usage only.

### More Convenient Usage

It is recommended to re-export package functionality from some part of your
application, alongside with your inputs. For instance, you might have
`/components/form/index.js` file with following content:

```js
export * from 're-use-form';
export * from './inputs';
```

And then in your logic components you might have:
```js
import { useForm, Input } from 'components/form';
```

## License

MIT
