import { toast } from 'react-toastify';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import { InjectedConnector } from '@web3-react/injected-connector';
import { WalletLinkConnector } from '@web3-react/walletlink-connector';


export const errHandler = (err: any) => {
	if (err) {
		console.log(err)
		if (err.code === 4001) {
			tips("you have cancelled the subscription")
		} else if (err.code === 'NETWORK_ERROR') {
			tips("Please check your network connection!")
		} else {
			tips(err.message)
		}
	} else {
		console.log("ignorant error")
		tips("ignorant error")
	}
}

export const tips = (html: string) => {
	toast(html, {
		position: "top-right",
		autoClose: 4000,
	});
}
export const NF = (num: number, p: number = 2) => Number(num).toFixed(p).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
export const TF = (time: number, offset: number = 2) => {
	let iOffset = Number(offset);
	let date = time === undefined ? new Date(Date.now() * 1000 + (3600000 * iOffset)) : (typeof time === 'number' ? new Date(time * 1000 + (3600000 * iOffset)) : new Date(+time + (3600000 * iOffset)));
	let y = date.getUTCFullYear();
	let m = date.getUTCMonth() + 1;
	let d = date.getUTCDate();
	let hh = date.getUTCHours();
	let mm = date.getUTCMinutes();
	let ss = date.getUTCSeconds();
	let dt = ("0" + m).slice(-2) + "-" + ("0" + d).slice(-2);
	let tt = ("0" + hh).slice(-2) + ":" + ("0" + mm).slice(-2) + ":" + ("0" + ss).slice(-2);
	return y + '-' + dt + ' ' + tt;
}

export const copyToClipboard = (text: string) => {
	var textField = document.createElement('textarea')
	textField.innerText = text
	document.body.appendChild(textField)
	textField.select()
	document.execCommand('copy')
	textField.remove()
	tips(text);
};



// export const NETWORK_CHAIN_IDS = {
// 	bsc: 56,
// 	polygon: 137,
// 	avalanch: 43114,
// 	etherum: 1,
// 	fantom: 250,
// 	cronos: 25,
// 	abitrum: 42161,
// 	aurora: 1313161554,
// 	moonriver: 1285,
// 	hamony: 1666600000,
// 	Moonbeam: 1284,
// 	ropsten: 3,
// 	rinkeby: 4,
// 	goerli: 5,
// 	kovan: 42,
// 	localhost: 1337,
// 	polygon_test: 80001,
// 	bsc_test: 97,
// 	cronos_test: 338,

//algorand , polkadot
// };
export const NETWORK_CHAIN_IDS = [56, 137, 43114, 1, 250, 25, 42161, 1313161554, 1285, 1666600000, 1284, 3, 4, 5, 42, 1337, 80001, 97, 338];

export const INFURA_ID = '9aa3d95b3bc440fa88ea12eaa4456161';
export const INFURA_ENDPOINT = 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';
export const walletconnect = new WalletConnectConnector({
	infuraId: INFURA_ID,
	bridge: 'https://bridge.walletconnect.org',
	supportedChainIds: NETWORK_CHAIN_IDS,
	rpc: { 1: INFURA_ENDPOINT },
	qrcode: true,
	// @ts-ignore
	pollingInterval: 8000,
});

export const injected = new InjectedConnector({
	supportedChainIds: NETWORK_CHAIN_IDS
});

export const walletlink = new WalletLinkConnector({
	url: INFURA_ENDPOINT,
	appName: 'Flash Bridge',
	supportedChainIds: NETWORK_CHAIN_IDS,
});
