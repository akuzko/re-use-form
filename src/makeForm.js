import React, { createContext, useContext } from "react";
import { useForm } from "./useForm";

export default function makeForm(mainConfig) {
  const Context = createContext({attrs: mainConfig.initial});

  // eslint-disable-next-line react/prop-types
  function FormProvider({config, children}) {
    const helpers = useForm(mainConfig);

    helpers.useConfig(() => config, [config]);

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
