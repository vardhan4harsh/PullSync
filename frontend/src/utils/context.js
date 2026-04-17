// OWNER: Garima Yadav
// App context for global state
import { createContext, useContext } from "react";

export const AppContext = createContext(null);
export const useAppContext = () => useContext(AppContext);
