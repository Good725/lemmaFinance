import React, { useState, useEffect } from "react";
import { withStyles } from "@material-ui/core/styles";
import { useHistory } from "react-router-dom";
import {
  Grid,
  Button,
  TextField,
  Paper,
  Snackbar,
  Typography,
  Tab,
  Slider,
  CircularProgress,
  Hidden,
  Drawer,
  IconButton,
  List,
  Link,
} from "@material-ui/core";
import { ContactSupportOutlined, Flag, Menu } from "@material-ui/icons";
import { TabPanel, TabContext, Alert, TabList } from "@material-ui/lab";
import Web3 from "web3";
import axios from "axios";
import { Multicall } from "ethereum-multicall";

import { ethers, BigNumber, utils } from "ethers";
import { Biconomy } from "@biconomy/mexa";
import addresses from "../../abis/addresses.json";
import constants from "../../abis/constants.json";
import LemmaToken from "../../abis/LemmaToken.json";
import LemmaPerpetual from "../../abis/LemmaPerpetual.json";
import IUniswapV2Router02 from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
import ClearingHouseViewer from "@perp/contract/build/contracts/src/ClearingHouseViewer.sol/ClearingHouseViewer.json";
import ClearingHouse from "@perp/contract/build/contracts/src/ClearingHouse.sol/ClearingHouse.json";
import Amm from "@perp/contract/build/contracts/src/Amm.sol/Amm.json";
import AMBHelper from "../../abis/AMBHelper.json";
import HomeAMB from "../../abis/HomeAMB.json";
import ForeignAMB from "../../abis/ForeignAMB.json";
import BatchCalls from "../../abis/Upkaran-BatchCalls.json";

import { useConnectedWeb3Context } from "../../context";
import { useLemmaMain, useLemmaToken, useLemmaPerpetual, useBatchCall } from "../../hooks";
import { web3Modal } from "../../utils";

import { styles } from "./styles";
import { parseEther } from "@ethersproject/units";

import { ReactComponent as DiscordIcon } from "../../assets/img/footer_discord.svg";
import { ReactComponent as TwitterIcon } from "../../assets/img/footer_twitter.svg";

function LandingPage({ classes }) {
  const XDAI_URL =
    "https://rough-frosty-dream.xdai.quiknode.pro/40ffd401477e07ef089743fe2db6f9f463e1e726/";
  const XDAI_WSS_URL =
    "wss://rough-frosty-dream.xdai.quiknode.pro/40ffd401477e07ef089743fe2db6f9f463e1e726/";
  const ETHERSCAN_URL = "https://rinkeby.etherscan.io";
  const BLOCKSCOUT_URL = "https://blockscout.com/xdai/mainnet";
  const {
    account,
    signer,
    ethBalance,
    isConnected,
    onConnect,
    networkId,
    rawProvider,
    onDisconnect,
  } = useConnectedWeb3Context();

  const lemmaMain = useLemmaMain(addresses.rinkeby.lemmaMainnet);
  const batchCalls = useBatchCall(
    addresses.rinkeby.batchCalls
  );
  const lemmaToken = useLemmaToken(
    addresses.xDAIRinkeby.lemmaxDAI,
    ethers.getDefaultProvider(XDAI_URL)
  );
  const lemmaTokenWSS = useLemmaToken(
    addresses.xDAIRinkeby.lemmaxDAI,
    ethers.getDefaultProvider(XDAI_WSS_URL)
  );
  const lemmaPerpetual = useLemmaPerpetual(
    addresses.xDAIRinkeby.lemmaPerpetual,
    ethers.getDefaultProvider(XDAI_URL)
  );


  const homeAMB = new ethers.Contract(
    addresses.perpRinkebyXDAI.layers.layer2.externalContracts.ambBridgeOnXDai,
    HomeAMB.abi,
    ethers.getDefaultProvider(XDAI_WSS_URL)
  );
  const ambHelper = new ethers.Contract(
    addresses.xDAIRinkeby.AMBHelper,
    AMBHelper.abi,
    ethers.getDefaultProvider(XDAI_URL)
  );
  const foreignAMB = new ethers.Contract(
    addresses.perpRinkebyXDAI.layers.layer1.externalContracts.ambBridgeOnEth,
    ForeignAMB.abi,
    signer
  );


  const [amount, setAmount] = useState("");
  const [tabIndex, setTabIndex] = useState("1");

  const [successOpen, setSuccessOpen] = useState(false);
  const [loadOpen, setLoadOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [wrongNetwork, setWrongNetwork] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [loadMessage, setLoadMessage] = useState("");
  const [explorerLink, setExplorerLink] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [withdrawableETH, setWithdrawableETH] = useState(BigNumber.from(0));
  const [deposited, setDeposited] = useState(BigNumber.from(0));
  const [earnings, setEarnings] = useState(BigNumber.from(0));
  const [lemmaTokenWithBiconomy, setLemmaTokenWithBiconomy] = useState("");
  const [biconomy, setBiconomy] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [ambManualSigSubmissionOnMainnetData, setAmbManualSigSubmissionOnMainnetData] = useState([]);
  const [batchCallsData, setBatchCallsData] = useState([]);

  const history = useHistory();

  const toggleDrawer = (open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }

    setIsOpen(open);
  };

  const convertTo18Decimals = (number, decimals = 18) => {
    return ethers.utils.parseUnits(number.toString(), decimals);
  };

  const convertToReadableFormat = (bignumber, decimals = 18) => {
    return ethers.utils.formatUnits(bignumber, decimals);
  };

  const formatBigNumber = (bignumber, decimals = 18) => {
    if (bignumber.isZero()) {
      return "0";
    }
    return Number(ethers.utils.formatUnits(bignumber, decimals)).toFixed(6);
  };

  const ONE = convertTo18Decimals(1);
  const ZERO = BigNumber.from("0");

  const handleAmountChange = (event) => {
    if (event.target.value === "" || !isNaN(event.target.value)) {
      setAmount(event.target.value);

      const balance = Number(
        convertToReadableFormat(tabIndex === "1" ? ethBalance : withdrawableETH)
      );
      if (balance === 0) {
        return;
      }
      setSliderValue(Math.floor((Number(event.target.value) * 100) / balance));
    }
  };

  const handleSliderChange = (event, value) => {
    if (!isConnected) {
      return;
    }
    value = BigNumber.from(value);
    const hundreadBN = BigNumber.from("100");
    //below to make sure that every operation happens in the BigNumber
    //otherwise it can open us upto unexpectedErrors
    setAmount(convertToReadableFormat(value.mul(ethBalance).div(hundreadBN)));
    setSliderValue(value);
  };

  const handleWithdrawSliderChange = (event, value) => {
    if (!isConnected) {
      return;
    }
    value = BigNumber.from(value);
    const hundreadBN = BigNumber.from("100");
    //below to make sure that every operation happens in the BigNumber
    //otherwise it can open us upto unexpectedErrors
    setAmount(
      convertToReadableFormat(value.mul(withdrawableETH).div(hundreadBN))
    );
    setSliderValue(value);
  };

  const getExplorerLink = (transactionHash, networkName) => {
    const blockExplorerURL =
      networkName == "xdai" ? BLOCKSCOUT_URL : ETHERSCAN_URL;
    return blockExplorerURL + "/tx/" + transactionHash;
  };

  const handleDepositSubmit = async () => {
    if (!isConnected) {
      setErrorMessage("Please connect your wallet first");
      setErrorOpen(true);
      return;
    }
    if (!amount || amount === "0") {
      setErrorMessage("Invalid input");
      setErrorOpen(true);
      return;
    }
    if (parseEther(amount.toString()).gt(ethBalance)) {
      setErrorMessage("Insufficient account balance");
      setErrorOpen(true);
      return;
    }
    if (parseEther(amount.toString()).add(deposited).gt(parseEther("10"))) {
      setErrorMessage("Individual ETH deposit is capped at 10 ETH");
      setErrorOpen(true);
      return;
    }

    const ethUSDCAMMAddress =
      addresses.perpRinkebyXDAI.layers.layer2.contracts.ETHUSDC.address;
    const clearingHouseAddress =
      addresses.perpRinkebyXDAI.layers.layer2.contracts.ClearingHouse.address;
    const clearingHouseViewerAddress =
      addresses.perpRinkebyXDAI.layers.layer2.contracts.ClearingHouseViewer
        .address;
    const lemmaPerpetualAddress = addresses.xDAIRinkeby.lemmaPerpetual;
    //below is the implemetation w/o the multicall
    // const ethUSDCAMM = new ethers.Contract(
    //   ethUSDCAMMAddress,
    //   Amm.abi,
    //   ethers.getDefaultProvider(XDAI_URL)
    // );
    // const clearingHouse = new ethers.Contract(
    //   clearingHouseAddress,
    //   ClearingHouse.abi,
    //   ethers.getDefaultProvider(XDAI_URL)
    // );
    // const clearingHouseViewer = new ethers.Contract(
    //   clearingHouseViewerAddress,
    //   ClearingHouseViewer.abi,
    //   ethers.getDefaultProvider(XDAI_URL)
    // );
    // const [
    //   maxHoldingBaseAsset,
    //   openInterestNotionalCap,
    //   currentOpenInterest,
    //   position,
    // ] = await Promise.all([
    //   ethUSDCAMM.getMaxHoldingBaseAsset(),
    //   ethUSDCAMM.getOpenInterestNotionalCap(),
    //   clearingHouse.openInterestNotionalMap(ethUSDCAMM.address),
    //   clearingHouseViewer.getPersonalPositionWithFundingPayment(
    //     ethUSDCAMM.address,
    //     lemmaPerpetual.address
    //   ),
    // ]);
    // console.log([
    //   maxHoldingBaseAsset.d.toString(),
    //   openInterestNotionalCap.d.toString(),
    //   currentOpenInterest.toString(),
    //   position.size.d.toString(),
    // ]);
    const multicall = new Multicall({
      nodeUrl: XDAI_URL,
      multicallCustomContractAddress:
        "0xb5b692a88bdfc81ca69dcb1d924f59f0413a602a",
    });

    const contractCallContext = [
      {
        reference: "ethUSDCAMM",
        contractAddress: ethUSDCAMMAddress,
        abi: Amm.abi,
        calls: [
          { methodName: "getMaxHoldingBaseAsset", methodParameters: [] },
          { methodName: "getOpenInterestNotionalCap", methodParameters: [] },
        ],
      },
      {
        reference: "clearingHouse",
        contractAddress: clearingHouseAddress,
        abi: ClearingHouse.abi,
        calls: [
          {
            methodName: "openInterestNotionalMap",
            methodParameters: [ethUSDCAMMAddress],
          },
        ],
      },
      {
        reference: "clearingHouseViewer",
        contractAddress: clearingHouseViewerAddress,
        abi: ClearingHouseViewer.abi,
        calls: [
          {
            methodName: "getPersonalPositionWithFundingPayment",
            methodParameters: [ethUSDCAMMAddress, lemmaPerpetual.address],
          },
        ],
      },
    ];

    const { results } = await multicall.call(contractCallContext);

    const [
      maxHoldingBaseAsset,
      openInterestNotionalCap,
      currentOpenInterest,
      position,
    ] = [
        BigNumber.from(
          results["ethUSDCAMM"].callsReturnContext[0].returnValues[0].hex
        ),
        BigNumber.from(
          results["ethUSDCAMM"].callsReturnContext[1].returnValues[0].hex
        ),
        BigNumber.from(
          results["clearingHouse"].callsReturnContext[0].returnValues[0].hex
        ),
        BigNumber.from(
          results["clearingHouseViewer"].callsReturnContext[0].returnValues[0][0]
            .hex
        ),
      ];

    if (
      openInterestNotionalCap.lt(
        currentOpenInterest.add(parseEther(amount.toString()))
      ) ||
      maxHoldingBaseAsset.lt(position.add(parseEther(amount.toString())))
    ) {
      setErrorMessage("Sorry, Maximum limit reached");
      setErrorOpen(true);
      return;
    }
    if (depositLoading) {
      return;
    }

    if (networkId != 4) {
      setWrongNetwork(true);
    } else {
      try {
        // setDepositLoading(true);
        const gasFees = 0.001; //TODO: use an API to get current gas price and multiply with estimate gas of the deposit method
        let txHash;
        if (
          utils
            .parseEther((Number(amount) + gasFees).toString())
            .gte(ethBalance)
        ) {
          txHash = await lemmaMain.deposit(0, Number(amount) - gasFees);
        } else {
          txHash = await lemmaMain.deposit(0, amount);
        }
        //to test without actually depositing
        // txHash = "0xfd090be00e063eb8e0a6db9c2c471785d1064958d5ec50b0b4c0ff3c64ca63c7"
        setExplorerLink(getExplorerLink(txHash));
        setLoadMessage("Deposit started");
        setLoadOpen(true);

        const tx = await signer.provider.getTransaction(txHash);
        await tx.wait();

        setAmount("0");

        setLoadOpen(false);
        setLoadMessage(
          "Deposit successful! Your LUSDT should arrive in ~1 min"
        );
        setLoadOpen(true);

        // set a listener for minting LUSDC on
        // const lemmaMainnetEthers = new ethers.Contract(addresses.rinkeby.lemmaMainnet, LemmaMainnet.abi, signer);
        // const DepositFilter = lemmaMainnetEthers.filters.ETHDeposited(accounts[0]);

        const lemmaXDAIDepositInfoAddedFilter =
          lemmaToken.instance.filters.DepositInfoAdded(account);
        const lusdcMintedFilter = lemmaToken.instance.filters.Transfer(
          ethers.constants.AddressZero,
          account
        );

        lemmaTokenWSS.instance.once(lusdcMintedFilter, onSuccessfulDeposit);
        lemmaTokenWSS.instance.once(
          lemmaXDAIDepositInfoAddedFilter,
          onDepositInfoAdded
        );
        //to update the balance
        await onConnect();
        // setDepositLoading(false);
      } catch {
        // setDepositLoading(false);
        setLoadOpen(false);
        setErrorMessage("Deposit Failed");
        setErrorOpen(true);
      }
    }
  };

  const handleWithdrawSubmit = async () => {
    if (!isConnected) {
      setErrorMessage("Please connect your wallet first");
      setErrorOpen(true);
      return;
    }
    if (!amount || amount === "0") {
      setErrorMessage("Invalid input");
      setErrorOpen(true);
      return;
    }
    if (parseEther(amount.toString()).gt(withdrawableETH)) {
      setErrorMessage("Insufficient withdraw balance");
      setErrorOpen(true);
      return;
    }

    if (withdrawLoading || !biconomy) {
      return;
    }

    if (networkId != 4) {
      setWrongNetwork(true);
    } else {
      try {
        // setWithdrawLoading(true);
        const userBalanceOfLUSDC = await lemmaToken.balanceOf(account);

        const ethToWithdraw = convertTo18Decimals(amount);
        //TODO: This is temperary fix
        //make sure frontend deals with only bignumbers
        let lUSDCAmount;

        const percentageOfETHToWithdraw = withdrawableETH
          .sub(ethToWithdraw)
          .mul(ONE)
          .div(withdrawableETH);

        lUSDCAmount = userBalanceOfLUSDC.sub(
          userBalanceOfLUSDC.mul(percentageOfETHToWithdraw).div(ONE)
        );

        if (lUSDCAmount.gt(userBalanceOfLUSDC)) {
          lUSDCAmount = userBalanceOfLUSDC;
        }
        console.log("userBalanceOfUSDC", userBalanceOfLUSDC.toString());
        console.log("lUSDCAmount", lUSDCAmount.toString());

        //withdraw lusdc amount using biconomy

        // let contractInterface = new ethers.utils.Interface(LemmaToken.abi);
        let userAddress = account;
        // Create your target method signature.. here we are calling setQuote() method of our contract
        const minETHOut = ZERO;
        let { data } =
          await lemmaTokenWithBiconomy.populateTransaction.withdraw(
            lUSDCAmount,
            minETHOut
          );
        console.log("data", data);
        let provider = biconomy.getEthersProvider();

        // you can also use networkProvider created above
        let gasLimit = await provider.estimateGas({
          to: addresses.xDAIRinkeby.lemmaxDAI,
          from: userAddress,
          data: data,
        });
        console.log("Gas limit : ", gasLimit);

        let txParams = {
          data: data,
          to: addresses.xDAIRinkeby.lemmaxDAI,
          from: userAddress,
          gasLimit: gasLimit, // optional
          signatureType: "EIP712_SIGN",
        };

        // as ethers does not allow providing custom options while sending transaction
        // you can also use networkProvider created above
        // signature will be taken by mexa using normal provider (metamask wallet etc) that you passed in Biconomy options
        let txHash = await provider.send("eth_sendTransaction", [txParams]);

        //to test the blockscout link
        // let txHash = "0x88903d79b572c601127ae61ff7997d2971d29777535b6de0dc06dcaf7bc850fa";

        const lemmaMainnetWithdrawInfoAdded =
          lemmaMain.instance.filters.WithdrawalInfoAdded(account);
        lemmaMain.instance.once(
          lemmaMainnetWithdrawInfoAdded,
          onWithdrawInfoAdded
        );

        const lemmaMainnetETHWithdrawedFilter =
          lemmaMain.instance.filters.ETHWithdrawed(account);
        lemmaMain.instance.once(
          lemmaMainnetETHWithdrawedFilter,
          onSuccessfulWithdrawal
        );

        console.log("Transaction hash : ", txHash);
        setExplorerLink(getExplorerLink(txHash, "xdai"));
        console.log(getExplorerLink(txHash, "xdai"));
        setLoadMessage("Withdraw started");
        setLoadOpen(true);

        console.log(signer);

        //if tx == null that means the xdai just does not know about the transaction that was submitted by the biconomy node
        let tx;
        while (!tx) {
          tx = await ethers.getDefaultProvider(XDAI_URL).getTransaction(txHash);
        }
        await tx.wait();

        // await getMessageIdsFromXDAITxHash(tx.hash);
        await handleXDAITxHashForManualSubmission(txHash);



        setAmount("0");

        setLoadOpen(false);
        setLoadMessage(
          "Withdraw successful! Your ETH should arrive in ~1 minute"
        );
        setLoadOpen(true);
        // setWithdrawLoading(false);
      } catch {
        // setWithdrawLoading(false);
      }
    }
  };

  const handleConnectWallet = async () => {
    await onConnect();
    //initialize biconomy
    const xDAIProvider = new Web3.providers.HttpProvider(XDAI_URL);
    const biconomy = new Biconomy(xDAIProvider, {
      walletProvider: window.ethereum,
      apiKey: constants.biconomy.xdai.withdraw.apiKey,
      apiId: constants.biconomy.xdai.withdraw.methodAPIKey,
      debug: true,
    });

    // const web3Biconomy = new Web3(biconomy);
    // const amountToWithdraw = BigNumber.from(amount);
    // const amountToWithdrawWithDecimals = amountToWithdraw.mul(BigNumber.from(10).pow(BigNumber.from(18)));

    let userAddress = account;
    biconomy
      .onEvent(biconomy.READY, async () => {
        // Initialize your dapp here like getting user accounts etc
        // Initialize Constants
        let lemmaTokenWithBiconomy = new ethers.Contract(
          addresses.xDAIRinkeby.lemmaxDAI,
          LemmaToken.abi,
          biconomy.getSignerByAddress(userAddress)
        );
        setLemmaTokenWithBiconomy(lemmaTokenWithBiconomy);
        setBiconomy(biconomy);
      })
      .onEvent(biconomy.ERROR, (error, message) => {
        // Handle error while initializing mexa
        console.log(error);
      });
  };

  const refreshBalances = async () => {
    console.log("refresh Balance start");
    onWithdrawInfoAdded();

    setLoadingBalance(true);
    //to update the balance
    await onConnect();
    onCollectedSignatures();
    const uniswapV2Router02 = new ethers.Contract(
      addresses.rinkeby.uniswapV2Router02,
      IUniswapV2Router02.abi,
      signer
    );
    //w/o the multicall
    // const [userBalanceOfLUSDC, totalCollateral, totalSupplyOfLUSDC] =
    // await Promise.all([
    //   lemmaToken.balanceOf(account),
    //   lemmaPerpetual.getTotalCollateral(),
    //   lemmaToken.totalSupply(),
    // ]);

    const multicall = new Multicall({
      nodeUrl: XDAI_URL,
      multicallCustomContractAddress:
        "0xb5b692a88bdfc81ca69dcb1d924f59f0413a602a",
    });
    const contractCallContext = [
      {
        reference: "lemmaToken",
        contractAddress: addresses.xDAIRinkeby.lemmaxDAI,
        abi: LemmaToken.abi,
        calls: [
          { methodName: "balanceOf", methodParameters: [account] },
          { methodName: "totalSupply", methodParameters: [] },
        ],
      },
      {
        reference: "lemmaPerpetual",
        contractAddress: addresses.xDAIRinkeby.lemmaPerpetual,
        abi: LemmaPerpetual.abi,
        calls: [
          {
            methodName: "getTotalCollateral",
            methodParameters: [],
          },
        ],
      },
    ];

    const { results } = await multicall.call(contractCallContext);
    const [userBalanceOfLUSDC, totalCollateral, totalSupplyOfLUSDC] = [
      BigNumber.from(
        results["lemmaToken"].callsReturnContext[0].returnValues[0].hex
      ),
      BigNumber.from(
        results["lemmaPerpetual"].callsReturnContext[0].returnValues[0].hex
      ),
      BigNumber.from(
        results["lemmaToken"].callsReturnContext[1].returnValues[0].hex
      ),
    ];

    let maxWithdrwableEth = new BigNumber.from("0");

    if (userBalanceOfLUSDC.gt(BigNumber.from("0"))) {
      //TODO: add 0.1% perp fees that is not considered in following formula
      const usdcDeservedByUser = totalCollateral
        .mul(userBalanceOfLUSDC)
        .div(totalSupplyOfLUSDC);

      if (!usdcDeservedByUser.isZero()) {
        try {
          const amounts = await uniswapV2Router02.getAmountsOut(
            usdcDeservedByUser,
            [addresses.rinkeby.usdc, addresses.rinkeby.weth]
          );
          maxWithdrwableEth = amounts[1];
        } catch (e) {
          console.log(e);
        }
      }

      setWithdrawableETH(maxWithdrwableEth);
    }

    //to get the deposited balance
    //look for the deposit events on the lemmaMainnet
    //look at the mint and burn events on lemmaToken

    const ethDepositedFilter = lemmaMain.instance.filters.ETHDeposited(account);
    const ethDepositedEvents = await lemmaMain.instance.queryFilter(
      ethDepositedFilter
    );

    let totalETHDeposited = BigNumber.from("0");
    ethDepositedEvents.forEach((ethDepositedEvent) => {
      const ethDeposited = ethDepositedEvent.args.amount;
      totalETHDeposited = totalETHDeposited.add(ethDeposited);
    });

    const lusdcMintedFilter = lemmaToken.instance.filters.Transfer(
      ethers.constants.AddressZero,
      account
    );
    const lusdcMintedEvents = await lemmaToken.instance.queryFilter(
      lusdcMintedFilter
    );

    let totalLUSDCMinted = BigNumber.from("0");
    lusdcMintedEvents.forEach((lusdcMintedEvent) => {
      const lUSDCMinted = lusdcMintedEvent.args.value;
      totalLUSDCMinted = totalLUSDCMinted.add(lUSDCMinted);
    });
    let ETHDeposited = ZERO;

    if (!totalLUSDCMinted.isZero()) {
      const lusdcBurntFilter = lemmaToken.instance.filters.Transfer(
        account,
        ethers.constants.AddressZero
      );
      const lusdcBurntEvents = await lemmaToken.instance.queryFilter(
        lusdcBurntFilter
      );
      let totalLUSDCBurnt = BigNumber.from("0");
      lusdcBurntEvents.forEach((lusdcBurntEvent) => {
        const lUSDCBurnt = lusdcBurntEvent.args.value;
        totalLUSDCBurnt = totalLUSDCBurnt.add(lUSDCBurnt);
      });

      const percentageOfLUSDCWithdrawed = totalLUSDCMinted
        .sub(totalLUSDCBurnt)
        .mul(ONE)
        .div(totalLUSDCMinted);
      ETHDeposited = totalETHDeposited
        .mul(percentageOfLUSDCWithdrawed)
        .div(ONE);
    }

    //according to those decide the total deposited balance
    setDeposited(ETHDeposited);
    const earnings = maxWithdrwableEth.sub(ETHDeposited);

    setEarnings(earnings);
    console.log("refresh Balance end");
    setLoadingBalance(false);
  };

  const onSuccessfulDeposit = async (account, LUSDTAmount, event) => {
    refreshBalances();
    setExplorerLink(getExplorerLink(event.transactionHash), "xdai");
    setLoadOpen(false);
    setSuccessMessage("Deposit completed successfully");
    setSuccessOpen(true);
  };

  const onSuccessfulWithdrawal = async (account, ETHAmount, event) => {
    refreshBalances();
    setExplorerLink(getExplorerLink(event.transactionHash));
    setLoadOpen(false);
    setSuccessMessage("Withdrawal completed successfully");
    setSuccessOpen(true);
  };

  const onDepositInfoAdded = async () => {
    const biconomyApiKey = constants.biconomy.xdai.mint.apiKey;
    const biconomyMethodAPIKey = constants.biconomy.xdai.mint.methodAPIKey;
    const headers = {
      "x-api-key": biconomyApiKey,
      "Content-Type": "application/json",
    };
    const amountOnLemma = await lemmaToken.depositInfo(account);
    if (!amountOnLemma.isZero()) {
      console.log("in");
      const apiData = {
        userAddress: "",
        // 'from': '',
        to: "",
        // 'gasLimit': '',
        params: Array(0),
        apiId: biconomyMethodAPIKey,
      };

      apiData.userAddress = ethers.constants.AddressZero;
      apiData.to = lemmaToken.address;
      apiData.params = [account];

      //tell biconomy to make a mint transaction
      await axios({
        method: "post",
        url: "https://api.biconomy.io/api/v2/meta-tx/native",
        headers: headers,
        data: apiData,
      });
    } else {
      console.log("not necessary to mint by user");
    }
  };

  const onWithdrawInfoAdded = async () => {
    const biconomyApiKey = constants.biconomy.rinkeby.withdraw.apiKey;
    const biconomyMethodAPIKey =
      constants.biconomy.rinkeby.withdraw.methodAPIKey;
    const headers = {
      "x-api-key": biconomyApiKey,
      "Content-Type": "application/json",
    };
    const amountOnLemma = await lemmaMain.instance.withdrawalInfo(account);
    if (!amountOnLemma.isZero()) {
      console.log("in");
      const apiData = {
        userAddress: "",
        // 'from': '',
        to: "",
        // 'gasLimit': '',
        params: Array(0),
        apiId: biconomyMethodAPIKey,
      };

      apiData.userAddress = ethers.constants.AddressZero;
      apiData.to = lemmaMain.address;
      apiData.params = [account];

      //tell biconomy to make a mint transaction
      await axios({
        method: "post",
        url: "https://api.biconomy.io/api/v2/meta-tx/native",
        headers: headers,
        data: apiData,
      });
    } else {
      console.log("not necessary to withdraw by user");
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
    setAmount("");
    setSliderValue(0);
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSuccessOpen(false);
    setLoadOpen(false);
    setErrorOpen(false);
    setWrongNetwork(false);
  };
  const formateCall = (to, data, value = 0) => {
    return {
      to: to,
      data: data,
      value: value
    };
  };
  const handleXDAITxHashForManualSubmission = async (txHash) => {
    const xDAIProvider = ethers.getDefaultProvider(XDAI_URL);
    const receipt = await xDAIProvider.getTransactionReceipt(txHash);
    const logs = receipt.logs;

    const homeAMBInterface = new ethers.utils.Interface(HomeAMB.abi);
    const ambManualSigSubmissionOnMainnetDataLocal = [];
    logs.forEach(log => {
      try {
        const userRequestForSignatureEvent = homeAMBInterface.parseLog(log);
        ambManualSigSubmissionOnMainnetDataLocal.push({ messageId: userRequestForSignatureEvent.args.messageId, encodedData: userRequestForSignatureEvent.args.encodedData, isSignatureCollected: false });
      }
      catch { }
    });
    setAmbManualSigSubmissionOnMainnetData(ambManualSigSubmissionOnMainnetDataLocal);
    //now we need to listed for collectedSignatures events for messageHash(s) associated with the messageId(s)

  };
  //CollectedSignatures(address authorityResponsibleForRelay, bytes32 messageHash, uint256 NumberOfCollectedSignatures)

  const onCollectedSignatures = async (authorityResponsibleForRelay, messageHash, NumberOfCollectedSignatures, collectedSignaturesEvent) => {
    const ambManualSigSubmissionOnMainnetDataLocal = ambManualSigSubmissionOnMainnetData;

    // const ambManualSigSubmissionOnMainnetDataLocal = [{
    //   "encodedData": "0x00050000dd91aecde2ad4ff420b70fff98bad16a14bb88170000000000000971a34c65d76b997a824a5e384471bba73b0013f5da30f693708fc604a57f1958e3cfa059f902e6d4cb001e848001010064048b6c0354000000000000000000000000755f41f1a81c2d3a97ed7a6383a4b7fe93e73421000000000000000000000000000000000000000000000000000000000321ed1b",
    //   "messageId": "0x00050000dd91aecde2ad4ff420b70fff98bad16a14bb88170000000000000971"
    // },

    // {
    //   "encodedData": "0x00050000dd91aecde2ad4ff420b70fff98bad16a14bb881700000000000009727c1c48460c66c279022f4a0afd9267dbc9744c30755f41f1a81c2d3a97ed7a6383a4b7fe93e73421000f4240010100640453fbc09b0000000000000000000000005fd7d6382de0d4c4a00b19ed10c11dfd96c27340000000000000000000000000000000000000000000000000000000000321ed1b0000000000000000000000000000000000000000000000000000000000000000",
    //   "messageId": "0x00050000dd91aecde2ad4ff420b70fff98bad16a14bb88170000000000000972"
    // }];

    console.log("ambManualSigSubmissionOnMainnetDataLocal in collected sigs", ambManualSigSubmissionOnMainnetData);
    ambManualSigSubmissionOnMainnetDataLocal.forEach((data, index) => {
      console.log("index", index);
      console.log(data);
      const messageHashFromEncodedData = ethers.utils.keccak256(data.encodedData);
      if (messageHashFromEncodedData == messageHash) {
        console.log("signature submitted");
        ambManualSigSubmissionOnMainnetDataLocal[index].isSignatureCollected = true;
      }
    });
    setAmbManualSigSubmissionOnMainnetData(ambManualSigSubmissionOnMainnetDataLocal);
    console.log("ambManualSigSubmissionOnMainnetData updated", ambManualSigSubmissionOnMainnetDataLocal);
  };

  const onConnectXDai = async () => {
    try {
      if (!rawProvider) {
        return;
      }

      await rawProvider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x64",
            chainName: "xDAI Chain",
            rpcUrls: ["https://dai.poa.network"],
            iconUrls: [
              "https://xdaichain.com/fake/example/url/xdai.svg",
              "https://xdaichain.com/fake/example/url/xdai.png",
            ],
            nativeCurrency: {
              name: "xDAI",
              symbol: "xDAI",
              decimals: 18,
            },
          },
        ],
      });
    } catch (e) {
      console.error(e);
    }
  };

  const onAddLUSDT = async () => {
    try {
      if (!rawProvider) {
        return;
      }

      await rawProvider.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: addresses.xDAIRinkeby.lemmaxDAI,
            symbol: "LUSDT",
            decimals: 18,
          },
        },
      });
    } catch (e) {
      console.error(e);
    }
  };

  const alertAnchor = {
    vertical: "top",
    horizontal: "center",
  };

  const ethData = {
    image_url: require("../../assets/img/eth.png"),
    asset: "ETH",
    balance: "0",
    deposit: "0",
    apy: "~48%",
    earnings: "0",
    assetNumber: "0",
  };

  useEffect(() => {
    if (isConnected) {
      refreshBalances();
      if (networkId !== 4) {
        setWrongNetwork(true);
      }
    }
  }, [isConnected, account, networkId]);

  useEffect(() => {
    if (!isConnected && web3Modal.cachedProvider) {
      handleConnectWallet();
    }
  }, []);

  useEffect(() => {
    console.log("ambBridge data changed", ambManualSigSubmissionOnMainnetData);
    const collectedSignaturesEventFilter = homeAMB.filters.CollectedSignatures();
    homeAMB.on(collectedSignaturesEventFilter, onCollectedSignatures);

    async function checkIfBothSigAreSubmitted() {

      const ambManualSigSubmissionOnMainnetDataLocal = ambManualSigSubmissionOnMainnetData;
      let isBothSignaturesSubmitted = true;

      ambManualSigSubmissionOnMainnetDataLocal.forEach(data => {
        if (data.isSignatureCollected == false) {
          isBothSignaturesSubmitted = false;
        }
      });

      if (isBothSignaturesSubmitted && ambManualSigSubmissionOnMainnetDataLocal.length > 0) {
        //get the signatures from the AMBHelper

        for (let index = 0; index < ambManualSigSubmissionOnMainnetDataLocal.length; index++) {
          const signatures = await ambHelper.getSignatures(
            ambManualSigSubmissionOnMainnetDataLocal[index].encodedData
          );
          ambManualSigSubmissionOnMainnetDataLocal[index].signatures = signatures;
        };

        console.log("ambManualSigSubmissionOnMainnetDataLocal", ambManualSigSubmissionOnMainnetDataLocal);


        const calls = [];

        const executeSignatureCall1 = formateCall(foreignAMB.address, foreignAMB.interface.encodeFunctionData("executeSignatures", [ambManualSigSubmissionOnMainnetDataLocal[0].encodedData, ambManualSigSubmissionOnMainnetDataLocal[0].signatures]));
        calls.push(executeSignatureCall1);
        const executeSignatureCall2 = formateCall(foreignAMB.address, foreignAMB.interface.encodeFunctionData("executeSignatures", [ambManualSigSubmissionOnMainnetDataLocal[1].encodedData, ambManualSigSubmissionOnMainnetDataLocal[1].signatures]));
        calls.push(executeSignatureCall2);

        const withdrawETHCall = formateCall(lemmaMain.instance.address, lemmaMain.instance.interface.encodeFunctionData("withdraw", [account]));
        calls.push(withdrawETHCall);

        setBatchCallsData(calls);
        await batchCalls.batch(calls);
        //in the withdraw step 2, check if calls.length > 0 if yes then onClick call   await batchCalls.batch(calls);
      }
    };
    checkIfBothSigAreSubmitted();
  }, [ambManualSigSubmissionOnMainnetData]);



  return (
    <div className={classes.root}>
      <Snackbar
        open={wrongNetwork}
        autoHideDuration={2000}
        onClose={handleClose}
        anchorOrigin={alertAnchor}
      >
        <Alert severity="error" onClose={handleClose} variant="filled">
          Please connect to the Rinkeby Network
        </Alert>
      </Snackbar>

      <Snackbar
        open={successOpen}
        autoHideDuration={2000}
        onClose={handleClose}
        anchorOrigin={alertAnchor}
      >
        <Alert
          elevation={6}
          variant="filled"
          onClose={handleClose}
          severity="success"
        >
          {successMessage}
        </Alert>
      </Snackbar>
      <Snackbar
        open={loadOpen}
        onClose={handleClose}
        anchorOrigin={alertAnchor}
      >
        <Alert
          elevation={6}
          icon={<CircularProgress color="secondary" size="20px" />}
          variant="filled"
          onClose={handleClose}
          severity="info"
        >
          <span>
            {loadMessage},{" "}
            <a
              href={explorerLink}
              className={classes.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              see on explorer
            </a>
          </span>
        </Alert>
      </Snackbar>
      <Snackbar
        open={errorOpen}
        autoHideDuration={2000}
        onClose={handleClose}
        anchorOrigin={alertAnchor}
      >
        <Alert
          elevation={6}
          variant="filled"
          onClose={handleClose}
          severity="error"
        >
          {errorMessage}
        </Alert>
      </Snackbar>

      <div className={classes.body}>
        <Grid container justify="center">
          <Grid
            container
            item
            xs={11}
            md={9}
            xl={8}
            className={classes.navigationContainer}
            justify="space-between"
          >
            <Grid item container xs={4} alignItems="center">
              <Grid item>
                <img
                  className={classes.logoImg}
                  src={require("../../assets/img/logo.png")}
                  onClick={() => history.push("/")}
                  alt=""
                />
              </Grid>
              <Grid item>
                <Typography
                  className={classes.logo}
                  variant="body2"
                  onClick={() => history.push("/")}
                >
                  <b>LEMMA</b>
                </Typography>
              </Grid>
            </Grid>
            <Hidden smDown>
              <Grid item container xs={8} justify="flex-end" spacing={4}>
                <Grid item>
                  <Button
                    className={classes.navButton}
                    href="https://docs.lemma.finance"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Docs
                  </Button>
                </Grid>
                <Grid item>
                  <Button className={classes.navButton} href="/registration">
                    Early Access
                  </Button>
                </Grid>

                {/* {isConnected && networkId !== 100 && (
                <Grid item>
                  <Button className={classes.navButton} onClick={onConnectXDai}>
                    Connect to xDAI
                  </Button>
                </Grid>
                )} */}
                {/* <Grid item>
                  <Button className={classes.navButton} onClick={onAddLUSDT}>
                    Add LUSDT to wallet
                  </Button>
                </Grid> */}
                <Grid item>
                  <Button
                    className={classes.connectButton}
                    variant="outlined"
                    onClick={() =>
                      isConnected ? onDisconnect() : handleConnectWallet()
                    }
                  >
                    {isConnected
                      ? account.slice(0, 8) + "..."
                      : "Connect Wallet"}
                  </Button>
                </Grid>
              </Grid>
            </Hidden>
            <Hidden mdUp>
              <IconButton
                edge="start"
                aria-label="menu"
                onClick={toggleDrawer(true)}
              >
                <Menu fontSize="large" style={{ color: `grey` }} />
              </IconButton>

              <Drawer
                anchor="right"
                open={isOpen}
                onClose={toggleDrawer(false)}
              >
                <div
                  className={classes.list}
                  role="presentation"
                  onClick={toggleDrawer(false)}
                  onKeyDown={toggleDrawer(false)}
                >
                  <List component="nav">
                    <Grid item>
                      <Button
                        className={classes.navButton}
                        href="https://docs.lemma.finance"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Docs
                      </Button>
                    </Grid>
                    <Grid item>
                      <Button
                        className={classes.navButton}
                        href="/registration"
                      >
                        Early Access
                      </Button>
                    </Grid>

                    {/* {isConnected && networkId !== 100 && (
                      <Grid item>
                        <Button className={classes.navButton} onClick={onConnectXDai}>
                          Connect to xDAI
                        </Button>
                      </Grid>
                      )} */}
                    {/* <Grid item>
                        <Button className={classes.navButton} onClick={onAddLUSDT}>
                          Add LUSDT to wallet
                        </Button>
                      </Grid> */}
                    <Grid item>
                      <Button
                        className={classes.navButton}
                        onClick={() =>
                          isConnected ? onDisconnect() : handleConnectWallet()
                        }
                      >
                        {isConnected
                          ? account.slice(0, 8) + "..."
                          : "Connect Wallet"}
                      </Button>
                    </Grid>
                  </List>
                </div>
              </Drawer>
            </Hidden>
          </Grid>

          <Grid
            container
            item
            xs={10}
            md={9}
            xl={8}
            className={classes.mainContainer}
            justify="center"
          >
            <Grid container item direction="column">
              <Grid item className={classes.title}>
                The Basis Trading Protocol
              </Grid>
              <Grid item className={classes.subtitle}>
                Superior, low risk, sustainable yield on your ETH.
              </Grid>
            </Grid>

            <Grid
              container
              item
              className={classes.contentContainer}
              justify="center"
            >
              <Grid
                container
                item
                xs={12}
                md={5}
                lg={4}
                className={classes.paperContainer}
              >
                <Paper className={classes.actionPaper} elevation={5}>
                  <Grid
                    container
                    item
                    className={classes.actionContainer}
                    direction="column"
                    alignItems="center"
                    spacing={4}
                  >
                    <Grid item>
                      <img
                        className={classes.assetLogo}
                        src={ethData.image_url}
                        alt=""
                      />
                    </Grid>
                    <Grid container item justify="center">
                      <TabContext value={tabIndex}>
                        <TabList
                          onChange={handleTabChange}
                          indicatorColor="primary"
                          centered
                        >
                          <Tab
                            label="Deposit"
                            value="1"
                            className={classes.tab}
                          />
                          <Tab
                            label="Withdraw"
                            value="2"
                            className={classes.tab}
                          />
                        </TabList>
                        <TabPanel value="1" className={classes.tabContent}>
                          <Grid container item spacing={4}>
                            <Grid
                              container
                              item
                              xs={12}
                              direction="row"
                              justify="center"
                            >
                              <Grid
                                container
                                item
                                xs={6}
                                direction="column"
                                alignItems="center"
                              >
                                <Grid item>
                                  {/* <Tooltip placement="top" title="Max APY"> */}
                                  <Typography variant="body1">
                                    Earn APY
                                  </Typography>
                                  {/* </Tooltip> */}
                                </Grid>
                                <Grid item>
                                  {" "}
                                  <Typography variant="body1">
                                    <b>{ethData.apy}</b>
                                  </Typography>{" "}
                                </Grid>
                              </Grid>
                              <Grid
                                container
                                item
                                xs={6}
                                direction="column"
                                alignItems="center"
                              >
                                <Grid item>
                                  {" "}
                                  <Typography variant="body1">
                                    Wallet Balance
                                  </Typography>{" "}
                                </Grid>
                                <Grid item>
                                  {/* {loadingBalance ? (
                                    <CircularProgress
                                      color="primary"
                                      size="20px"
                                    />
                                  ) : ( */}
                                  <Typography variant="body1">
                                    <b>
                                      {isConnected
                                        ? formatBigNumber(ethBalance)
                                        : 0}
                                    </b>
                                  </Typography>
                                  {/* )} */}
                                </Grid>
                              </Grid>
                            </Grid>
                            <Grid
                              container
                              item
                              xs={12}
                              direction="row"
                              justify="space-between"
                            >
                              {/* <Tooltip
                                placement="top-start"
                                title="Amount to deposit"
                              > */}
                              <TextField
                                color="primary"
                                variant="filled"
                                value={amount}
                                autoFocus={true}
                                className={classes.input}
                                label={`${ethData.asset} Amount`}
                                onChange={(e) => handleAmountChange(e)}
                              />
                              {/* </Tooltip> */}
                            </Grid>
                            <Grid item container xs={12} justify="center">
                              <Grid item xs={11}>
                                <Slider
                                  value={sliderValue}
                                  defaultValue={0}
                                  aria-labelledby="discrete-slider"
                                  valueLabelDisplay="auto"
                                  marks={[
                                    { value: 0, label: "0%" },
                                    { value: 25, label: "25%" },
                                    { value: 50, label: "50%" },
                                    { value: 75, label: "75%" },
                                    { value: 100, label: "100%" },
                                  ]}
                                  onChange={(e, v) => handleSliderChange(e, v)}
                                  step={1}
                                  min={0}
                                  max={100}
                                />
                              </Grid>
                            </Grid>
                            <Grid item xs={12}>
                              <Button
                                fullWidth
                                className={classes.button}
                                color="primary"
                                variant="contained"
                                // disabled={depositLoading || loadingBalance}
                                disabled={depositLoading}
                                onClick={() => handleDepositSubmit()}
                              >
                                Deposit
                              </Button>
                            </Grid>
                          </Grid>
                        </TabPanel>
                        <TabPanel value="2" className={classes.tabContent}>
                          <Grid container item spacing={4}>
                            <Grid
                              container
                              item
                              xs={12}
                              direction="row"
                              justify="center"
                            >
                              <Grid
                                container
                                item
                                xs={6}
                                direction="column"
                                alignItems="center"
                              >
                                <Grid item>
                                  {/* <Tooltip
                                    placement="top"
                                    title="Amount of deposit"
                                  > */}
                                  <Typography variant="body1">
                                    {ethData.asset} Deposited
                                  </Typography>
                                  {/* </Tooltip> */}
                                </Grid>
                                <Grid item>
                                  {loadingBalance ? (
                                    <CircularProgress
                                      color="primary"
                                      size="20px"
                                    />
                                  ) : (
                                    <Typography variant="body1">
                                      <b>{formatBigNumber(deposited)}</b>
                                    </Typography>
                                  )}
                                </Grid>
                              </Grid>
                              <Grid
                                container
                                item
                                xs={6}
                                direction="column"
                                alignItems="center"
                              >
                                <Grid item>
                                  {/* <Tooltip
                                    placement="top"
                                    title="Amount of Earnings"
                                  > */}
                                  <Typography variant="body1">
                                    {ethData.asset} Earnings
                                  </Typography>
                                  {/* </Tooltip> */}
                                </Grid>
                                <Grid item>
                                  {loadingBalance ? (
                                    <CircularProgress
                                      color="primary"
                                      size="20px"
                                    />
                                  ) : (
                                    <Typography variant="body1">
                                      <b>{formatBigNumber(earnings)}</b>
                                    </Typography>
                                  )}
                                </Grid>
                              </Grid>
                            </Grid>
                            <Grid
                              container
                              item
                              xs={12}
                              direction="row"
                              justify="space-between"
                            >
                              {/* <Tooltip
                                placement="top-start"
                                title="ETH amount to be withdrawn"
                              > */}
                              <TextField
                                color="primary"
                                variant="filled"
                                value={amount}
                                autoFocus={true}
                                className={classes.input}
                                label={`${ethData.asset} Amount`}
                                onChange={(e) => handleAmountChange(e)}
                              />
                              {/* </Tooltip> */}
                            </Grid>
                            <Grid item container xs={12} justify="center">
                              <Grid item xs={11}>
                                <Slider
                                  value={sliderValue}
                                  defaultValue={0}
                                  aria-labelledby="discrete-slider"
                                  valueLabelDisplay="auto"
                                  marks={[
                                    { value: 0, label: "0%" },
                                    { value: 25, label: "25%" },
                                    { value: 50, label: "50%" },
                                    { value: 75, label: "75%" },
                                    { value: 100, label: "100%" },
                                  ]}
                                  onChange={(e, v) =>
                                    handleWithdrawSliderChange(e, v)
                                  }
                                  step={1}
                                  min={0}
                                  max={100}
                                />
                              </Grid>
                            </Grid>
                            <Grid item xs={12}>
                              <Button
                                fullWidth
                                className={classes.button}
                                color="primary"
                                variant="contained"
                                disabled={
                                  withdrawLoading || !biconomy || loadingBalance
                                }
                                onClick={() => handleWithdrawSubmit()}
                              >
                                Withdraw
                              </Button>
                            </Grid>
                          </Grid>
                        </TabPanel>
                      </TabContext>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </Grid>
          <Grid
            container
            className={classes.footer}
            justify="center"
            alignItems="center"
          >
            <Grid item className={classes.footerItem}>
              <Link
                target="_blank"
                href="https://docs.lemma.finance/resources/disclaimer"
                color="primary"
                className={classes.footerLink}
              >
                Disclaimer
              </Link>
            </Grid>
            <Grid item className={classes.footerItem}>
              <Link target="_blank" href="https://twitter.com/LemmaFinance">
                <TwitterIcon />
              </Link>
            </Grid>
            <Grid item className={classes.footerItem}>
              <Link
                target="_blank"
                href="https://discord.com/invite/bbFtEYhNc9"
              >
                <DiscordIcon />
              </Link>
            </Grid>
          </Grid>
        </Grid>
      </div>
    </div>
  );
}

export default withStyles(styles)(LandingPage);
