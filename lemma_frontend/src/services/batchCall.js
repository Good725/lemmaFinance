import { ethers, utils } from "ethers";
import BatchCall from "../abis/Upkaran-BatchCalls.json";

const batchCallAbi = BatchCall.abi;

class BatchCallService {
    contract;
    signerAddress;
    provider;

    constructor(address, provider, signerAddress) {
        if (signerAddress) {
            const signer = provider.getSigner();
            this.contract = new ethers.Contract(
                address,
                batchCallAbi,
                provider
            ).connect(signer);
        } else {
            this.contract = new ethers.Contract(address, batchCallAbi, provider);
        }
        this.signerAddress = signerAddress;
        this.provider = provider;
    }

    get address() {
        return this.contract.address;
    }

    get instance() {
        return this.contract;
    }

    batch = async (calls) => {
        const txObject = await this.contract.batch(calls);
        return txObject.hash;
    };
}

export { BatchCallService };
