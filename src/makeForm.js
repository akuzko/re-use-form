import React, { createContext, useContext } from "react";
import { useForm } from "./useForm";

export default function makeForm(config) {
  const {initial = {}, ...conf} = config;
  const Context = createContext({initial});

  // eslint-disable-next-line react/prop-types
  function FormProvider({children}) {
    const helpers = useForm(initial, conf);

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
