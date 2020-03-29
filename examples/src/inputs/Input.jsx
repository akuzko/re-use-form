import React from 'react';
import PropTypes from 'prop-types';

Input.propTypes = {
  name: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  error: PropTypes.string
};

export default function Input({ name, value, onChange, error, ...rest }) {
  const handleChange = (e) => {
    onChange(e.target.value, { event: e });
  };

  return (
    <div data-name={name}>
      <input value={value || ''} onChange={handleChange} {...rest} />
      { error &&
        <div className="error">{ error }</div>
      }
    </div>
  );
}
