import React, { useState } from 'react';
import { ethers, BigNumber } from "ethers";
import { web3Modal } from '../utils';

const ConnectedWeb3Context = React.createContext(
  null
);

export const useConnectedWeb3Context = () => {
  const context = React.useContext(ConnectedWeb3Context);

  if (!context) {
    throw new Error('Component rendered outside the provider tree');
  }

  return context;
};

export const ConnectedWeb3 = ({ children }) => {
  const [state, setState] = useState({
    account: '',
    signer: null,
    provider: null,
    networkId: null,
    ethBalance: BigNumber.from(0),
    isConnected: false
  })

  const onConnect = async () => {
    const provider = await web3Modal.connect();
    const etherProvider = new ethers.providers.Web3Provider(provider)
    const signer = etherProvider.getSigner();
    const account = await signer.getAddress();
    const networkId = await signer.getChainId();
    const ethBalance = await signer.getBalance();

    setState({
      account,
      signer,
      provider,
      networkId,
      ethBalance,
      isConnected: true
    });

    // Subscribe to provider disconnection
    provider.on('disconnect', (error) => {
      console.log(error);
      setState({
        account: '',
        signer: null,
        provider: null,
        networkId: null,
        ethBalance: BigNumber.from(0),
        isConnected: false
      })
    });
  };

  const value = {
    ...state,
    onConnect
  };

  return (
    <ConnectedWeb3Context.Provider value={value}>
      {children}
    </ConnectedWeb3Context.Provider>
  );
};