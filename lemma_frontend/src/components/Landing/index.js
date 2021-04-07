import React, { useState } from "react";
import { withStyles } from '@material-ui/core/styles';
import { Grid, Button, TextField, Paper, Snackbar, Typography, Tab } from '@material-ui/core';
import { TabPanel, TabContext, Alert, TabList } from '@material-ui/lab';
import { useWallet } from 'use-wallet';
import { styles } from './styles';
// import Table from "../Table/index";


function LandingPage({ classes }) {
  const wallet = useWallet();
  console.log("--------------------", {wallet})
  const [amount, setAmount] = useState('');
  const [tabIndex, setTabIndex] = useState("1");
  const [open, setOpen] = useState(false);

  const handleAmountChange = event => {
    setAmount(event.target.value);
  };

  const handleMaxClick = () => {
    setAmount(wallet.balance/Math.pow(10, 18));
  };

  const handleDepositSubmit = () => {
    console.log(amount);
  };

  const handleWithdrawSubmit = () => {
    console.log(amount);
  };

  const handleConnectWallet = () => {
    wallet.connect();
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

  const usdcData = {
    'image_url': require('../../assets/img/usdc.png'),
    'asset': 'USDC',
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
          Signed up successfully!
        </Alert>
      </Snackbar>
      <div className={classes.body}>
        <Grid container justify="center">
          <Grid container item xs={11} md={9} xl={8} className={classes.navigationContainer} justify="space-between">
            <Grid item container xs={4} alignItems="center">
              <Grid item><img className={classes.logoImg} src={require('../../assets/img/logo.png')} alt=""/></Grid>
              <Grid item><Typography className={classes.logo} variant="body1"><b>LEMMA</b></Typography></Grid>
            </Grid>
            <Grid item>
              <Button color="primary" className={classes.lcText} variant="outlined" onClick={() => handleConnectWallet()}>
                { wallet.account ?  wallet.account.slice(0,8) + "..." : "Connect Wallet"}
              </Button>
            </Grid>
          </Grid>

          <Grid container item xs={10} md={9} xl={8} className={classes.mainContainer} justify="center">

            <Grid container item direction="column">
              <Grid item className={classes.title}>Superior, low risk, sustainable yield.</Grid>
              <Grid item className={classes.subtitle}>Deposit USDC and we’ll earn you money via cash & carry.</Grid>
            </Grid>

            <Grid container item className={classes.contentContainer} justify="center">
              <Grid container item xs={12} md={4} className={classes.paperContainer}>
                <Paper className={classes.actionPaper} elevation={5}>
                  <Grid container item className={classes.actionContainer} direction='column' alignItems='center' spacing={4}>
                    <Grid item>
                      <img className={classes.assetLogo} src={usdcData.image_url} alt="" />
                    </Grid>
                    <Grid container item justify="center">
                      <TabContext value={tabIndex}>
                        <TabList
                          onChange={handleTabChange}
                          indicatorColor="primary"
                          centered
                        >
                          <Tab label="Deposit USDC" value="1" className={classes.tab} />
                          <Tab label="Withdraw USDC" value="2" className={classes.tab} />
                        </TabList>
                        <TabPanel value="1" className={classes.tabContent}>
                          <Grid container item spacing={5}>
                            <Grid container item xs={12} direction='row' justify="center">
                              <Grid container item xs={6} direction='column' alignItems='center'>
                                <Grid item> <Typography variant="body1">Earn APY</Typography> </Grid>
                                <Grid item> <Typography variant="body1">{usdcData.apy}</Typography> </Grid>
                              </Grid>
                              <Grid container item xs={6} direction='column' alignItems='center'>
                                <Grid item> <Typography variant="body1">Wallet Balance</Typography> </Grid>
                                <Grid item> <Typography variant="body1">{wallet.balance > -1 ? wallet.balance/Math.pow(10, 18) : 0}</Typography> </Grid>
                              </Grid>
                            </Grid>
                            <Grid container item xs={12} direction='row' justify="space-between">
                              <Grid item xs={8}>
                                <TextField color="primary" variant="outlined" value={amount} autoFocus={true} className={classes.input} label="Amount" onChange={e => handleAmountChange(e)} />
                              </Grid>
                              <Grid item xs={3}>
                                <Button className={classes.secondaryButton} color="secondary" variant="contained" onClick={() => handleMaxClick()}>
                                  Max
                                </Button>
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
                          <Grid container item spacing={3}>
                            <Grid container item xs={12} direction='row' justify="center">
                              <Grid container item xs={6} direction='column' alignItems='center'>
                                <Grid item> <Typography variant="body1">Deposited</Typography> </Grid>
                                <Grid item> <Typography variant="body1">{usdcData.deposit}</Typography> </Grid>
                              </Grid>
                              <Grid container item xs={6} direction='column' alignItems='center'>
                                <Grid item> <Typography variant="body1">Earnings</Typography> </Grid>
                                <Grid item> <Typography variant="body1">{usdcData.earnings}</Typography> </Grid>
                              </Grid>
                            </Grid>
                            <Grid container item xs={12} direction='row' justify="space-between">
                              <Grid item xs={8}>
                                <TextField color="primary" variant="outlined" autoFocus={true} className={classes.input} label="Amount" onChange={e => handleAmountChange(e)} />
                              </Grid>
                              <Grid item xs={3}>
                                <Button className={classes.secondaryButton} color="secondary" variant="contained" onClick={() => handleAmountChange(usdcData.balance)}>
                                  Max
                                  </Button>
                              </Grid>
                            </Grid>
                            <Grid item xs={12}>
                              <TextField color="primary" variant="outlined" autoFocus={true} className={classes.input} label={`${usdcData.asset} Wallet Address`} onChange={e => handleAmountChange(e)} />
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