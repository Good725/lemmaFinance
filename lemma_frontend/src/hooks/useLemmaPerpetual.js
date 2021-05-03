import { useMemo } from "react";
import { LemmaPerpetualService } from "../services/lemmaPerpetual";
import { useConnectedWeb3Context } from "../context";

export const useLemmaPerpetual = (lemmaPerpetualAddress, provider = null) => {
  const {
    account,
    provider: defaultProvider,
    isConnected,
  } = useConnectedWeb3Context();

  return useMemo(() => {
    if (isConnected) {
      return new LemmaPerpetualService(
        lemmaPerpetualAddress,
        provider ? provider : defaultProvider,
        account
      );
    }
  }, [account, isConnected, lemmaPerpetualAddress]);
};
