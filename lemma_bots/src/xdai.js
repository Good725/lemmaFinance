const ethers = require("ethers");
const axios = require("axios");

const addresses = require("./addresses.json");
const LemmaToken = require("./abis/LemmaToken.json");

//TODO: use the same biconomy keys for both files
//move it to a .json file
const biconomyApiKey = 'Aj47G_8mq.20f2cf98-9696-4125-89d8-379ee4f11f39';
const biconomyMethodAPIKey = 'b9e3a7f2-b78a-416c-b057-d8a36ba76400';
const headers = {
    'x-api-key': biconomyApiKey,
    'Content-Type': 'application/json',
};

exports.handler = async function (params) {
    // const payload = params.request.body;
    const transaction = params.transaction;
    // const matchReasons = payload.matchReasons;
    // const sentinel = payload.sentinel;
    // const abi = sentinel.abi;


    const txHash = transaction.txHash;
    const network = "xdai";
    const provider = ethers.getDefaultProvider("https://rough-frosty-dream.xdai.quiknode.pro/40ffd401477e07ef089743fe2db6f9f463e1e726/");
    const tx = await provider.getTransactionReceipt(txHash);
    // console.log(tx);

    const lemmaToken = new ethers.Contract(addresses.xDAIRinkeby.lemmaxDAI, LemmaToken.abi, provider);

    // const account = events[i].args.account;
    const account = "0x55f5E03fcbE088EDdba68B4657ade3243AC45009";
    // const amount: BigNumber = events[i].args.amount;
    const amountOnLemma = await lemmaToken.depositInfo(account);
    console.log("amountOnLemmaPending", amountOnLemma.toString());
    if (!amountOnLemma.isZero()) {
        console.log("minting for: " + account);

        // //lets estimateGas before
        // let tx = await lemmaToken.populateTransaction.mint(account);
        // let estimatedGas = await provider.estimateGas(tx);
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
            console.log("transaction sent with txHash", txHash);
        }
        catch (e) {
            console.log("transction failed");
            // console.log(e);
        }
        //tell biconomy to make a mint transaction
    } else {
        console.log("not necessary");
    }



};

if (require.main === module) {
    const params = { transaction: { txHash: "0xa99bffea4a17839175075681e76f056949da8ed38366d74be2f3a69575767a3e" } };
    exports.handler(params)
        .then(() => process.exit(0))
        .catch(error => { console.error(error); process.exit(1); });
}