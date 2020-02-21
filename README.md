React Form Hook
===============

Simple and robust form hook for [React](https://facebook.github.io/react/) with validation
support and simple internationalization.

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
`value` as first argument to `onChange` function supplied in props.

### `useForm` Hook

`useForm` hook is primary hook provided by the package. It accepts
object with initial form attributes and optional config. Config can be used to
define client-side validations (see *"Form Validations"* section bellow) and to
ease internationalization.

```js
import { useForm } from 're-use-form';
import { TextField, Select } from 'my-components/inputs';

function MyForm({onSave}) {
  const {input, get} = useForm({}); // initialize form attributes with empty object.

  const save = () => onSave(get()); // get() returns all current form state

  return (
    <>
      <TextField { ...input("email") } label="Email" />
      <TextField { ...input("fullName") } label="Full Name" />

      <Select { ...input("address.countryId") } options={ countryOptions } label="Country" />
      <TextField { ...input("address.city") } label="City" />
      <TextField { ...input("address.line") } label="Address" />

      <button onClick={ save }>Submit</button>
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

Keep in mind that although `$` is available by default, you can use any alias
you find convenient when destructuring form helpers object returned by hook:

```js
const {input: inp} = useForm({});

// and then you can use `<Input { ...inp("name") } />`
```

### Hook Config

`useForm` hook accepts a config as a second argument. This `config` object is
mainly used for declaring form validations and **is memoized with no dependencies by default**.
Also, config itself may be replaced by validation rules (see *"Form Validations"*
section bellow), removing need of extra nesting.

Bellow are examples of `useForm` hook call with valid configs:
```js
// Using input validation setup directly in place of config:
const {$} = useForm({}, {
  username: "presence"
});
```

To be able to have dynamic config, you should specify list of cofig dependencies
under `deps` config property:
```js
const [validationEnabled, setValidationEnabled] = useState(false);
const {$} = useForm({}, {
  deps: [validationEnabled],
  validations: validationEnabled && {
    username: "presence"
  }
});
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
  const changeInput = useCallback((name, value) => {
    set(name, value.toUpperCase());
  }, []);

  return (
    <>
      <TextField { ...$('username', changeInput) } label="Username" />
      <TextField { ...$('address.postalCode', changeInput) } label="Postal Code" />
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
import { defValidation } from "re-use-form";

// Bellow are very primitive validations defined for demonstration purposes.
// All validation rules should be defined only once on your app initialization.
defValidation("presence", (value, {message}) => {
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
import { useForm } from 're-use-form';

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
  const {$} = useForm({}, {
    min: ["presence", "numericality"],
    max: {
      rules: [
        "presence",
        "numericality",
        function(value, {attrs}) {
          if (value <= attrs.min) {
            return "Should be greater than 'min'";
          }
        }
      ],
      deps: ["min"]
    }
  })
}
```
And now, if form has any errors rendered, `max` input will be validated whenever
its `min` dependency input changes.

#### Wildcard Validation

If your form deals with collections of items, it is possible to declare validation
for them using wildcards:

```js
function OrderForm() {
  const {$} = useForm({items: []}, {
    "email": ["presence", "email"],
    "items.*.name": "presence",
    "items.*.count": {
      presence: true,
      numericality: {greaterThan: 10}
    }
  });

  // ...
}
```

It is also possible to specify dependencies for wildcard validation:

```js
function OrderForm() {
  const {$} = useForm({items: []}, {
    "items.*.id": "presence",
    "items.*.min": "presence",
    "items.*.max": {
      rules: [
        "presence",
        function(value, {name, attrs}) {
          const index = +name.split(".")[1];

          if (value <= attrs.items[index].min) {
            return `Should be greated than ${attrs.items[index].min}`;
          }
        }
      ],
      deps: ["items.*.min"]
    }
  });
}
```

Keep in mind, though, that such wildcard dependency means that change of
_any_ `min` input will trigger validation of _every_ `max` input.

#### `withValidation` Helper

It's pretty common to perform some action as soon as form has no errors and
validation passes. For such case there is `withValidation` helper that accepts
a callback and wraps it in validation routines. This callback will be called
only if form had no errors:

```js
const {$, withValidation} = useForm({}, {
  name: "presence"
});

const save = withValidation((attrs) => {
  // send `attrs` to server
});

return (
  <>
    <Input { ...$("name") } />
    <button onClick={ save }>Submit</button>
  </>
);
```

### Form Partials (`usePartial` Helper Hook)

One of the features of `re-use-form` package is that it's `useForm` hook also
provides a `usePartial` helper, which is a hook itself, and can be used to define
"nested" forms with their own validation and other business logic. This can help
you improve code organization and extract independent parts into dedicated
components for better maintainability.

```js
function OrderForm() {
  const {$, get, validate, usePartial} = useForm({username: "", items: [{}]}, {
    username: "presence"
  });

  return (
    <div>
      <Input { ...$("username") } />
      { get("items").map((item, i) => (
          <ItemForm key={ i } usePartial={ usePartial } index={ i } />
        ))
      }
      <button onClick={ validate }>Validate</button>
    </div>
  );
}

function ItemForm({usePartial, index}) {
  const {$} = usePartial(`items.${index}`, {
    name: "presence",
    count: "presence"
  });

  return (
    <div>
      <Input { ...$("name") } />
      <Input { ...$("count") } />
    </div>
  );
}
```

There are couple of limitations in `usePartial` hook, however:
- As second parameter it can accept only validation rules object (i.e. it is
not configurable in any other way)
- Dynamic config and validation is not supported when using form partials.

### Dedicated Form Hook

It is also possible to define a form hook that can be available in any of your
components without need to pass form helper functions in props. To do this,
one can use `makeForm` helper function:

```js
const [FormProvider, useOrderForm] = makeForm({
  initial: {username: "", items: [{}]},
  validations: {
    "username": "presence",
    "items.*.name": "presence",
    "items.*.count": "presence"
  }
});

function OrderForm() {
  const {$, attrs} = useOrderForm();

  return (
    <div>
      <Input { ...$("username") } />
      { attrs.items.map((item, i) => (
          <ItemForm key={ i } index={ i } />
        ))
      }
      <FormControls />
    </div>
  );
}

function FormControls() {
  const {reset, validate} = useOrderForm();

  return (
    <div>
      <button onClick={ reset }>Reset</button>
      <button onClick={ validate }>Validate</button>
    </div>
  );
}

function ItemForm({index}) {
  const {$} = useOrderForm();

  return (
    <div>
      <Input { ...$(`items.${index}.name`) } />
      <Input { ...$(`items.${index}.count`) } />
    </div>
  );
}

function OrderEditor() {
  const {t} = useTranslation("common");
  const config = useMemo(() => ({
    validations: {
      defaultOptions: {t}
    }
  }), []);

  return (
    <FormProvider config={ config }>
      <OrderForm />
    </FormProvider>
  );
}
```

`makeForm` function accepts configuration object as it's single argument. Initial
form attributes should be specified under `initial` property of this config object.
As can be seen from the example above, generated `FormProvider` component also
accepts an options `config` object that can be used to append configuration options
that cannot be declared during `makeForm` function call (such as values returned
by other hooks). It is OK to use any configuration object, including additional
validations, alongside with new validation dependencies - everything will be
merged into original config. The only dependency of resulting config object is
the `config` from props, so make sure to memoize it to prevent unnecessary
resolving on each render.

### More Optional Validation (Experimental)

In some cases it is useful to be able to define blocks of optional validations
that depend on various values, such as form attributes. For that purpose one
can use `useMoreValidations` hook. It has the same signature as `useMemo` hook,
and if it's function return value is an object - it will be merged to validations
that form already has at the moment:

```js
const initialAttrs = {
  username: "",
  address: "",
  guest: true
};

function UserForm() {
  const {$, useMoreValidations, attrs: {guest}} = useForm(initial, {
    username: "presence"
  });

  useMoreValidations(() => {
    if (!guest) {
      return {address: "presence"};
    }
  }, [guest]);

  return (
    <div>
      <Checkbox { ...$("guest") } />
      <TextField { ...$("username") } />
      <TextField { ...$("address") } />
    </div>
  );
}
```

### Internationalized Validation Error Messages

Depending on adopted i18n solution in your application, there are different ways of
internationalizing validation error messages. The most common ones would include
global `t` function and hook-based `t` function.

#### Global `t` Function

Projects like [`ttag`](https://ttag.js.org/) give you a global `t` function
with gettext-like usage. Probably, this approach provides the most simple and
easy-to-use way to internationalize error messages:

```js
import { defValidation } from "re-use-form";
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
import { defValidation } from "re-use-form";

defValidation("presence", (value, {t, message}) => {
  if (!value) {
    return message || t("errors.cannot_be_blank");
  }
});
```
And then in form:
```js
import { useForm } from "re-use-form";
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
- `getError(name)` - returns validation error for an input with a given name.
- `setErrors(errors)` - sets `errors` (object) as form's errors.
- `setError(name, error)` - sets an error for a single input with a given name.
- `dropError(name)` - drops error for a single input with a given name.
  Essentially calls `setError(name, undefined)`.
- `isValid` - boolean flag indicating whether or not there are any errors
  currently set.
- `validate()` - performs form validations. Return a promise-like object that
  responds to `then` and `catch` methods. On successful validation, resolves
  promise with form attributes. On failed validation, rejects promise with
  validation errors. It is safe to omit `catch` clause - no exception will
  leak outside.
- `validate(name)` - validates a single input. Just like form validation,
  can be chained with `then` and `catch` callbacks. On successful validation,
  resolves promise with input value. On failed, rejects promise with errors
  object containing single key-value corresponding to input name and error.
- `withValidation(callback)` - performs form validation and executes a callback
  if there were no errors.
- `reset([attrs])` - clears form errors and sets form attributes provided value.
  If no value provided, uses object that was passed to initial `useForm` hook call.
- `usePartial` - helper hook used to define form partials.
- `useMoreValidations` (experimental) - helper hook used to declare optional
  validations that depend on other values.

### More Convenient Usage

It is recommended to re-export package functionality from some part of your
application, alongside with your inputs. For instance, you might have
`/components/form/index.js` file with following content:

```js
export * from "re-use-form";
export * from "./inputs";
```

And then in your logic components you might have:
```js
import { useForm, Input } from "components/form";
```

## License

MIT
