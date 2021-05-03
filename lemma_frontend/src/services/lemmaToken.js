import { ethers } from "ethers";

const lemmaTokenAbi = [
  "function setDepositInfo(address account, uint256 amount) external",
  "function mint(address account) public",
  "function withdraw(uint256 amount) external",
  "function balanceOf(uint256 account) public view returns (uint256)",
  "function totalSupply() public view returns (uint256)",
];

class LemmaTokenService {
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

  balanceOf = async (account) => {
    return await this.contract.balanceOf(account);
  };

  totalSupply = async () => {
    return await this.contract.totalSupply();
  };
}

export { LemmaTokenService };
