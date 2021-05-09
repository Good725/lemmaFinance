// Import dependencies available in the autotask environment
import { RelayerParams } from 'defender-relay-client/lib/relayer';
import { DefenderRelayProvider } from 'defender-relay-client/lib/ethers';
import { BigNumber, ethers } from 'ethers';

// Import an ABI which will be embedded into the generated js
import IERC20 from '@openzeppelin/contracts/build/contracts/IERC20.json';
import LemmaToken from "./abis/LemmaToken.json";
import addresses from "./addresses.json";
import { id } from '@ethersproject/hash';
import { isGetAccessor } from 'typescript';
import axios from 'axios';


//TODO: use the same biconomy keys for both files
//move it to a .json file
const biconomyApiKey = 'Aj47G_8mq.20f2cf98-9696-4125-89d8-379ee4f11f39';
const biconomyMethodAPIKey = 'b9e3a7f2-b78a-416c-b057-d8a36ba76400';
const headers = {
  'x-api-key': biconomyApiKey,
  'Content-Type': 'application/json',
};


// // Entrypoint for the Autotask
// export async function handler(params: any) {
//   // const provider = new DefenderRelayProvider(credentials);
//   const payload = params.request.body;
//   const transaction = payload.transaction;
//   const matchReasons = payload.matchReasons;
//   const sentinel = payload.sentinel;
//   const abi = sentinel.abi;

//   const provider = ethers.getDefaultProvider("https://rough-frosty-dream.xdai.quiknode.pro/40ffd401477e07ef089743fe2db6f9f463e1e726/")


export async function handler(credentials: RelayerParams) {
  const provider = new DefenderRelayProvider(credentials);
  const lemmaToken = new ethers.Contract(addresses.xDAIRinkeby.lemmaxDAI, LemmaToken.abi, provider);

  const eventFilter: ethers.EventFilter = lemmaToken.filters.DepositInfoAdded();
  //if the last 30 blocks (5 sec block time)  had the depositInfoAdded 
  // const events: ethers.Event[] = await lemmaToken.queryFilter(eventFilter);
  // console.log(events.length, "events found");

  const events = [1]
  for (let i = 0; i < events.length; i++) {
    console.log("evaluating for", i);
    // const account = events[i].args.account;
    const account = "0x55f5E03fcbE088EDdba68B4657ade3243AC45009";
    // const amount: BigNumber = events[i].args.amount;
    const amountOnLemma: BigNumber = await lemmaToken.depositInfo(account);
    console.log("amountOnLemmaPending", amountOnLemma.toString())
    if (!amountOnLemma.isZero()) {
      console.log("minting for: " + account);

      //lets estimateGas before
      let tx = await lemmaToken.populateTransaction.mint(account);
      let estimatedGas = await provider.estimateGas(tx);
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

      console.log("trying to send transaction via biconomy");
      try {
        let txHash = await axios({ method: 'post', url: 'https://api.biconomy.io/api/v2/meta-tx/native', headers: headers, data: apiData });
        console.log("transaction sent with txHash", txHash)
      }
      catch (e) {
        console.log("transction failed");
        console.log(e);
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
