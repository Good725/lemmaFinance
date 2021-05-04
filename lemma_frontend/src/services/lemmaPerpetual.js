import { ethers } from "ethers";
import LemmaPerpetual from "../abis/LemmaPerpetual.json";

const lemmaPerpetualAbi = LemmaPerpetual.abi;
class LemmaPerpetualService {
  contract;
  signerAddress;
  provider;

  constructor(address, provider, signerAddress) {
    if (signerAddress) {
      const signer = provider.getSigner();
      this.contract = new ethers.Contract(
        address,
        lemmaPerpetualAbi,
        provider
      ).connect(signer);
    } else {
      this.contract = new ethers.Contract(address, lemmaPerpetualAbi, provider);
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

  setDepositInfo = async (account, amount) => {
    const txObject = await this.contract.setDepositInfo(account, amount);

    return txObject.hash;
  };

  mint = async (account) => {
    const txObject = await this.contract.mint(account);

    return txObject.hash;
  };

  withdraw = async (amount) => {
    const txObject = await this.contract.withdraw(amount);

    return txObject.hash;
  };

  getTotalCollateral = async () => {
    return await this.contract.getTotalCollateral();
  };
}

export { LemmaPerpetualService };
