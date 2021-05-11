// Import dependencies available in the autotask environment
import { RelayerParams } from 'defender-relay-client/lib/relayer';
import { DefenderRelayProvider } from 'defender-relay-client/lib/ethers';
import { BigNumber, ethers } from 'ethers';

// Import an ABI which will be embedded into the generated js
import IERC20 from '@openzeppelin/contracts/build/contracts/IERC20.json';
import LemmaMainnet from "./abis/LemmaMainnet.json";
import addresses from "./addresses.json";
// import { id } from '@ethersproject/hash';
// import { isGetAccessor } from 'typescript';
import axios from 'axios';
// import Web3 from "web3";



const biconomyApiKey = 'qtEU79q8w.a181871e-c3fd-4901-8440-23aa88902e5c';
const biconomyMethodAPIKey = '7937b80e-b7fc-4eb1-ad89-3344bb66a6c9';
const headers = {
    'x-api-key': biconomyApiKey,
    'Content-Type': 'application/json',
};


// Entrypoint for the Autotask
export async function handler(credentials: RelayerParams) {
    const provider = new DefenderRelayProvider(credentials);
    // const web3Provider = new Web3.providers.HttpProvider("https://rpc.xdaichain.com/")
    // const provider = new ethers.providers.Web3Provider(web3Provider)
    const lemmaMainnet = new ethers.Contract(addresses.rinkeby.lemmaMainnet, LemmaMainnet.abi, provider);

    const latestBlockNumber: number = await provider.getBlockNumber();
    console.log(await lemmaMainnet.lemmaXDAI())
    const eventFilter: ethers.EventFilter = lemmaMainnet.filters.WithdrawalInfoAdded();
    //if the last 30 blocks (5 sec block time)  had the depositInfoAdded 
    const events: ethers.Event[] = await lemmaMainnet.queryFilter(eventFilter, -12);
    console.log(events.length,"events found")
    for (let i = events.length -1 ; i>=0; i--) {
        const account = events[i].args.account;
        const amount: BigNumber = events[i].args.amount;
        const amountOnLemma: BigNumber = await lemmaMainnet.withdrawalInfo(account);
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
            apiData.to = lemmaMainnet.address;
            //param for the withdraw method
            apiData.params = [account];
            console.log("sending mint transaction using biconomy for ",account);
            try {
            await axios({ method: 'post', url: 'https://api.biconomy.io/api/v2/meta-tx/native', headers: headers, data: apiData });
            }
            catch (e) {
                console.log("sending mint transaction for ",account," failed");
            }
        }else{
            console.log("not necessary")
          }
    }
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
        API_KEY: "HUeNKNG9gegJpnAdVZRRdYdp7h9nAhdV",
        API_SECRET: "63heDwXAgk4DMTGA6Vca2MxzaXFQBAK58maQ4q4TiCRky2UUNBeU9UNxpfh6efSi"
    }
    // const { API_KEY: apiKey, API_SECRET: apiSecret } = process.env as EnvInfo;
    const { API_KEY: apiKey, API_SECRET: apiSecret } = envInfo;
    handler({ apiKey, apiSecret })
        .then(() => process.exit(0))
        .catch((error: Error) => { console.error(error); process.exit(1); });
}
