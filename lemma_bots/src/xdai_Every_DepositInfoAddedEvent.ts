// Import dependencies available in the autotask environment
import { RelayerParams } from 'defender-relay-client/lib/relayer';
import { DefenderRelayProvider } from 'defender-relay-client/lib/ethers';
import { BigNumber, ethers } from 'ethers';

// Import an ABI which will be embedded into the generated js
import IERC20 from '@openzeppelin/contracts/build/contracts/IERC20.json';
import LemmaToken from "./abis/LemmaToken.json";
import addresses from "./addresses.json";
// import { id } from '@ethersproject/hash';
// import { isGetAccessor } from 'typescript';
import axios from 'axios';
// import Web3 from "web3";


//TODO: use the same biconomy keys for both files
//move it to a .json file
const biconomyApiKey = 'Aj47G_8mq.20f2cf98-9696-4125-89d8-379ee4f11f39';
const biconomyMethodAPIKey = 'bf288df0-47d1-4ede-ac83-2a897c26b6e1';
const headers = {
  'x-api-key': biconomyApiKey,
  'Content-Type': 'application/json',
};


// Entrypoint for the Autotask
export async function handler(credentials: RelayerParams) {
  const provider = new DefenderRelayProvider(credentials);
  // const web3Provider = new Web3.providers.HttpProvider("https://rpc.xdaichain.com/")
  // const provider = new ethers.providers.Web3Provider(web3Provider)
  const lemmaToken = new ethers.Contract(addresses.xDAIMainnet.lemmaxDAI, LemmaToken.abi, provider);

  const latestBlockNumber: number = await provider.getBlockNumber();
  const eventFilter: ethers.EventFilter = lemmaToken.filters.DepositInfoAdded();
  //if the last 30 blocks (5 sec block time)  had the depositInfoAdded 
  const events: ethers.Event[] = await lemmaToken.queryFilter(eventFilter, -6000);
  console.log(events.length, "events found")
  for (let i = events.length - 1; i >= 0; i--) {
    const account = events[i].args.account;
    const amount: BigNumber = events[i].args.amount;
    const amountOnLemma: BigNumber = await lemmaToken.depositInfo(account);
    console.log("seeing if mint transaction is necessary");
    if (!amountOnLemma.isZero()) {
      const apiData = {
        'userAddress': '',
        // 'from': '',
        'to': '',
        // 'gasLimit': '',
        'params': Array(0),
        'apiId': biconomyMethodAPIKey,
      };

      apiData.userAddress = ethers.constants.AddressZero;
      // apiData.from = accounts[0];
      apiData.to = lemmaToken.address;
      apiData.params = [account];
      console.log(apiData)
      console.log("sending mint transaction using biconomy for ", account);
      try {
        await axios({ method: 'post', url: 'https://api.biconomy.io/api/v2/meta-tx/native', headers: headers, data: apiData });
      }
      catch (e) {
        console.log(e)
        console.log("sending mint transaction for ", account, " failed");
      }
      //tell biconomy to make a mint transaction
    } else {
      console.log("not necessary")
    }
  }
  // const amount = await lemmaToken.
}

// Sample typescript type definitions
type EnvInfo = {
  API_KEY: string;
  API_SECRET: string;
}

// To run locally (this code will not be executed in Autotasks)
if (require.main === module) {
  require('dotenv').config();
  const envInfo: EnvInfo = {
    API_KEY: "AmkmDkyCAWFo8vgAYB5NHoSKRJAYxqHH",
    API_SECRET: "CWaiLRX5PPdyH5ZYJKgFaNHKJ58N9WAxWm8R6PAGs6h2km1cng6PszKooajqYnug"
  }
  // const { API_KEY: apiKey, API_SECRET: apiSecret } = process.env as EnvInfo;
  const { API_KEY: apiKey, API_SECRET: apiSecret } = envInfo;
  handler({ apiKey, apiSecret })
    .then(() => process.exit(0))
    .catch((error: Error) => { console.error(error); process.exit(1); });
}