import { ethers, utils } from "ethers";

const lemmaMainAbi = [
  "function deposit(uint256 minimumUSDCAmountOut) external payable",
  "function setWithdrawalInfo(address account, uint256 amount) external",
  "function withdraw(address account) public",
];

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

  get contract() {
    return this.contract;
  }

  deposit = async (minimumUSDCAmountOut, value) => {
    const txObject = await this.contract.deposit(minimumUSDCAmountOut, {
      value: utils.parseEther(value),
    });

    return txObject.hash;
  };

  setWithdrawalInfo = async (account, amount) => {
    const txObject = await this.contract.setWithdrawalInfo(account, {
      value: utils.parseEther(amount),
    });

    return txObject.hash;
  };

  withdraw = async (account) => {
    const txObject = await this.contract.withdraw(account);

    return txObject.hash;
  };
}

export { LemmaMainService };
