import { ethers, utils } from "ethers";

const lemmaPerpetualAbi = [
  "function setDepositInfo(address account, uint256 amount) external",
  "function mint(address account) public",
  "function withdraw(uint256 amount) external",
  "function getTotalCollateral() public view returns (uint256)",
];

class LemmaPerpetualService {
  contract;
  signerAddress;
  provider;

  constructor(address, provider, signerAddress) {
    if (signerAddress) {
      const signer = provider.getSigner();
      this.contract = new ethers.Contract(
        address,
        lemmaTokenAbi,
        provider
      ).connect(signer);
    } else {
      this.contract = new ethers.Contract(address, lemmaTokenAbi, provider);
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

export { LemmaTokenService };
