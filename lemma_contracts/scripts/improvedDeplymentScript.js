const hre = require("hardhat");
const { ethers, upgrades } = hre;
const { constants } = ethers;
const fetch = require("cross-fetch");
const CHViewerArtifact = require("@perp/contract/build/contracts/src/ClearingHouseViewer.sol/ClearingHouseViewer.json");
const addresses = require("../addresses.json");
require("dotenv").config();

const network = "rinkeby";
const ProxyAdmin = require('@openzeppelin/upgrades-core/artifacts/contracts/proxy/ProxyAdmin.sol/ProxyAdmin.json');
const AdminUpgradeabilityProxy = require('@openzeppelin/upgrades-core/artifacts/contracts/proxy/AdminUpgradeabilityProxy.sol/AdminUpgradeabilityProxy.json');


// async function getProxyFactory(signer) {
//     return ethers.getContractFactory(AdminUpgradeabilityProxy.abi, AdminUpgradeabilityProxy.bytecode, signer);
// }

// async function getProxyAdminFactory(signer) {
//     return ethers.getContractFactory(ProxyAdmin.abi, ProxyAdmin.bytecode, signer);
// }

// async function deployProxy(ImplmentationFactory, args, options) {
//     const implementation = await ImplmentationFactory.deploy();
//     await implementation.deployed();

//     const fragment = ImplmentationFactory.interface.getFunction(options.initializer);
//     const initializerData = ImplmentationFactory.interface.encodeFunctionData(fragment, args);

//     const ProxyFactory = await getProxyFactory(ImplmentationFactory.signer);
//     const proxy = await ProxyFactory.deploy(implementation, adminAddress, data);

//     const inst = ImplFactory.attach(proxy.address);

// }

//assuming that the harhat network is rinkeby
async function main() {
    let tx;

    const perpMetadataUrl = "https://metadata.perp.exchange/" + (network == "mainnet" ? "production" : "staging") + ".json";
    const perpMetadata = await fetch(perpMetadataUrl).then(res => res.json());

    // const xDAIProvider = new ethers.getDefaultProvider("https://rpc.xdaichain.com/");
    // const infuraURL = "https://" + network + ".infura.io/v3/" + process.env.INFURA_KEY;
    // const mainnetProvider = new ethers.getDefaultProvider(infuraURL);


    const xDAIProvider = new ethers.getDefaultProvider("http://127.0.0.1:8545");
    const mainnetProvider = new ethers.getDefaultProvider("http://127.0.0.1:7545");

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



    // const LemmaPerpetual = (await hre.ethers.getContractFactory("LemmaPerpetual")).connect(xDAIWallet);
    const LemmaPerpetual = await hre.ethers.getContractFactory("LemmaPerpetual", xDAIWallet);
    //TODO: to make this works it requires that openzeppelin's upgrade use provider provided by the signer instead of taking it from the hardhat
    //make a custom change and use custom npm package to avoid errors
    const lemmaPerpetual = await upgrades.deployProxy(LemmaPerpetual, [clearingHouseAddress, clearingHouseViewerAddress, ETH_USDC_AMMAddress, usdcxDAI], { initializer: 'initialize' });
    await lemmaPerpetual.deployed();
    console.log("lemmaPerpetual", lemmaPerpetual.address);

    //deploy lemmaXdai
    const LemmaToken = (await hre.ethers.getContractFactory("LemmaToken")).connect(xDAIWallet);
    const lemmaToken = await upgrades.deployProxy(LemmaToken, [usdcxDAI, lemmaPerpetual.address, ambBridgeOnXDai, multiTokenMediatorOnXDai, trustedForwaderXDAI], { initializer: 'initialize' });
    await lemmaToken.deployed();
    console.log("lemmaXDAI", lemmaToken.address);

    //set lemmaToken on lemmaPerpetual
    tx = await lemmaPerpetual.setLemmaToken(lemmaToken.address);
    await tx.wait();
    console.log("lemmaToken", await lemmaPerpetual.lemmaToken());

    //deploy LemmaMainnet
    const LemmaMainnet = (await hre.ethers.getContractFactory("LemmaMainnet")).connect(mainnetWallet);
    const lemmaMainnet = await upgrades.deployProxy(LemmaMainnet, [usdcMainnet, wethMainnet, lemmaToken.address, uniswapV2Router02Mainnet, ambBridgeOnEth, multiTokenMediatorOnEth, trustedForwaderMainnet, maximumETHCap], { initializer: 'initialize' });
    await lemmaMainnet.deployed();
    console.log("lemmaMainnet", lemmaMainnet.address);

    //set lemmaMainnet address in Lemmaxdai
    tx = await lemmaToken.setLemmaMainnet(lemmaMainnet.address);
    await tx.wait();
    console.log("lemmaMainnet", await lemmaToken.lemmaMainnet());

    tx = await lemmaMainnet.deposit(0, { value: ethers.utils.parseUnits("0.1", "ether") });
    await tx.wait();

    console.log(tx.hash);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
