import { getAddress } from "ethers/lib/utils";

export const isAddress = (address) => {
  try {
    getAddress(address);
  } catch (e) {
    return false;
  }
  return true;
};

export const isContract = async (provider, address) => {
  const code = await provider.getCode(address);
  return code && code !== "0x";
};
