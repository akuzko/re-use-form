import React from 'react';

export default function Checkbox({value, onChange, error, label, ...rest}) {
  const handleChange = (e) => {
    onChange(e.target.checked);
  };

  return (
    <label>
      { label }
      <input type="checkbox" checked={ Boolean(value) } onChange={ handleChange } { ...rest } />
      { error &&
        <div className="error">{ error }</div>
      }
    </label>
  );
}
