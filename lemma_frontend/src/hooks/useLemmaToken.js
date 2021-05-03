import { useMemo } from "react";
import { LemmaTokenService } from "../services/lemmaToken";
import { useConnectedWeb3Context } from "../context";

export const useLemmaToken = (lemmaTokenAddress, provider = null) => {
  const {
    account,
    provider: defaultProvider,
    isConnected,
  } = useConnectedWeb3Context();

  return useMemo(() => {
    if (isConnected) {
      return new LemmaTokenService(
        lemmaTokenAddress,
        provider ? provider : defaultProvider,
        account
      );
    }
  }, [account, isConnected, lemmaTokenAddress]);
};
