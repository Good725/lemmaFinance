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

const initialState = {
  account: '',
  signer: null,
  provider: null,
  networkId: null,
  ethBalance: BigNumber.from(0),
  isConnected: false,
  rawProvider: null
};

export const ConnectedWeb3 = ({ children }) => {
  const [state, setState] = useState(initialState);

  const syncState = async (provider) => {
    const ethersProvider = new ethers.providers.Web3Provider(provider);
    const signer = ethersProvider.getSigner();
    const account = await signer.getAddress();
    const networkId = await signer.getChainId();
    const ethBalance = await signer.getBalance();

    setState({
      account,
      signer,
      provider: ethersProvider,
      networkId,
      ethBalance,
      isConnected: true,
      rawProvider: provider
    });
  };

  const onConnect = async () => {
    const provider = await web3Modal.connect();
    syncState(provider);

    provider.on("accountsChanged", () => {
      syncState(provider);
    });

    // Subscribe to chainId change
    provider.on("chainChanged", () => {
      syncState(provider);
    });

    // Subscribe to provider disconnection
    provider.on('disconnect', (error) => {
      console.log(error);
      setState(initialState);
    });
  };

  const onDisconnect = async () => {
    setState(initialState);
    await web3Modal.clearCachedProvider();
    
  }

  const value = {
    ...state,
    onConnect,
    onDisconnect
  };

  return (
    <ConnectedWeb3Context.Provider value={value}>
      {children}
    </ConnectedWeb3Context.Provider>
  );
};