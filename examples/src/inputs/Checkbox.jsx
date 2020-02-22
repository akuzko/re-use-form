import React from "react";
import PropTypes from "prop-types";

Checkbox.propTypes = {
  value: PropTypes.bool,
  onChange: PropTypes.func,
  error: PropTypes.string,
  label: PropTypes.string
};

export default function Checkbox({value, onChange, error, label, ...rest}) {
  const handleChange = (e) => {
    onChange(e.target.checked, {event: e});
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
