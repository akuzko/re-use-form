import React from 'react';

export default function Input({value, onChange, error, ...rest}) {
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <>
      <input value={ value || '' } onChange={ handleChange } { ...rest } />
      { error &&
        <div className="error">{ error }</div>
      }
    </>
  );
}
