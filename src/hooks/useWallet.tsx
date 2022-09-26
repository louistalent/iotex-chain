import { useWeb3React, UnsupportedChainIdError } from '@web3-react/core';

import { injected, walletconnect, walletlink, tips } from '../util';
import Web3 from 'web3';
import {
    NoEthereumProviderError,
    UserRejectedRequestError as UserRejectedRequestErrorInjected,
} from '@web3-react/injected-connector';
import { UserRejectedRequestError as UserRejectedRequestErrorWalletConnect } from '@web3-react/walletconnect-connector';
import { useEffect } from 'react';

const handleError = (error: any) => {
    if (error instanceof NoEthereumProviderError) {
        return tips(
            'No Ethereum browser extension detected, install MetaMask on desktop or visit from a dApp browser on mobile.'
        );
    } else if (error instanceof UnsupportedChainIdError) {
        return tips("Network Error, Please connect to BSC Mainnet");
        console.log(error);
    } else if (
        error instanceof UserRejectedRequestErrorInjected ||
        error instanceof UserRejectedRequestErrorWalletConnect
    ) {
        return tips('Please authorize this website to access your BSC account.');
    } else if ((error).code === -32002) {
        return tips('Already processing ethereum request Accounts. Please accept the request.');
    } else {
        console.error(error.toString());
        return tips('An unknown error occurred. Check the console for more details.');
    }
};

export const useWallet = () => {
    const { activate, connector, ...props } = useWeb3React();
    useEffect(() => {
        const { ethereum } = window;

        if (ethereum) {
            (async () => {
                try {
                    // @ts-ignore
                    const web3 = new Web3(ethereum.currentProvider || (window).web3.currentProvider);

                    const accounts = await web3.eth.getAccounts();
                    if (accounts.length > 0) {
                        await activate(injected, (error) => handleError(error));
                    } else if (accounts.length > 0) {
                        return tips('Please Connect Metamask Wallet');
                    }
                } catch (err) {
                    // Handle Error
                    handleError(err);
                }
            })();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const connect = async (type: any) => {
        try {

            if (type === 'injected') {
                const { ethereum } = window;
                // @ts-ignore
                if (window.web3.currentProvider.isMetaMask) {
                    console.log("Metamask is installed");
                } else {
                    window.location.href = "https://metamask.io/download";
                }
                if (!ethereum) {
                    return tips(
                        'No Ethereum browser extension detected, install MetaMask on desktop or visit from a dApp browser on mobile.'
                    );
                }
                return await activate(injected, undefined, true);
            }

            if (type === 'walletconnect') {
                console.log("wallet connection", walletconnect);
                // @ts-ignore
                return await activate(walletconnect, undefined, true, (error) => handleError(error));
            }

            if (type === 'walletlink') {
                // @ts-ignore
                return await activate(walletlink, undefined, true, (error) => handleError(error));
            }
        } catch (err) {
            console.log('Connect wallet err', err);

            // @ts-ignore
            walletconnect.walletConnectProvider = null;
            handleError(err);

        }
    };

    return { ...props, connector, connect };
};




