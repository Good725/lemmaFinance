import { ethers } from "ethers";
//We need the ABIs to follow the same names as in the contract and typing this maually is not a good idea
//for example :   "function balanceOf(uint256 account) public view returns (uint256)" was supposed to be "  "function balanceOf(address account) public view returns (uint256)", so it was giving errors
import LemmaToken from "../abis/LemmaToken.json";

const lemmaTokenAbi = LemmaToken.abi;

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

  depositInfo = async (account) => {
    return await this.contract.depositInfo(account);
  };
}

export { LemmaTokenService };
