import React, { useState } from "react";
import { withStyles } from '@material-ui/core/styles';
import { Grid, Button, TextField, Paper, Snackbar, Typography, Tab, Slider } from '@material-ui/core';
import { TabPanel, TabContext, Alert, TabList } from '@material-ui/lab';

import { useWallet } from 'use-wallet';
import Web3 from "web3";
import { ethers, BigNumber, utils } from "ethers";
import { Biconomy } from "@biconomy/mexa";
import erc20 from "../../abis/ERC20.json";
import addresses from "../../abis/addresses.json";
import LemmaMainnet from "../../abis/LemmaMainnet.json";
import LemmaToken from "../../abis/LemmaToken.json";
import IUniswapV2Router02 from '@uniswap/v2-periphery/build/IUniswapV2Router02.json';
import LemmaPerpetual from "../../abis/LemmaPerpetual.json";

import { styles } from './styles';


function LandingPage({ classes }) {
  const wallet = useWallet();
  if (wallet.error && wallet.error.name === "ChainUnsupportedError") {
    alert("Please switch your wallet to Rinkeby Test Network.");
  }
  console.log("--------------------", { wallet });

  const [amount, setAmount] = useState("");
  const [tabIndex, setTabIndex] = useState("1");
  const [open, setOpen] = useState(false);
  const XDAI_URL = "https://rpc.xdaichain.com/";

  // const [balance, setBalance] = useState('0');
  // const [lBalance, setLBalance] = useState('0');
  // const [web3, setWeb3] = useState(null);
  // const [account, setAccount] = useState(null);

  var web3;
  var account;

  const convertTo18Decimals = (number) => {
    return ethers.utils.parseEther(number);
  };

  const convertToReadableFormat = (bignumber) => {
    return ethers.utils.formatUnits(bignumber);
  };

  const handleWithdrawMaxClick = async () => {
    console.log("in");
    web3 = new Web3(window.ethereum);
    let accounts = await web3.eth.getAccounts();
    const lemmaToken = new ethers.Contract(addresses.xDAIRinkeby.lemmaxDAI, erc20.abi, ethers.getDefaultProvider(XDAI_URL));
    const userBalanceOfLUSDC = await lemmaToken.balanceOf(accounts[0]);
    console.log("userBalanceOfLUSDC", convertToReadableFormat(userBalanceOfLUSDC));
    const lemmaPerpetual = new ethers.Contract(addresses.xDAIRinkeby.lemmaPerpetual, LemmaPerpetual.abi, ethers.getDefaultProvider(XDAI_URL));
    const totalCollateral = await lemmaPerpetual.getTotalCollateral();
    console.log("totalCollateral", convertToReadableFormat(totalCollateral));
    const totalSupplyOfLUSDC = await lemmaToken.totalSupply();

    const usdcDeservedByUser = (totalCollateral.mul(userBalanceOfLUSDC)).div(totalSupplyOfLUSDC);
    console.log("usdcDeservedByUser", convertToReadableFormat(usdcDeservedByUser));
  };

  const handleAmountChange = event => {
    if (event.target.value !== "" && isNaN(parseFloat(event.target.value))) {
      alert('Please enter a number!');
    }
    else {
      setAmount(event.target.value);
    }
  };

  const handleSliderChange = (event, value) => {
    if (wallet.balance > -1) {
      setAmount(value * convertToReadableFormat(wallet.balance) / 100);
    }
  };

  const handleDepositSubmit = async () => {
    if (wallet.balance > -1) {
      web3 = new Web3(window.ethereum);
      let accounts = await web3.eth.getAccounts();
      account = accounts[0];
      // const amountToDeposit = BigNumber.from(amount);
      // const amountToDepositWithDecimals = amountToDeposit.mul(BigNumber.from(10).pow(BigNumber.from(18)));
      const lemmaMainnet = new web3.eth.Contract(LemmaMainnet.abi, addresses.rinkeby.lemmaMainnet);
      await lemmaMainnet.methods.deposit(0).send({ from: account, value: convertTo18Decimals(amount) });
      // await refreshBalances();
      setOpen(true);
    }
    else {
      handleConnectWallet();
    }
  };

  const handleWithdrawSubmit = async () => {
    // console.log(amount);
    // console.log(amount);
    const xDAIProvider = new Web3.providers.HttpProvider(XDAI_URL);
    const biconomy = new Biconomy(xDAIProvider, {
      walletProvider: window.ethereum,
      apiKey: "Aj47G_8mq.20f2cf98-9696-4125-89d8-379ee4f11f39",
      apiId: "42f4a570-923b-4888-9338-c5506bd5d252",
      debug: true
    });
    // const web3Biconomy = new Web3(biconomy);

    web3 = new Web3(window.ethereum);
    let accounts = await web3.eth.getAccounts();

    // const amountToWithdraw = BigNumber.from(amount);
    // const amountToWithdrawWithDecimals = amountToWithdraw.mul(BigNumber.from(10).pow(BigNumber.from(18)));

    let userAddress = accounts[0];
    biconomy.onEvent(biconomy.READY, async () => {
      // Initialize your dapp here like getting user accounts etc
      // const lemmaxDAI = new web3Biconomy.eth.Contract(LemmaToken.abi, addresses.xDAIRinkeby.lemmaxDAI);
      // await lemmaxDAI.methods.withdraw(amountToWithdrawWithDecimals).send({ from: accounts[0], signatureType: biconomy.EIP712_SIGN });
      // Initialize Constants
      let contract = new ethers.Contract(addresses.xDAIRinkeby.lemmaxDAI,
        LemmaToken.abi, biconomy.getSignerByAddress(userAddress));
      // let contractInterface = new ethers.utils.Interface(LemmaToken.abi);

      // Create your target method signature.. here we are calling setQuote() method of our contract
      let { data } = await contract.populateTransaction.withdraw(convertTo18Decimals(amount));
      let provider = biconomy.getEthersProvider();

      // you can also use networkProvider created above
      let gasLimit = await provider.estimateGas({
        to: addresses.xDAIRinkeby.lemmaxDAI,
        from: userAddress,
        data: data
      });
      console.log("Gas limit : ", gasLimit);

      let txParams = {
        data: data,
        to: addresses.xDAIRinkeby.lemmaxDAI,
        from: userAddress,
        gasLimit: gasLimit, // optional
        signatureType: "EIP712_SIGN"
      };

      // as ethers does not allow providing custom options while sending transaction
      // you can also use networkProvider created above               
      // signature will be taken by mexa using normal provider (metamask wallet etc) that you passed in Biconomy options  
      let tx = await provider.send("eth_sendTransaction", [txParams]);
      console.log("Transaction hash : ", tx);

      //event emitter methods
      provider.once(tx, (transaction) => {
        // Emitted when the transaction has been mined
        //show success message
        console.log(transaction);
        //do something with transaction hash
      });
    }).onEvent(biconomy.ERROR, (error, message) => {
      // Handle error while initializing mexa
      console.log(error);
    });

    // await refreshBalances();
  };

  const handleConnectWallet = async () => {
    await wallet.connect();
    web3 = new Web3(window.ethereum);
    // await setWeb3(new Web3(window.ethereum));
    const accounts = await web3.eth.getAccounts();
    account = accounts[0];
    await refreshBalances();
  };

  const refreshBalances = async () => {
    // const usdcBalance = await getBalance(addresses.usdc, account);
    // setBalance(usdcBalance);
    // const LusdcBalance = await getBalance(addresses.lusdc, account);
    // setLBalance(LusdcBalance);
    web3 = new Web3(window.ethereum);
    // await setWeb3(new Web3(window.ethereum));
    const accounts = await web3.eth.getAccounts();
    account = accounts[0];

    const lusdcBalance = await getBalance(addresses.xDAIRinkeby.lemmaxDAI, account);


    console.log("lUSDC Balance:", convertToReadableFormat(lusdcBalance));
  };

  // const convert;
  const getBalance = async (tokenAddress, _account) => {
    // // const usdcAddress = "0xe0B887D54e71329318a036CF50f30Dbe4444563c";
    // const tokenContract = new web3.eth.Contract(erc20.abi, tokenAddress);
    // const balance = BigNumber.from((await tokenContract.methods.balanceOf(_account).call()).toString());
    // const decimals = BigNumber.from((await tokenContract.methods.decimals().call()).toString());

    // console.log((balance.dividedBy(BigNumber.from(10).pow(decimals))).toString());
    // // setBalance(balance.dividedBy(BigNumber.from(10).pow(decimals)).toString());
    // return balance.dividedBy(BigNumber.from(10).pow(decimals)).toString();

    const tokenContract = new ethers.Contract(tokenAddress, erc20.abi, ethers.getDefaultProvider(XDAI_URL));
    return tokenContract.balanceOf(_account);

  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  const alertAnchor = {
    vertical: 'top',
    horizontal: 'center'
  };

  const ethData = {
    'image_url': require('../../assets/img/eth.png'),
    'asset': 'ETH',
    'balance': '0',
    'deposit': '0',
    'apy': '90%',
    'earnings': '0',
    'assetNumber': '0'
  };

  return (
    <div className={classes.root}>
      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose} anchorOrigin={alertAnchor}>
        <Alert elevation={6} variant="filled" onClose={handleClose} severity="success">
          Deposit transaction started, you should receive your LUSDT in ~1 min!
        </Alert>
      </Snackbar>
      <div className={classes.body}>
        <Grid container justify="center">
          <Grid container item xs={11} md={9} xl={8} className={classes.navigationContainer} justify="space-between">
            <Grid item container xs={4} alignItems="center">
              <Grid item><img className={classes.logoImg} src={require('../../assets/img/logo.png')} alt="" /></Grid>
              <Grid item><Typography className={classes.logo} variant="body2"><b>LEMMA</b></Typography></Grid>
            </Grid>
            <Grid item>
              <Button className={classes.connectButton} variant="outlined" onClick={() => handleConnectWallet()}>
                {wallet.account ? wallet.account.slice(0, 8) + "..." : "Connect Wallet"}
              </Button>
            </Grid>
          </Grid>

          <Grid container item xs={10} md={9} xl={8} className={classes.mainContainer} justify="center">

            <Grid container item direction="column">
              <Grid item className={classes.title}>Superior, low risk, sustainable yield.</Grid>
              <Grid item className={classes.subtitle}>Deposit ETH and we’ll earn you more ETH via basis trading.</Grid>
            </Grid>

            <Grid container item className={classes.contentContainer} justify="center">
              <Grid container item xs={12} md={5} lg={4} className={classes.paperContainer}>
                <Paper className={classes.actionPaper} elevation={5}>
                  <Grid container item className={classes.actionContainer} direction='column' alignItems='center' spacing={4}>
                    <Grid item >
                      <img className={classes.assetLogo} src={ethData.image_url} alt="" />
                    </Grid>
                    <Grid container item justify="center">
                      <TabContext value={tabIndex}>
                        <TabList
                          onChange={handleTabChange}
                          indicatorColor="primary"
                          centered
                        >
                          <Tab label="Deposit" value="1" className={classes.tab} />
                          <Tab label="Withdraw" value="2" className={classes.tab} />
                        </TabList>
                        <TabPanel value="1" className={classes.tabContent}>
                          <Grid container item spacing={4}>
                            <Grid container item xs={12} direction='row' justify="center">
                              <Grid container item xs={6} direction='column' alignItems='center'>
                                <Grid item> <Typography variant="body1">Earn APY</Typography> </Grid>
                                <Grid item> <Typography variant="body1"><b>{ethData.apy}</b></Typography> </Grid>
                              </Grid>
                              <Grid container item xs={6} direction='column' alignItems='center'>
                                <Grid item> <Typography variant="body1">Wallet Balance</Typography> </Grid>
                                <Grid item> <Typography variant="body1"><b>{wallet.balance > -1 ? wallet.balance / Math.pow(10, 18) : 0}</b></Typography> </Grid>
                              </Grid>
                            </Grid>
                            <Grid container item xs={12} direction='row' justify="space-between">
                              <TextField color="primary" variant="filled" value={amount} autoFocus={true} className={classes.input} label={`${ethData.asset} Amount`} onChange={e => handleAmountChange(e)} />
                            </Grid>
                            <Grid item container xs={12} justify="center">
                              <Grid item xs={11}>
                              <Slider
                                defaultValue={0}
                                aria-labelledby="discrete-slider"
                                valueLabelDisplay="off"
                                onChange={(e, v) => handleSliderChange(e, v)}
                                step={25}
                                marks={[{ value: 0, label: '0%', }, { value: 25, label: '25%', }, { value: 50, label: '50%', }, { value: 75, label: '75%', }, { value: 100, label: '100%', }]}
                                min={0}
                                max={100}
                              />
                              </Grid>
                            </Grid>
                            <Grid item xs={12}>
                              <Button fullWidth className={classes.button} color="primary" variant="contained" onClick={() => handleDepositSubmit()}>
                                Deposit
                              </Button>
                            </Grid>
                          </Grid>
                        </TabPanel>
                        <TabPanel value="2" className={classes.tabContent}>
                          <Grid container item spacing={4}>
                            <Grid container item xs={12} direction='row' justify="center">
                              <Grid container item xs={6} direction='column' alignItems='center'>
                                <Grid item> <Typography variant="body1">Deposited</Typography> </Grid>
                                <Grid item> <Typography variant="body1">{ethData.deposit}</Typography> </Grid>
                              </Grid>
                              <Grid container item xs={6} direction='column' alignItems='center'>
                                <Grid item> <Typography variant="body1">Earnings</Typography> </Grid>
                                <Grid item> <Typography variant="body1">{ethData.earnings}</Typography> </Grid>
                              </Grid>
                            </Grid>
                            <Grid container item xs={12} direction='row' justify="space-between">
                              <TextField color="primary" variant="filled" value={amount} autoFocus={true} className={classes.input} label={`${ethData.asset} Amount`} onChange={e => handleAmountChange(e)} />
                            </Grid>
                            <Grid item container xs={12} justify="center">
                              <Grid item xs={11}>
                              <Slider
                                defaultValue={0}
                                aria-labelledby="discrete-slider"
                                valueLabelDisplay="off"
                                onChange={(e, v) => handleSliderChange(e, v)}
                                step={25}
                                marks={[{ value: 0, label: '0%', }, { value: 25, label: '25%', }, { value: 50, label: '50%', }, { value: 75, label: '75%', }, { value: 100, label: '100%', }]}
                                min={0}
                                max={100}
                              />
                              </Grid>
                            </Grid>
                            <Grid item xs={12}>
                              <Button fullWidth className={classes.button} color="primary" variant="contained" onClick={() => handleWithdrawSubmit()}>
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