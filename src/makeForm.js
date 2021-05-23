import React, { createContext, useContext, useEffect } from 'react';
import { useForm } from './useForm';

export default function makeForm(mainConfig = {}) {
  const Context = createContext({ attrs: mainConfig.initial });

  // eslint-disable-next-line react/prop-types
  function FormProvider({ config, children, attrs, onChange, onSet }) {
    if (attrs && !mainConfig.initial) {
      mainConfig.initial = attrs;
    }

    const helpers = useForm(mainConfig, config);
    const { attrs: formAttrs, setFormAttrs, _amendInitialConfig, _action } = helpers;

    useEffect(() => {
      if (config) {
        _amendInitialConfig(config);
      }
    }, [config]);

    useEffect(() => {
      if (_action?.isAttrUpdate && onChange && !_action._processed) {
        _action._processed = true;
        onChange(formAttrs);
      } else if (attrs && attrs !== formAttrs) {
        onSet((...args) => setFormAttrs(attrs, ...args), { attrs: formAttrs, nextAttrs: attrs });
      }
    }, [attrs, formAttrs, _action, onChange, onSet]);

    return (
      <Context.Provider value={helpers}>
        { children }
      </Context.Provider>
    );
  }

  FormProvider.defaultProps = {
    onSet: (setAttrs) => setAttrs()
  };

  function useContextForm() {
    return useContext(Context);
  }

  return [FormProvider, useContextForm];
}
