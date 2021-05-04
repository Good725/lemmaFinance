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
        //We need the signerAddress to be null in case of provider is XDAI_URL for this to work
        provider ? null : account
      );
    }
  }, [account, isConnected, lemmaMainAddress]);
};
