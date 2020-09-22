import React, { useCallback } from 'react';
import { useOrderForm } from './orderForm';

function fakeSubmit() {
  return new Promise((_resolve, reject) => {
    setTimeout(() => {
      reject({
        'username': 'Is already taken',
        'items.0.id': "Doesn't exist"
      });
    }, 1000);
  });
}

export default function FormControls() {
  const { set, reset: doReset, isValid, validate, withValidation, setErrors, fillForm } = useOrderForm();

  const reset = useCallback(() => doReset(), []);

  const randomizeName = useCallback(() => {
    set({
      username: `random-${(Math.random() * 1e6).toFixed(0)}`
    });
  }, [set]);

  const handleSubmit = useCallback(withValidation((attrs) => {
    fakeSubmit(attrs).catch((errors) => {
      setErrors(errors)
        .then(() => {
          for (const name in errors) {
            // esling-disable-next-line no-console
            console.log(`Error in input: ${name}`, document.querySelector(`[data-name='${name}'] .error`));
          }
        });
    });
  }), []);

  return (
    <div>
      <button onClick={handleSubmit} disabled={!isValid}>Save</button>
      <button onClick={reset}>Reset</button>
      <button onClick={validate}>Validate</button>
      <button onClick={fillForm}>Quick Fill</button>
      <button onClick={randomizeName}>Randomize Name</button>
    </div>
  );
}
