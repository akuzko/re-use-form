import React, { createContext, useContext } from "react";
import { useForm } from "./useForm";
import { mergeConfig } from "./config";

export default function makeForm(config) {
  const {initial = {}, ...conf} = config;
  const Context = createContext({initial});

  // eslint-disable-next-line react/prop-types
  function FormProvider({config, children}) {
    const helpers = useForm(initial, {
      deps: [config],
      ...mergeConfig(conf, config)
    });

    return (
      <Context.Provider value={ helpers }>
        { children }
      </Context.Provider>
    );
  }

  function useContextForm() {
    return useContext(Context);
  }

  return [FormProvider, useContextForm];
}
