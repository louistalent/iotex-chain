import React, {
    createContext,
    useContext,
    useReducer,
    useMemo,
    useCallback,
    useEffect,
} from "react";
import { ethers } from "ethers";
const WebContext = createContext();

export function useWebContext() {
    return useContext(WebContext);
}

function reducer(state, { type, payload }) {
    return {
        ...state,
        [type]: payload
    }
}
// 56  BSC
// 1   Ethereum

const INIT_STATE = {
    Loading: true,
    disconnect_able: false,
    signer: {},
    provider: {},
    balance: "0",
    Network: [],
    tokenName: 'iotex'
};


export default function Provider({ children }) {
    const [state, dispatch] = useReducer(reducer, INIT_STATE)


    return (
        <WebContext.Provider
            value={useMemo(
                () => [
                    state,
                    {
                        dispatch
                    }
                ],
                [state]
            )}
        >
            {children}
        </WebContext.Provider>
    );
}