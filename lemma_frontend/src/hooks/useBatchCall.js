import { useMemo } from "react";
import { BatchCallService } from "../services/batchCall";
import { useConnectedWeb3Context } from "../context";

export const useBatchCall = (BatchCallAddress, provider = null) => {
    const {
        account,
        provider: defaultProvider,
        isConnected,
    } = useConnectedWeb3Context();

    return useMemo(() => {
        if (isConnected) {
            return new BatchCallService(
                BatchCallAddress,
                provider ? provider : defaultProvider,
                //We need the signerAddress to be null in case of provider is XDAI_URL for this to work
                provider ? null : account
            );
        }
    }, [account, isConnected, defaultProvider, provider, BatchCallAddress]);
};
