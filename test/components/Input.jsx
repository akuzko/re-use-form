import React from 'react';

Input.defaultProps = {
  wrapperClassName: '',
  errorClassName: 'error'
};

export default function Input({ value, onChange, error, name, wrapperClassName, errorClassName, ...rest }) {
  const handleChange = e => onChange(e.target.value, e);

  return (
    <div className={ wrapperClassName }>
      <input value={ value || '' } onChange={ handleChange } name={ name } { ...rest } />
      { error &&
        <div className={ errorClassName }>{ error }</div>
      }
    </div>
  );
}