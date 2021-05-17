const hre = require("hardhat");
const { ethers, upgrades } = hre;
const { constants } = ethers;
const fetch = require("cross-fetch");
const CHViewerArtifact = require("@perp/contract/build/contracts/src/ClearingHouseViewer.sol/ClearingHouseViewer.json");
const addresses = require("../addresses.json");
require("dotenv").config();

const network = "rinkeby";
const tokenTransfers = require("truffle-token-test-utils");//just to visulize token transfers in a transaction




async function main() {
    let tx;

    const perpMetadataUrl = "https://metadata.perp.exchange/" + (network == "mainnet" ? "production" : "staging") + ".json";
    const perpMetadata = await fetch(perpMetadataUrl).then(res => res.json());

    // const xDAIProvider = new ethers.getDefaultProvider("https://rough-frosty-dream.xdai.quiknode.pro/40ffd401477e07ef089743fe2db6f9f463e1e726/");
    const infuraURL = "https://" + network + ".infura.io/v3/" + process.env.INFURA_KEY;
    const mainnetProvider = new ethers.getDefaultProvider(infuraURL);

    //for testing in the localhost
    const xDAIProvider = new ethers.getDefaultProvider("http://127.0.0.1:8545");
    // const mainnetProvider = new ethers.getDefaultProvider("http://127.0.0.1:7545");

    const xDAIWallet = new ethers.Wallet(process.env.PRIVATE_KEY, xDAIProvider);
    const mainnetWallet = xDAIWallet.connect(mainnetProvider);

    const usdcxDAI = perpMetadata.layers.layer2.externalContracts.usdc;//USDC on xdai
    const usdcMainnet = perpMetadata.layers.layer1.externalContracts.usdc;//USDC on mainnet
    const wethMainnet = addresses[network].weth;
    const trustedForwaderXDAI = addresses["xdai"].trustedForwarder;
    const trustedForwaderMainnet = addresses[network].trustedForwarder;
    const uniswapV2Router02Mainnet = addresses[network].uniswapV2Router02;


    const clearingHouseViewerAddress = perpMetadata.layers.layer2.contracts.ClearingHouseViewer.address;
    const clearingHouseAddress = perpMetadata.layers.layer2.contracts.ClearingHouse.address;
    const ETH_USDC_AMMAddress = perpMetadata.layers.layer2.contracts.ETHUSDC.address;
    const ambBridgeOnXDai = perpMetadata.layers.layer2.externalContracts.ambBridgeOnXDai;
    const multiTokenMediatorOnXDai = perpMetadata.layers.layer2.externalContracts.multiTokenMediatorOnXDai;
    const ambBridgeOnEth = perpMetadata.layers.layer1.externalContracts.ambBridgeOnEth;
    const multiTokenMediatorOnEth = perpMetadata.layers.layer1.externalContracts.multiTokenMediatorOnEth;

    const maximumETHCap = ethers.utils.parseEther("500");
    // console.log(maximumETHCap.toString());

    const alreadyDeployedLemmaPerpetual = addresses.xDAIRinkeby.lemmaPerpetual;


    // const LemmaPerpetual = (await hre.ethers.getContractFactory("LemmaPerpetual")).connect(xDAIWallet);
    const LemmaPerpetual = await hre.ethers.getContractFactory("LemmaPerpetual", xDAIWallet);
    //TODO: to make this works it requires that openzeppelin's upgrade use provider provided by the signer instead of taking it from the hardhat
    //make a custom change and use custom npm package to avoid errors
    // const lemmaPerpetual = await upgrades.deployProxy(LemmaPerpetual, [clearingHouseAddress, clearingHouseViewerAddress, ETH_USDC_AMMAddress, usdcxDAI], { initializer: 'initialize' });
    // await lemmaPerpetual.deployed();
    // console.log("lemmaPerpetual", lemmaPerpetual.address);
    const upgraded = await upgrades.upgradeProxy(alreadyDeployedLemmaPerpetual, LemmaPerpetual, { initializer: 'initialize' });
    await upgraded.deployed();

    tokenTransfers.setCurrentProvider(xDAIProvider);


    await hre.network.provider.request({
        method: "evm_increaseTime",
        params: [60 * 60]
    }
    );

    // await this.clearingHouse.payFunding(ammAddress);

    tx = await upgraded.reInvestFundingPayment();
    await tx.wait();
    // console.log(tx);
    // await tokenTransfers.print(tx.hash, {});

}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
