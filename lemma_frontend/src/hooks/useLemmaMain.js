import { useMemo } from "react";
import { LemmaMainService } from "../services/lemmaMain";
import { useConnectedWeb3Context } from "../context";

export const useLemmaMain = (lemmaMainAddress, provider = null) => {
  const {
    account,
    provider: defaultProvider,
    isConnected,
  } = useConnectedWeb3Context();

  return useMemo(() => {
    if (isConnected) {
      return new LemmaMainService(
        lemmaMainAddress,
        provider ? provider : defaultProvider,
        account
      );
    }
  }, [account, isConnected, lemmaMainAddress]);
};
