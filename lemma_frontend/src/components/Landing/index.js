import React, { useState, useEffect } from "react";
import { withStyles } from "@material-ui/core/styles";
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
} from "@material-ui/core";
import { TabPanel, TabContext, Alert, TabList } from "@material-ui/lab";
import Web3 from "web3";
import axios from "axios";

import { ethers, BigNumber, utils } from "ethers";
import { Biconomy } from "@biconomy/mexa";
import addresses from "../../abis/addresses.json";
import constants from "../../abis/constants.json";
import LemmaToken from "../../abis/LemmaToken.json";
import IUniswapV2Router02 from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
import { useConnectedWeb3Context } from "../../context";
import { useLemmaMain, useLemmaToken, useLemmaPerpetual } from "../../hooks";

import { styles } from "./styles";

function LandingPage({ classes }) {
  const XDAI_URL = "https://rpc.xdaichain.com/";
  const XDAI_WSS_URL = "wss://rpc.xdaichain.com/wss";
  const ETHERSCAN_URL = "https://rinkeby.etherscan.io";
  const BLOCKSCOUT_URL = "https://blockscout.com/xdai/mainnet";
  const {
    account,
    signer,
    ethBalance,
    isConnected,
    onConnect,
    networkId,
  } = useConnectedWeb3Context();

  const lemmaMain = useLemmaMain(addresses.rinkeby.lemmaMainnet);
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

  const [amount, setAmount] = useState("");
  const [tabIndex, setTabIndex] = useState("1");

  const [successOpen, setSuccessOpen] = useState(false);
  const [loadOpen, setLoadOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [loadMessage, setLoadMessage] = useState("");
  const [explorerLink, setExplorerLink] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [withdrawableETH, setWithdrawableETH] = useState(BigNumber.from(0));
  const [deposited, setDeposited] = useState(BigNumber.from(0));
  const [earnings, setEarnings] = useState(BigNumber.from(0));

  const convertTo18Decimals = (number, decimals = 18) => {
    return ethers.utils.parseUnits(number.toString(), decimals);
  };

  const convertToReadableFormat = (bignumber, decimals = 18) => {
    return ethers.utils.formatUnits(bignumber, decimals);
  };

  const ONE = convertTo18Decimals(1);
  const ZERO = BigNumber.from("0");

  const handleAmountChange = (event) => {
    if (event.target.value !== "" && isNaN(parseFloat(event.target.value))) {
      alert("Please enter a number!");
    } else {
      setAmount(event.target.value);
    }
  };

  const handleSliderChange = (event, value) => {
    if (!isConnected) {
      return;
    }

    setAmount((value * convertToReadableFormat(ethBalance)) / 100);
  };

  const handleWithdrawSliderChange = (event, value) => {
    if (!isConnected) {
      return;
    }
    setAmount((value * convertToReadableFormat(withdrawableETH)) / 100);
  };

  const getExplorerLink = (transactionHash, networkName) => {
    const blockExplorerURL =
      networkName == "xdai" ? BLOCKSCOUT_URL : ETHERSCAN_URL;
    return blockExplorerURL + "/tx/" + transactionHash;
  };

  const handleDepositSubmit = async () => {
    if (!amount) {
      return;
    }

    if (networkId != 4) {
      alert("please connect to rinkeby network");
    } else {
      const gasFees = 0.001; //TODO: use an API to get current gas price and multiply with estimate gas of the deposit method
      let txHash;
      if (
        utils.parseEther((Number(amount) + gasFees).toString()).gte(ethBalance)
      ) {
        txHash = await lemmaMain.deposit(0, Number(amount) - gasFees);
      } else {
        txHash = await lemmaMain.deposit(0, amount);
      }
      //to test without actually depositting
      // txHash = "0xfd090be00e063eb8e0a6db9c2c471785d1064958d5ec50b0b4c0ff3c64ca63c7"
      setExplorerLink(getExplorerLink(txHash));
      setLoadMessage("Deposit started");
      setLoadOpen(true);

      const tx = await signer.provider.getTransaction(txHash);
      await tx.wait();

      setLoadOpen(false);
      setLoadMessage(
        "Deposit completed successfully, you should receive your LUSDT in ~1 min!"
      );
      setLoadOpen(true);

      // set a listener for minting LUSDC on
      // const lemmaMainnetEthers = new ethers.Contract(addresses.rinkeby.lemmaMainnet, LemmaMainnet.abi, signer);
      // const DepositFilter = lemmaMainnetEthers.filters.ETHDeposited(accounts[0]);

      const lemmaXDAIDepositInfoAddedFilter = lemmaToken.instance.filters.DepositInfoAdded(
        account
      );
      const lusdcMintedFilter = lemmaToken.instance.filters.Transfer(
        ethers.constants.AddressZero,
        account
      );

      lemmaTokenWSS.instance.once(lusdcMintedFilter, onSuccessfulDeposit);
      lemmaTokenWSS.instance.once(
        lemmaXDAIDepositInfoAddedFilter,
        onDepositInfoAdded
      );
    }
  };

  const handleWithdrawSubmit = async () => {
    if (!amount) {
      return;
    }

    if (networkId != 4) {
      alert("please connect to rinkeby network");
    } else {
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
          // const lemmaxDAI = new web3Biconomy.eth.Contract(LemmaToken.abi, addresses.xDAIRinkeby.lemmaxDAI);
          // await lemmaxDAI.methods.withdraw(amountToWithdrawWithDecimals).send({ from: accounts[0], signatureType: biconomy.EIP712_SIGN });
          // Initialize Constants
          let contract = new ethers.Contract(
            addresses.xDAIRinkeby.lemmaxDAI,
            LemmaToken.abi,
            biconomy.getSignerByAddress(userAddress)
          );
          // let contractInterface = new ethers.utils.Interface(LemmaToken.abi);

          // Create your target method signature.. here we are calling setQuote() method of our contract
          let { data } = await contract.populateTransaction.withdraw(
            lUSDCAmount
          );
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
          // let txHash = "0x2647d1b2f43706fca55a09e47dea8c9756bb1e5e685645ddf2294e354d7808c2";

          const lemmaMainnetETHWithdrawedFilter = lemmaMain.instance.filters.ETHWithdrawed(
            account
          );
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
            tx = await ethers
              .getDefaultProvider(XDAI_URL)
              .getTransaction(txHash);
          }
          await tx.wait();

          setLoadOpen(false);
          setLoadMessage(
            "Withdraw completed successfully, you will receive your ETH back in ~1 minutes"
          );
          setLoadOpen(true);
        })
        .onEvent(biconomy.ERROR, (error, message) => {
          // Handle error while initializing mexa
          console.log(error);
        });
    }
  };

  const handleConnectWallet = async () => {
    await onConnect();
  };

  const refreshBalances = async () => {
    console.log("refresh Balance start");

    const uniswapV2Router02 = new ethers.Contract(
      addresses.rinkeby.uniswapV2Router02,
      IUniswapV2Router02.abi,
      signer
    );
    const [
      userBalanceOfLUSDC,
      totalCollateral,
      totalSupplyOfLUSDC,
    ] = await Promise.all([
      lemmaToken.balanceOf(account),
      lemmaPerpetual.getTotalCollateral(),
      lemmaToken.totalSupply(),
    ]);

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
    const ETHDeposited = totalETHDeposited
      .mul(percentageOfLUSDCWithdrawed)
      .div(ONE);

    //according to those decide the total deposited balance
    setDeposited(ETHDeposited);
    const earnings = maxWithdrwableEth.sub(ETHDeposited);

    setEarnings(earnings);
    console.log("refresh Balance end");
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
    setSuccessMessage("Withdraw completed successfully");
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

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSuccessOpen(false);
    setLoadOpen(false);
    setErrorOpen(false);
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
    apy: "90%",
    earnings: "0",
    assetNumber: "0",
  };

  useEffect(() => {
    if (!isConnected) {
      handleConnectWallet();
    } else {
      refreshBalances();
    }
  }, [isConnected]);

  return (
    <div className={classes.root}>
      <Snackbar
        open={successOpen}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={alertAnchor}
      >
        <Alert
          elevation={6}
          variant="filled"
          onClose={handleClose}
          severity="success"
        >
          <span>
            {successMessage}
            <br />
            <a href={explorerLink} target="_blank" rel="noopener noreferrer">
              see on explorer
            </a>
          </span>
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
            {loadMessage}
            <br />
            <a href={explorerLink} target="_blank" rel="noopener noreferrer">
              see on explorer
            </a>
          </span>
        </Alert>
      </Snackbar>
      <Snackbar
        open={errorOpen}
        autoHideDuration={6000}
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
                  alt=""
                />
              </Grid>
              <Grid item>
                <Typography className={classes.logo} variant="body2">
                  <b>LEMMA</b>
                </Typography>
              </Grid>
            </Grid>
            <Grid item container xs={8} justify="flex-end" spacing={4}>
              <Grid item>
                <Button
                  className={classes.navButton}
                  href="https://mgava.gitbook.io/lemma/"
                >
                  Docs
                </Button>
              </Grid>
              <Grid item>
                <Button className={classes.navButton} href="/registration">
                  Early Access
                </Button>
              </Grid>
              <Grid item>
                <Button
                  className={classes.connectButton}
                  variant="outlined"
                  onClick={() => handleConnectWallet()}
                >
                  {isConnected ? account.slice(0, 8) + "..." : "Connect Wallet"}
                </Button>
              </Grid>
            </Grid>
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
                Superior, low risk, sustainable yield.
              </Grid>
              <Grid item className={classes.subtitle}>
                Deposit ETH and we’ll earn you more ETH via basis trading.
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
                                  {" "}
                                  <Typography variant="body1">
                                    Earn APY
                                  </Typography>{" "}
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
                                  {" "}
                                  <Typography variant="body1">
                                    <b>
                                      {isConnected
                                        ? Number(
                                            utils.formatEther(ethBalance)
                                          ).toFixed(6)
                                        : 0}
                                    </b>
                                  </Typography>{" "}
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
                              <TextField
                                color="primary"
                                variant="filled"
                                value={amount}
                                autoFocus={true}
                                className={classes.input}
                                label={`${ethData.asset} Amount`}
                                onChange={(e) => handleAmountChange(e)}
                              />
                            </Grid>
                            <Grid item container xs={12} justify="center">
                              <Grid item xs={11}>
                                <Slider
                                  defaultValue={0}
                                  aria-labelledby="discrete-slider"
                                  valueLabelDisplay="off"
                                  onChange={(e, v) => handleSliderChange(e, v)}
                                  step={25}
                                  marks={[
                                    { value: 0, label: "0%" },
                                    { value: 25, label: "25%" },
                                    { value: 50, label: "50%" },
                                    { value: 75, label: "75%" },
                                    { value: 100, label: "100%" },
                                  ]}
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
                                  {" "}
                                  <Typography variant="body1">
                                    Deposited
                                  </Typography>{" "}
                                </Grid>
                                <Grid item>
                                  {" "}
                                  <Typography variant="body1">
                                    {Number(
                                      convertToReadableFormat(deposited)
                                    ).toFixed(6)}
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
                                    Earnings
                                  </Typography>{" "}
                                </Grid>
                                <Grid item>
                                  {" "}
                                  <Typography variant="body1">
                                    {Number(
                                      convertToReadableFormat(earnings)
                                    ).toFixed(6)}
                                  </Typography>{" "}
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
                              <TextField
                                color="primary"
                                variant="filled"
                                value={amount}
                                autoFocus={true}
                                className={classes.input}
                                label={`${ethData.asset} Amount`}
                                onChange={(e) => handleAmountChange(e)}
                              />
                            </Grid>
                            <Grid item container xs={12} justify="center">
                              <Grid item xs={11}>
                                <Slider
                                  defaultValue={0}
                                  aria-labelledby="discrete-slider"
                                  valueLabelDisplay="off"
                                  onChange={(e, v) =>
                                    handleWithdrawSliderChange(e, v)
                                  }
                                  step={25}
                                  marks={[
                                    { value: 0, label: "0%" },
                                    { value: 25, label: "25%" },
                                    { value: 50, label: "50%" },
                                    { value: 75, label: "75%" },
                                    { value: 100, label: "100%" },
                                  ]}
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
        </Grid>
      </div>
    </div>
  );
}

export default withStyles(styles)(LandingPage);
