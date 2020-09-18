import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useForm } from './useForm';

export default function makeForm(mainConfig = {}) {
  const Context = createContext({ attrs: mainConfig.initial });

  // eslint-disable-next-line react/prop-types
  function FormProvider({ config, children, attrs, onChange }) {
    if (attrs && !mainConfig.initial) {
      mainConfig.initial = attrs;
    }

    const skipSetFormAttrsRef = useRef(false);
    const helpers = useForm(mainConfig, config);
    const { attrs: formAttrs, setFormAttrs, _amendInitialConfig, _action } = helpers;

    useEffect(() => {
      if (config) {
        _amendInitialConfig(config);
      }
    }, [config]);

    useEffect(() => {
      if (_action?.isAttrUpdate && onChange) {
        skipSetFormAttrsRef.current = true;
        onChange(formAttrs);
      }
    }, [formAttrs, _action, onChange]);

    useEffect(() => {
      if (attrs && attrs !== formAttrs) {
        if (skipSetFormAttrsRef.current) {
          skipSetFormAttrsRef.current = false;
        } else {
          setFormAttrs(attrs);
        }
      }
    }, [attrs, formAttrs]);

    return (
      <Context.Provider value={helpers}>
        { children }
      </Context.Provider>
    );
  }

  function useContextForm() {
    return useContext(Context);
  }

  return [FormProvider, useContextForm];
}
