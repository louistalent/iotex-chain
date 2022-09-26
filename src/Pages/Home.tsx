import React, { useEffect, useRef } from "react";
import Layout from "../components/Layout";
import Networks from "../config/networks.json";
import VirtualNetworks from "../config/static_networks.json";
import TokenList from "../config/tokenlist.json";
import { useWallet } from "../hooks/useWallet";

import useWallet_, {
  request,
  CONNECTED,
  CONNECTING,
  DISCONNECTED,
  ZERO,
  toEther,
  fromEther,
} from "../useWallet";
/* import { getApiUrl } from '../util'; */
import { BsChevronDown } from "react-icons/bs";
import {
  AiFillStar,
  AiOutlineStar,
  AiTwotoneStar,
  AiOutlineUp,
  AiOutlineQuestionCircle,
} from "react-icons/ai";
import { useWeb3React, UnsupportedChainIdError } from "@web3-react/core";
import { useStore } from "react-redux";
import "./Home.scss";

const ERR_NOACCOUNTS = "No selected address.";
const ERR_CHAINID = "Invalid chain id #:chainId";

const networks = Networks as { [chain: string]: NetworkTypes };

interface HomeStatus {
  query: string;
  submitLabel: string;
  loading: boolean;
}

interface TransactionDetails {
  providerFee: number;
  protocalFee: number;
  slippage: number;
  value: string;
  fee: number;
  receiveValue: number;
}

interface BaseStatus {
  prices: { [chain: string]: number };
  gasPrices: { [chain: string]: number };
  maxGasLimit: number;
}

const Home = () => {
  const { account } = useWeb3React();
  const { active, connect, chainId } = useWallet();
  const G = useWallet_();
  const L = G.L;
  const refMenu = React.useRef<HTMLUListElement>(null);
  // const refList = React.useRef<HTMLInputElement>(null)
  const refAmount = React.useRef<HTMLInputElement>(null);
  const [THCPrice, setTHCprice] = React.useState(Number);
  const [countTHCPrice, setCountTHCPrice] = React.useState<Number>(THCPrice);
  const [status, setStatus] = React.useState<HomeStatus>({
    query: "",
    submitLabel: "",
    loading: false,
  });

  const [txDetail, setTxDetail] = React.useState<TransactionDetails>({
    providerFee: 0,
    protocalFee: 0,
    slippage: 0,
    value: "",
    fee: 0,
    receiveValue: 0,
  });
  const set = (attrs: Partial<TransactionDetails>) =>
    setTxDetail({ ...txDetail, ...attrs });
  const [isPending, setPending] = React.useState(false);
  // const [issure, setIsSure] = React.useState(false);
  const [noTargetChain, setNotargetChain] = React.useState(false);
  const [tokenSelectModal, setTokenSelectModal] = React.useState(false);
  const [isActive, setIsActive] = React.useState("");
  const [isTransaction, setIsTransaction] = React.useState(false);
  const [selectedTokenOnChain, setSelectedTokenOnChain] = React.useState({
    name: "Token Select",
    img: "",
  });
  const [selectedTokenOnTargetChain, setSelectedTokenOnTargetChain] =
    React.useState({
      name: "Token Select",
      img: "",
    });
  const [base, setBase] = React.useState<BaseStatus>({
    prices: {},
    gasPrices: {},
    maxGasLimit: 1e5,
  });

  const updateStatus = (json) => setStatus({ ...status, ...json });

  React.useEffect(() => {
    try {
      if (!G.inited && !G.loading) {
        G.update({ loading: true });
        // request('/get-all-tokens').then(response => {
        // 	alert('backend call')
        // 	if (response && response.result) {
        // 		const res = response.result
        // 		console.log(res)
        // 		alert('res')
        // 		const coins = {} as CoinTypes
        // 		for (let chain in res) {
        // 			for (let i in res[chain]) {
        // 				const v = res[chain][i]
        // 				if (coins[v.symbol] === undefined)
        // 					coins[v.symbol] = {}

        // 				coins[v.symbol][chain.toUpperCase()] = { address: v.address, decimals: v.decimals }
        // 			}
        // 		}
        // 		checkPending()
        // 		G.update({ coins, ...G.getPending(), inited: true, loading: false })
        // 	} else {
        // 		alert('res no')

        // 		G.update({ loading: false })
        // 	}
        // })
      }
    } catch (error) {
      console.log(error);
    }
  }, []);

  React.useEffect(() => {
    if (isPending) return;
    let timer;
    try {
      timer = setTimeout(checkPending, 5000);
    } catch (error) {
      console.log(error);
    }
    return () => timer && clearTimeout(timer);
  }, [isPending]);

  // Chain check
  React.useEffect(() => {
    if (G.targetChain === G.chain) {
      G.update({ err: "Can`t bridge on the same chain" });
      updateStatus({ loading: false });
    } else {
      G.update({ err: "" });
      updateStatus({ loading: false });
    }
    // if (Number(G.chain) !== chainId) {
    // 	G.update({ err: 'Please change chain on your wallet. Connected chain ID : ' + chainId })
    // }
  }, [G.targetChain, G.chain]);

  //network gas fee
  const [time, setTime] = React.useState(+new Date());
  const proxy = process.env.REACT_APP_ENDPOINT || "";
  React.useEffect(() => {
    getInfo();
    const timer = setTimeout(() => setTime(+new Date()), 10000);
    return () => clearTimeout(timer);
  }, [time, G.chain]);
  const getInfo = async () => {
    try {
      const res = await request("/get-gas-info", { chain: G.chain });

      console.log(res?.result);
      console.log(Math.round(+new Date() / 1000), res?.result);
      setBase(res?.result);
    } catch (error) {
      console.log(error);
    }
  };
  const getReceivedValue = (
    chain: string,
    targetChain: string,
    token: string,
    amount: number
  ) => {
    if (base.gasPrices !== undefined) {
      const feeEther = (base.maxGasLimit * base.prices[chain]) / 1e9;
      // const decimals = networks[targetChain].decimals;
      // const fee = Number((feeEther * base.prices[targetChain] / THCPrice).toFixed(decimals < 6 ? decimals : 6))
      // if (!isNaN(fee)) {
      // const receiveValue = Number((amount - fee).toFixed(decimals < 6 ? decimals : 6))
      // return { receiveValue, fee }
      // }
      return { feeEther };
    }
    return { receiveValue: 0, fee: 0 };
  };

  const onChangeValueOnChain = (value: string) => {
    const { feeEther } = getReceivedValue(
      G.chain,
      G.targetChain,
      G.token,
      Number(value)
    );
    console.log(feeEther);
    set({ value, receiveValue: Number(value), fee: feeEther });
  };
  // React.useEffect(async()=>{
  // 	let estimateGas = await web3.eth.estimateGas({
  // 		"value": '0x0', // Only tokens
  // 		"data": contract.methods.transfer(toAddress, tokenAmount).encodeABI(),
  // 		"from": fromAddress,
  // 		"to": toAddress
  // 	});
  // },[])
  const THCprice = async () => {
    const url =
      "https://api.coinmarketcap.com/data-api/v3/cryptocurrency/detail/chart?id=14452&range=1H";
    const data = {
      url: url,
    };

    const result = await request("/flash-coin-price", { data });

    // const result = await fetch('',
    // 	{
    // 		method: 'GET',
    // 		headers: { 'content-type': 'application/json' },
    // 	});

    const priceresult: any = result;
    // priceresult.data.accuracyPoints[0].ypoint.settlementPrice
    console.log(" priceresult ");
    console.log(priceresult.data);

    // setTHCprice(
    //   priceresult.data.accuracyPoints[0].ypoint.settlementPrice.toFixed(8)
    // );
    // setCountTHCPrice(
    //   priceresult.data.accuracyPoints[0].ypoint.settlementPrice.toFixed(8)
    // );
  };

  const InputChainInfo = async () => {
    const token = G.token;
    const info = G.thccoins;
    const result = await request("/input-chain-info", { info, token });
    console.log("InputChainInfo succeed");

    console.log(result);
  };

  // Input chain info
  React.useEffect(() => {
    setTimeout(() => {
      THCprice();
      InputChainInfo();
    }, 2000);
  }, []);

  const [fake_dis, setFake_dis] = React.useState(true);
  const onChangeNetwork = (chain: string) => {
    ChainActive(chain);
    const _chain = "chain";
    if (chain === "IOTEX" || chain === "BSC" || chain === "ETH") {
      setFake_dis(true);

      const net = networks[chain];
      const chainId = net.chainId;
      const rpc = net.rpc;
      G.update({ [_chain]: chain });
      G.update({ chainIdMatch: chainId, rpc });
      G.changeNetwork(chainId);
    } else {
      setFake_dis(false);
      // G.update({ [_chain]: chain })
    }

    // if (refMenu && refMenu.current) {
    // 	refMenu.current.style.display = 'none'
    // 	setTimeout(() => (refMenu && refMenu.current && (refMenu.current.style.display = '')), 100)
    // }
  };
  const onChangeNetwork2 = (chain: string) => {
    ChainActive(chain);
    // setIsSure(true);
    const _chain = "targetChain";
    if (chain === "IOTEX" || chain === "BSC" || chain === "ETH") {
      setFake_dis(true);

      const net = networks[chain];
      const chainId = net.chainId;
      const rpc = net.rpc;
      G.update({ [_chain]: chain, chainId });
    } else {
      setFake_dis(false);

      // G.update({ [_chain]: chain })
    }
  };

  const swapChains = async () => {
    const net = networks[G.targetChain];
    const chainId = net.chainId;
    const rpc = net.rpc;

    const res = await G.changeNetwork(chainId);
    console.log("swapChains");
    console.log(res);
    if (res) {
      G.update({
        chain: G.targetChain,
        targetChain: G.chain,
        /* token, */ chainId,
        rpc,
      });
    }
  };
  const checkPending = async () => {
    try {
      if (!isPending) {
        setPending(true);
        const params1: { [chainId: string]: Array<string> } = {};
        const params2: Array<string> = [];
        for (let k in G.pending) {
          const v = G.pending[k];
          const confirmations = G.txs[k]?.confirmations || 0;
          if (networks[v.chain].confirmations > confirmations) {
            if (params1[v.chain] === undefined) params1[v.chain] = [];
            params1[v.chain].push(k);
          } else {
            if (G.txs[k] && !G.txs[k].err && !G.txs[k].tx) params2.push(k);
          }
        }
        if (Object.keys(params1).length) {
          const res = await Promise.all(
            Object.keys(params1).map((k) => G.check(k, params1[k]))
          );
          const txs: TxTypes = { ...G.txs };
          const now = Math.round(new Date().getTime() / 1000);
          for (let v of res) {
            if (v) {
              for (let k in v) {
                if (v[k] === -1) {
                  if (now - G.pending[k].created > 600)
                    txs[k] = { ...txs[k], err: true };
                } else {
                  txs[k] = { ...txs[k], confirmations: v[k] };
                }
              }
            }
          }
          G.setTxs(txs);
        }
        if (params2.length) {
          const rows = await request("/get-txs", params2);
          if (rows && Array.isArray(rows)) {
            const now = Math.round(new Date().getTime() / 1000);
            const txs: TxTypes = { ...G.txs };
            for (let v of rows) {
              if (v.tx || (v.err && now - G.pending[v.key].created > 600)) {
                txs[v.key] = {
                  ...txs[v.key],
                  tx: v.tx,
                  err: v.err,
                  fee: v.fee,
                };
              }
            }
            G.setTxs(txs);
          }
        }
        setPending(false);
      }
    } catch (err) {
      console.log(err);
    }
  };
  // const onChangeQuery = (query: string) => {
  // 	updateStatus({ query })
  // }
  // const onChangeToken = (token: string) => {
  // 	G.update({ token })
  // 	if (refList && refList.current) {
  // 		refList.current.checked = false
  // 	}
  // }
  const onChangeValue = (value: string) => {
    setCountTHCPrice(Number(value) * THCPrice);
    G.update({ value });
  };
  const submit = async () => {
    try {
      console.log(G.targetChain, G.chain);
      if (G.targetChain !== G.chain) {
        if (G.status === CONNECTED) {
          console.log(G.token);
          console.log(G.chain);
          console.log(G.coins);

          const token = G.thccoins[G.chain];
          const targetToken = G.thccoins[G.targetChain];

          const amount = Number(G.value);
          const value = fromEther(amount, token.decimal);

          if (token && amount > 0) {
            G.update({ err: "" });
            updateStatus({ loading: true, submitLabel: "checking balance..." });
            const rbalance = await G.balance(token.address);
            // const rbalance1 = G.targetChain === 'ICICB' ? value : await G.bridgebalance(G.targetChain, targetToken.address)
            const rbalance1 = await G.bridgebalance(
              G.targetChain,
              targetToken.address
            );
            if (rbalance !== undefined && rbalance1 !== undefined) {
              const balance = toEther(rbalance, token.decimal);
              const balance1 = toEther(rbalance1, targetToken.decimal);
              if (balance >= amount) {
                if (balance1 >= amount) {
                  let success = true;
                  if (token.address !== "-") {
                    //'-' is Native token address
                    updateStatus({
                      loading: true,
                      submitLabel: "checking allowance...",
                    });
                    const rApproval = await G.approval(token.address);
                    if (rApproval !== undefined) {
                      const approval = toEther(rApproval, token.decimal);
                      console.log(
                        "approval",
                        approval,
                        "decimal",
                        token.decimal
                      );
                      if (approval < amount) {
                        updateStatus({
                          loading: true,
                          submitLabel: "allow bridge contract ...",
                        });
                        let tx = await G.approve(token.address, value);
                        if (tx !== undefined) {
                          success = await G.waitTransaction(tx);
                        } else {
                          success = false;
                        }
                      }
                    } else {
                      success = false;
                    }
                  }
                  if (success) {
                    updateStatus({
                      loading: true,
                      submitLabel: "exchanging...",
                    });
                    const tx = await G.deposit(
                      token.address === "-" ? ZERO : token.address,
                      value,
                      networks[G.targetChain].chainId
                    );
                    if (tx !== undefined) {
                      updateStatus({
                        loading: true,
                        submitLabel: "confirming...",
                      });
                      G.setPending(tx, {
                        chain: G.chain,
                        targetChain: G.targetChain,
                        address: G.address,
                        token: G.token,
                        value: amount,
                        created: Math.round(new Date().getTime() / 1000),
                      });
                      await G.waitTransaction(tx);
                      G.update({ value: "" });
                    }
                  } else {
                    G.update({ err: "the transaction failed" });
                  }
                } else {
                  G.update({
                    err: "Sorry, there is not enough balance in the bridge store for swap.",
                  });
                }
              } else {
                G.update({ err: "You haven't enough balance for swap" });
              }
            }
          } else if (refAmount?.current) {
            refAmount.current.focus();
          }
          updateStatus({ loading: false });
        } else {
          updateStatus({ submitLabel: "Connecting..." });
          G.connect();
        }
      } else {
        G.update({ err: "Can`t bridge on the same chain" });
        updateStatus({ loading: false });
      }
    } catch (err: any) {
      G.update({ err: err.message });
      updateStatus({ loading: false });
    }
  };

  // @ts-ignore
  const chainSelectActive = useRef(null);

  // for design effect
  const ChainActive = (id: any) => {
    console.log(id);
    if (isActive !== "") {
      window.document.getElementById(`${isActive}`)?.classList.remove("active");
    }
    if (id !== "") {
      setIsActive(id);
      window.document.getElementById(`${id}`)?.classList.add("active");
    }
    // chainSelectActive.id.classList.toggle('active');
  };
  const TokenSelectNameImageUpdate = (value: string, para: boolean) => {
    if (para) {
      setSelectedTokenOnChain({ name: value, img: value.toLocaleLowerCase() });
    } else {
      setSelectedTokenOnTargetChain({
        name: value,
        img: value.toLocaleLowerCase(),
      });
    }
  };
  const CallTokenSelect = (value: string, para: boolean) => {
    setTokenSelectModal(false);
    TokenSelectNameImageUpdate(value, para);
  };

  const TokenSelect = (para: boolean) => {
    return (
      <>
        <div className="token-select-modal">
          <div
            className="token-select-modal-bg"
            onClick={() => setTokenSelectModal(false)}
          ></div>
          <div className="token-select-modal-body">
            <div className="p2">
              <div className="justify p1">
                <div className="">
                  <h3 style={{ margin: "0", color: "#f3ba2f" }}>Token List</h3>
                </div>
                <div
                  className="token-select-modal-cancel"
                  onClick={() => setTokenSelectModal(false)}
                >
                  X
                </div>
              </div>
              {/* <div className='justify p1'>
								<div className=''>
									<input placeholder='Search name or paste address' />
								</div>
							</div> */}
            </div>
            <div className="row">
              <div
                className="col-sm-4 col-md-3"
                style={{ borderTop: "1px grey solid" }}
              >
                <div
                  className="chain-list-side-bar"
                  style={{
                    background: "#2b2d2c",
                    padding: "10px",
                    height: `${
                      window.innerWidth <= 567
                        ? window.innerHeight - 90
                        : "100%"
                    }px`,
                  }}
                >
                  {/* virtual networks */}
                  {Object.keys(VirtualNetworks).map((k) => (
                    <a
                      key={k}
                      className="justify fd-c"
                      style={{ width: "100%" }}
                      onClick={(e: any) =>
                        para ? onChangeNetwork(k) : onChangeNetwork2(k)
                      }
                    >
                      <li
                        ref={chainSelectActive}
                        id={k}
                        className={"chain-select justify w10"}
                      >
                        <img
                          style={{ borderRadius: "50%" }}
                          className="icon"
                          width={"35px"}
                          height={"35px"}
                          src={`/networks/${VirtualNetworks[k].img}`}
                          alt={k}
                        />
                        <span className="tc">{k.toUpperCase()} Chain</span>
                      </li>
                    </a>
                  ))}
                </div>
              </div>
              <div
                className="col-sm-8 col-md-9 pr1 pl1"
                style={{ borderTop: "1px grey solid" }}
              >
                {fake_dis ? (
                  Object.keys(TokenList).map((key, index) => (
                    <div key={index} className="justify pr1">
                      <div
                        onClick={() => CallTokenSelect(key, para)}
                        className="justify mt2 w10 token-hover"
                      >
                        <div className="justify">
                          <img
                            className="icon"
                            width={"60px"}
                            src={`/select-token/${key.toLocaleLowerCase()}.png`}
                            alt={key}
                          />
                          &nbsp;&nbsp;&nbsp;&nbsp;
                          <h4
                            className=""
                            style={{ margin: "0", padding: "0" }}
                          >
                            {key} <br />
                            {TokenList[key].name}
                          </h4>
                        </div>
                        <div className="pr1">
                          <AiOutlineStar fontSize={"30px"} color="yellow" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <></>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };
  const pendingTxs: Array<any> = [];
  const targetToken = G.coins[G.token] && G.coins[G.token][G.targetChain];
  const supported = targetToken !== undefined;

  // const erc20 = networks[G.chain].erc20;
  // const query = status.query.toLowerCase();

  for (let k in G.pending) {
    pendingTxs.push({ key: k, ...G.pending[k] });
  }
  pendingTxs.sort((a, b) => b.created - a.created);

  // const nativeCoin = networks[G.chain].coin
  // const tokenArray: Array<string> = [nativeCoin];
  // for (let k in G.coins) {
  // 	if (k === nativeCoin) continue
  // 	const v = G.coins[k]
  // 	if (v[G.chain] !== undefined && v[G.targetChain] !== undefined) {
  // 		if (query !== '' && k.toLowerCase().indexOf(query) === -1) continue
  // 		tokenArray.push(k)
  // 	}
  // }
  let loading = G.status === CONNECTING || status.loading;

  // Wallet connect monitor
  React.useEffect(() => {
    let err = "";
    try {
      if (account && account.length) {
        G.update({ address: account, err: "" });
        if (chainId === networks[G.chain].chainId) {
          G.update({ status: CONNECTED, address: account, err: "" });
          return;
        } else {
          err = ERR_CHAINID.replace(":chainId", String(chainId));
          return;
        }
      } else {
        err = ERR_NOACCOUNTS;
        return;
      }
    } catch (error: any) {
      err = "  " + error.message;
    }
    G.update({ status: DISCONNECTED, address: "", err });
  }, [account]);

  return (
    <Layout className="home">
      <section>
        <div className="c ml3-md">
          <div className="panel swap">
            <div className="justify">
              <div className="justify">
                <div className="justify">
                  <img
                    alt=""
                    style={{ width: "35px" }}
                    src={`./networks/${G.chain}.svg`}
                  ></img>
                  <img
                    alt=""
                    style={{
                      width: "39px",
                      marginLeft: "-13px",
                      border: "3px black solid",
                      borderRadius: "50%",
                    }}
                    src={`./networks/${G.targetChain}.svg`}
                  ></img>
                </div>
                <div className="ml1">
                  <div className="justify">
                    <span className={`chain-font opa1i`}>Multichain</span>
                  </div>
                  <div className="justify">
                    <span className="chain-font">{G.chain}</span>
                    <span className="chain-font">
                      &nbsp;&nbsp;to&nbsp;&nbsp;
                    </span>
                    <span className="chain-font">{G.targetChain}</span>
                  </div>
                </div>
              </div>
              <div className=""></div>
            </div>
            {/* <div className="flex">
						<div className="c">
							{ViewNetwork(G.chain)}
						</div>
						<div className="c">
							{ViewNetwork2(G.targetChain)}
						</div>
					</div> */}
            {tokenSelectModal === true && (
              <>{noTargetChain ? TokenSelect(true) : TokenSelect(false)}</>
            )}
            <div className="dis-f jc-sb mt2">
              <div className="">
                <button
                  onClick={() => {
                    setNotargetChain(true);
                    setTokenSelectModal(true);
                  }}
                  className="token-select-btn"
                >
                  <div className="justify">
                    {selectedTokenOnChain.img ? (
                      <img
                        style={{ width: "20px", height: "20px" }}
                        alt={selectedTokenOnChain.name}
                        src={`/select-token/${selectedTokenOnChain.img}.png`}
                      />
                    ) : (
                      <></>
                    )}
                    &nbsp;
                    {selectedTokenOnChain.name}
                    &nbsp;
                    <BsChevronDown color="yellow" />
                  </div>
                </button>
              </div>
              <div className="dis-f fd-c">
                <input
                  ref={refAmount}
                  className="amount tr"
                  type="input"
                  value={G.value}
                  onChange={(e) => {
                    onChangeValue(e.target.value);
                    onChangeValueOnChain(e.target.value);
                  }}
                />
                <div className="tr input-price">{countTHCPrice} $</div>
              </div>
            </div>
            <div className="mt2">
              <div className="po-re before-af w10">
                <div className="swap-switcher">
                  <button onClick={() => swapChains()} className="switcher">
                    <img src="./img/swap.svg" alt=""></img>
                  </button>
                </div>
              </div>
            </div>
            <div className="dis-f jc-sb mt6">
              <div className="">
                <button
                  onClick={() => {
                    setNotargetChain(false);
                    setTokenSelectModal(true);
                  }}
                  className="token-select-btn"
                >
                  <div className="justify">
                    {selectedTokenOnTargetChain.img ? (
                      <img
                        style={{ width: "20px", height: "20px" }}
                        alt={selectedTokenOnTargetChain.name}
                        src={`/select-token/${selectedTokenOnTargetChain.img}.png`}
                      />
                    ) : (
                      <></>
                    )}
                    &nbsp;
                    {selectedTokenOnTargetChain.name}
                    &nbsp;
                    <BsChevronDown color="yellow" />
                  </div>
                </button>
              </div>
              <div className="dis-f fd-c">
                <input
                  ref={refAmount}
                  className="amount tr"
                  type="input"
                  value={G.value}
                  onChange={(e) => onChangeValue(e.target.value)}
                />
                <div className="tr input-price">{countTHCPrice} $</div>
              </div>
            </div>

            <div className="justify po-re mt5 pr2 pl2">
              <div className="dis-f fd-c jc-c ai-c tc">
                <img alt="" className="mauto" src="/logo.png" width={"35px"} />
                <span className="chain-font">{G.chain}</span>
              </div>
              <div className="flex1 dis-f fd-c jc-c ai-c tc">
                <div className="dashboard-line"></div>
                <br />
              </div>
              <div className="dis-f fd-c jc-c ai-c tc po-re">
                <img alt="" className="mauto" src="/logo.png" width={"35px"} />
                <br />
                <span className="chain-font flash-bridge">Bridge</span>
              </div>
              <div className="flex1 dis-f fd-c jc-c ai-c tc">
                <div className="dashboard-line"></div>
                <br />
              </div>
              <div className="dis-f fd-c jc-c ai-c tc">
                <img alt="" className="mauto" src="/logo.png" width={"35px"} />
                <span className="chain-font">{G.targetChain}</span>
              </div>
            </div>

            {G.inited ? (
              !supported ? (
                <p
                  style={{
                    color: "red",
                    backgroundColor: "#2b2f36",
                    padding: 10,
                  }}
                >{`We do not support ${
                  L["chain." + G.targetChain.toLowerCase()]
                }'s ${G.token} swap now.`}</p>
              ) : null
            ) : null}
            {/* <p style={{ color: 'red', backgroundColor: '#2b2f36', padding: 10 }}>{`We do not support ${G.targetChain}`}</p> */}

            {/* <div className="label" style={{ paddingTop: 20 }}>Amount</div>
					<div>
						<input ref={refAmount} className="amount" type="number" value={G.value} onChange={(e) => onChangeValue(e.target.value)} />
					</div> */}

            {G.value !== "" && targetToken ? (
              <p className="gray">
                You will receive ≈ {G.value}{" "}
                {G.token === "-" ? networks[G.chain].coin : G.token}{" "}
                <small>
                  (
                  {targetToken.address === "-"
                    ? "native token"
                    : networks[G.targetChain].erc20}
                  )
                </small>
              </p>
            ) : null}
            <div style={{ paddingTop: 20 }}>
              {G.address && G.address.length > 0 && G.status === CONNECTED && (
                <button
                  disabled={loading || supported || G.targetChain === G.chain}
                  className="primary full"
                  onClick={submit}
                >
                  {loading ? (
                    <div className="flex middle">
                      <div style={{ width: "1.5em" }}>
                        <div className="loader">Loading...</div>
                      </div>
                      <div>{status.submitLabel}</div>
                    </div>
                  ) : G.status === CONNECTED ? (
                    "SUBMIT"
                  ) : (
                    "SUBMIT"
                  )}
                </button>
              )}
              {G.status === CONNECTED ? (
                G.err ? (
                  <div className="dis-f ai-c">
                    {/* <img
                      src={G.walletSelect}
                      width="20px"
                      height="20px"
                      alt={"🦊"}
                    /> */}
                    <img
                      src="/img/metamask.png"
                      width="20px"
                      height="20px"
                      alt={"🦊"}
                    />
                    <p style={{ color: "red", padding: 10 }}>{G.err}</p>
                  </div>
                ) : (
                  <p style={{ color: "#35ff35" }}>
                    {G.address
                      ? "Your wallet: " +
                        G.address.slice(0, 10) +
                        "..." +
                        G.address.slice(-4)
                      : ""}
                  </p>
                )
              ) : (
                <></>
              )}
            </div>
            {G.status === CONNECTED || G.address.length > 0 ? (
              <>
                {pendingTxs.length ? (
                  <div style={{ paddingTop: 20 }}>
                    <p>
                      <b className="label">Your transactions:</b>
                    </p>
                    <div style={{ maxHeight: 300, overflowY: "auto" }}>
                      {pendingTxs.map((v, k) => (
                        <div
                          className={
                            "tx flex" + (G.txs[v.key]?.tx ? "" : " pending")
                          }
                          key={k}
                        >
                          <div className="c1">
                            <img
                              src={`/networks/${v.chain}.svg`}
                              style={{
                                border: "1px white solid",
                                borderRadius: "50%",
                                width: 16,
                                height: 16,
                                marginRight: 5,
                              }}
                              alt={v.chain}
                            />
                            <span> To </span>
                            <img
                              src={`/networks/${v.targetChain}.svg`}
                              style={{
                                border: "1px white solid",
                                borderRadius: "50%",
                                width: 16,
                                height: 16,
                                marginLeft: 5,
                              }}
                              alt={v.targetChain}
                            />
                          </div>
                          <code className="c2">
                            <a
                              className="cmd"
                              href={networks[v.chain].explorer + "/tx/" + v.key}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {v.key.slice(0, 10) + "..." + v.key.slice(-4)}
                            </a>
                          </code>
                          <code className="c3">
                            <img
                              src={`/logo.png`}
                              loading="lazy"
                              style={{ width: 20, height: 20, marginRight: 5 }}
                              alt={v.token}
                            />
                            <span title={G.txs[v.key]?.fee || ""}>
                              {v.value}
                            </span>
                          </code>

                          <div className="c4" style={{ textAlign: "right" }}>
                            {G.txs[v.key] ? (
                              G.txs[v.key].tx ? (
                                <a
                                  className="cmd"
                                  href={
                                    networks[v.targetChain].explorer +
                                    "/tx/" +
                                    G.txs[v.key].tx
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  view result
                                </a>
                              ) : G.txs[v.key].err ? (
                                <code style={{ color: "red" }}>error</code>
                              ) : (
                                <code style={{ color: "#76808f" }}>
                                  {G.txs[v.key].confirmations >=
                                  networks[v.chain].confirmations
                                    ? "processing…"
                                    : G.txs[v.key].confirmations +
                                      " / " +
                                      networks[v.chain].confirmations}
                                </code>
                              )
                            ) : (
                              <code style={{ color: "#76808f" }}>
                                confirming...
                              </code>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <></>
            )}
          </div>
        </div>
      </section>

      {/* if G.address&&token is selected */}
      {/* Transaction details */}
      {/* {G.address && G.address.length > 0 && G.status === CONNECTED && (
        <section>
          <div className="c ml3-md">
            <div
              className={`panel2 transaction-detail ${
                isTransaction ? "trans-bg" : ""
              }`}
            >
              <div className="top-section tc dis-f">
                <a
                  onClick={() => {
                    setIsTransaction(!isTransaction);
                  }}
                  className="dis-f ai-c mauto"
                >
                  <AiOutlineUp
                    style={{ fontSize: "20px", cursor: "pointer" }}
                    color="#f0b90b"
                  />
                  &nbsp;&nbsp;
                  <span
                    style={{ color: "#f0b90b" }}
                    className="chain-font cu-po"
                  >
                    Transaction details
                  </span>
                </a>
              </div>
              <div
                className={`transaction-effect ${
                  isTransaction ? "transaction-show" : "transaction-none"
                }`}
              >
                <div className="middle-section">
                  <div className="justify mt1 mb1">
                    <div className="justify">
                      <span
                        className={`chain-font opa1i ${
                          txDetail.fee === 0 ? "main-color" : ""
                        }`}
                      >
                        {" "}
                        Network fee{" "}
                      </span>
                      &nbsp;&nbsp;
                      <div className="tooltip justify">
                        <span className="tooltiptext">
                          Gas fee in target network taken instabletoken of
                          source
                        </span>
                        <AiOutlineQuestionCircle
                          color="#f0b90b"
                          fontSize={"22px"}
                        />
                      </div>
                    </div>
                    <span
                      className={`chain-font opa1i ${
                        txDetail.fee === 0 ? "main-color" : ""
                      }`}
                    >
                      {txDetail.fee}&nbsp;{networks[G.chain].coin}
                    </span>
                  </div>

                  <div className="justify mt1 mb1">
                    <div className="justify">
                      <span
                        className={`chain-font opa1i ${
                          txDetail.providerFee === 0 ? "main-color" : ""
                        }`}
                      >
                        {" "}
                        Provider fee{" "}
                      </span>
                      &nbsp;&nbsp;
                      <div className="tooltip justify">
                        <span className="tooltiptext">
                          {" "}
                          We don't require a provider fee for users
                        </span>
                        <AiOutlineQuestionCircle
                          color="#f0b90b"
                          fontSize={"22px"}
                        />
                      </div>
                    </div>
                    <span
                      className={`chain-font opa1i ${
                        txDetail.providerFee === 0 ? "main-color" : ""
                      }`}
                    >
                      {" "}
                      {txDetail.providerFee}%{" "}
                    </span>
                  </div>

                  <div className="justify mt1 mb1">
                    <div className="justify">
                      <span
                        className={`chain-font opa1i ${
                          txDetail.protocalFee === 0 ? "main-color" : ""
                        }`}
                      >
                        {" "}
                        Protocal fee{" "}
                      </span>
                      &nbsp;&nbsp;
                      <div className="tooltip justify">
                        <span className="tooltiptext">
                          We don't require a protocal fee for users
                        </span>
                        <AiOutlineQuestionCircle
                          color="#f0b90b"
                          fontSize={"22px"}
                        />
                      </div>
                    </div>
                    <span
                      className={`chain-font opa1i ${
                        txDetail.protocalFee === 0 ? "main-color" : ""
                      }`}
                    >
                      {" "}
                      {txDetail.protocalFee}%{" "}
                    </span>
                  </div>
                </div>
                <div className="ml1 bottom-section">
                  <div className="justify">
                    <span className="chain-font">
                      You will receive {G.token} token at this address
                    </span>
                    <div className="justify">
                      <a
                        className="chain-font white"
                        href={`https://bscscan.com/address/${G.address}`}
                        target={"_blank"}
                      >
                        {G.address && (
                          <span className="chain-font">
                            {G.address.slice(0, 5) +
                              "..." +
                              G.address.slice(
                                G.address.length - 5,
                                G.address.length
                              )}
                          </span>
                        )}
                      </a>
                      &nbsp;&nbsp;
                      <a
                        href={`https://bscscan.com/address/${G.address}`}
                        target={"_blank"}
                      >
                        <img
                          src="/img/scan.png"
                          style={{
                            borderRadius: "50%",
                            border: "0px black solid",
                          }}
                          width="25px"
                          height="25px"
                          alt="scan logo"
                        ></img>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )} */}
    </Layout>
  );
};

export default Home;

// ,
//     "CRONOS-TEST": {
//         "bridge": "",
//         "chainId": 338,
//         "coin": "tCRO",
//         "decimals": 18,
//         "confirmations": 12,
//         "blocktime": 3000,
//         "rpc": "https://evm-t3.cronos.org",
//         "explorer": "https://cronos.org/explorer/testnet3",
//         "erc20": "BEP20"
//     }
