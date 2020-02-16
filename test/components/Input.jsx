import React from "react";
import PropTypes from "prop-types";

Input.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  error: PropTypes.string,
  name: PropTypes.string,
  wrapperClassName: PropTypes.string,
  errorClassName: PropTypes.string
};

Input.defaultProps = {
  wrapperClassName: "",
  errorClassName: "error"
};

export default function Input({value, onChange, error, name, wrapperClassName, errorClassName, ...rest}) {
  const handleChange = e => onChange(e.target.value, e);

  return (
    <div className={ wrapperClassName }>
      <input value={ value || "" } onChange={ handleChange } name={ name } { ...rest } />
      { error &&
        <div className={ errorClassName }>{ error }</div>
      }
    </div>
  );
}