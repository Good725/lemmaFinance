import { ethers, utils } from "ethers";
import { isAddress, isContract } from "../utils";

const erc20Abi = [
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address marketMaker) external view returns (uint256)",
  "function symbol() external view returns (string)",
  "function name() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function transferFrom(address sender, address recipient, uint256 amount) public returns (bool)",
  "function transfer(address to, uint256 value) public returns (bool)",
];

class ERC20Service {
  provider;
  contract;

  constructor(provider, signerAddress, tokenAddress) {
    this.provider = provider;
    if (signerAddress) {
      const signer = provider.getSigner();
      this.contract = new ethers.Contract(
        tokenAddress,
        erc20Abi,
        provider
      ).connect(signer);
    } else {
      this.contract = new ethers.Contract(tokenAddress, erc20Abi, provider);
    }
  }

  get address() {
    return this.contract.address;
  }

  /**
   * @returns A boolean indicating if `spender` has enough allowance to transfer `neededAmount` tokens from `spender`.
   */
  hasEnoughAllowance = async (owner, spender, neededAmount) => {
    const allowance = await this.contract.allowance(owner, spender);
    return allowance.gte(neededAmount);
  };

  /**
   * @returns The allowance given by `owner` to `spender`.
   */
  allowance = async (owner, spender) => {
    return this.contract.allowance(owner, spender);
  };

  /**
   * Approve `spender` to transfer `amount` tokens on behalf of the connected user.
   */
  approve = async (spender, amount) => {
    const transactionObject = await this.contract.approve(spender, amount, {
      value: "0x0",
    });
    console.log(`Approve transaccion hash: ${transactionObject.hash}`);
    return this.provider.waitForTransaction(transactionObject.hash);
  };

  /**
   * Approve `spender` to transfer an "unlimited" amount of tokens on behalf of the connected user.
   */
  approveUnlimited = async (spender) => {
    const transactionObject = await this.contract.approve(
      spender,
      ethers.constants.MaxUint256,
      {
        value: "0x0",
      }
    );
    console.log(
      `Approve unlimited transaccion hash: ${transactionObject.hash}`
    );
    return this.provider.waitForTransaction(transactionObject.hash);
  };

  getBalanceOf = async (address) => {
    return this.contract.balanceOf(address);
  };

  hasEnoughBalanceToFund = async (owner, amount) => {
    const balance = await this.contract.balanceOf(owner);

    return balance.gte(amount);
  };

  isValidErc20 = async () => {
    try {
      if (!isAddress(this.contract.address)) {
        throw new Error("Is not a valid erc20 address");
      }

      if (!isContract(this.provider, this.contract.address)) {
        throw new Error("Is not a valid contract");
      }

      const [decimals, symbol] = await Promise.all([
        this.contract.decimals(),
        this.contract.symbol(),
      ]);

      return !!(decimals && symbol);
    } catch (err) {
      console.error(err.message);
      return false;
    }
  };

  getProfileSummary = async () => {
    let decimals;
    let symbol;
    try {
      [decimals, symbol] = await Promise.all([
        this.contract.decimals(),
        this.contract.symbol(),
      ]);
    } catch {
      decimals = 18;
      symbol = "MKR";
    }

    return {
      address: this.contract.address,
      decimals,
      symbol,
    };
  };

  static encodeTransferFrom = (from, to, amount) => {
    const transferFromInterface = new utils.Interface(erc20Abi);

    return transferFromInterface.encodeFunctionData("transferFrom", [
      from,
      to,
      amount,
    ]);
  };

  static encodeTransfer = (to, amount) => {
    const transferInterface = new utils.Interface(erc20Abi);

    return transferInterface.encodeFunctionData("transfer", [to, amount]);
  };

  static encodeApprove = (spenderAccount, amount) => {
    const approveInterface = new utils.Interface(erc20Abi);

    return approveInterface.encodeFunctionData("approve", [
      spenderAccount,
      amount,
    ]);
  };

  static encodeApproveUnlimited = (spenderAccount) => {
    const approveInterface = new utils.Interface(erc20Abi);

    return approveInterface.encodeFunctionData("approve", [
      spenderAccount,
      ethers.constants.MaxUint256,
    ]);
  };
}

export { ERC20Service };
