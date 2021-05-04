import { ethers, utils } from "ethers";
import LemmaMainnet from "../abis/LemmaMainnet.json";

const lemmaMainAbi = LemmaMainnet.abi;

class LemmaMainService {
  contract;
  signerAddress;
  provider;

  constructor(address, provider, signerAddress) {
    if (signerAddress) {
      const signer = provider.getSigner();
      this.contract = new ethers.Contract(
        address,
        lemmaMainAbi,
        provider
      ).connect(signer);
    } else {
      this.contract = new ethers.Contract(address, lemmaMainAbi, provider);
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

  deposit = async (minimumUSDCAmountOut, value) => {
    const txObject = await this.contract.deposit(minimumUSDCAmountOut, {
      value: utils.parseEther(
        typeof value === "string" ? value : value.toString()
      ),
    });

    return txObject.hash;
  };

  setWithdrawalInfo = async (account, amount) => {
    const txObject = await this.contract.setWithdrawalInfo(account, {
      value: utils.parseEther(
        typeof amount === "string" ? amount : amount.toString()
      ),
    });

    return txObject.hash;
  };

  withdraw = async (account) => {
    const txObject = await this.contract.withdraw(account);

    return txObject.hash;
  };
}

export { LemmaMainService };
