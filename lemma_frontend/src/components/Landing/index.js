import React, { useState } from "react";
import { withStyles } from '@material-ui/core/styles';
import { Grid, Button, TextField, Paper, Snackbar, Typography, Tab } from '@material-ui/core';
import { TabPanel, TabContext, Alert, TabList } from '@material-ui/lab';
import classNames from 'classnames';

import { styles } from './styles';

function LandingPage({ classes }) {

  const [amount, setAmount] = useState('');
  const [tabIndex, setTabIndex] = useState("1");
  const [open, setOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(0);

  const handleAmountChange = event => {
    setAmount(event.target.value);
  };

  const handleDepositSubmit = () => {
    console.log(amount);
  };

  const handleWithdrawSubmit = () => {
    console.log(amount);
  };

  const handleConnectWallet = () => {
  };

  const handleAssetClick = (assetNumber) => {
    setSelectedAsset(assetNumber);
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

  const tableData = [
    {
      'image_url': require('assets/img/eth.png'),
      'asset': 'ETH',
      'balance': '0',
      'deposit': '0',
      'apy': '12%',
      'earnings': '0',
      'assetNumber': '0'
    },
    {
      'image_url': require('assets/img/bat.png'),
      'asset': 'BAT',
      'balance': '0',
      'deposit': '0',
      'apy': '12%',
      'earnings': '0',
      'assetNumber': '1'
    },
    {
      'image_url': require('assets/img/uni.png'),
      'asset': 'UNI',
      'balance': '0',
      'deposit': '0',
      'apy': '12%',
      'earnings': '0',
      'assetNumber': '2'
    },
  ]

  return (
    <div className={classes.root}>
      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose} anchorOrigin={alertAnchor}>
        <Alert elevation={6} variant="filled" onClose={handleClose} severity="success">
          Signed up successfully!
        </Alert>
      </Snackbar>
      <div className={classes.body}>
        <Grid container justify="center">
          <Grid container item xs={9} lg={8} className={classes.navigationContainer} justify="space-between">
            <Typography className={classes.logo} variant="body1"><b>LEMMA</b></Typography>
            <Button color="primary" variant="outlined" onClick={() => handleConnectWallet()}>
              Connect Wallet
            </Button>
          </Grid>

          <Grid container item xs={9} lg={8} className={classes.mainContainer} direction="row" justify="center">

            <Grid container item direction="column">
              <Grid item className={classes.title}>The Easiest Way to Arbitrage.</Grid>
              <Grid item className={classes.subtitle}>Deposit ETH tokens and we’ll earn you money via cash & carry.</Grid>
            </Grid>

            <Grid container item justify="space-between" spacing={3} className={classes.contentContainer}>
              <Grid container item xs={8}>
                <Paper className={classes.tablePaper} elevation={5}>
                  <Grid container item direction="column" justify="center" alignItems="center" spacing={2}>
                    <Grid container item>
                      <Grid item xs={2}><Typography variant="body1">Switch to:</Typography></Grid>
                      <Grid item xs={2}><Typography variant="body1">Asset</Typography></Grid>
                      <Grid item xs={2}><Typography variant="body1">Wallet Balance</Typography></Grid>
                      <Grid item xs={2}><Typography variant="body1">Deposited Balance</Typography></Grid>
                      <Grid item xs={2}><Typography variant="body1">Earn APY</Typography></Grid>
                      <Grid item xs={2}><Typography variant="body1">Earnings</Typography></Grid>
                    </Grid>
                    { tableData.map(row => {
                      return (
                        <Grid 
                          container 
                          item 
                          className={classNames(selectedAsset == row.assetNumber ? classes.selectedTableButton : classes.tableButton )} 
                          onClick={() => handleAssetClick(row.assetNumber)}
                          key={row.asset}
                        >
                          <Grid container item>
                            <Grid container item xs={2} direction="column" justify="center" alignItems="center">
                              <Grid item> 
                                <img className={classes.assetLogo} src={row.image_url} alt=""/>
                              </Grid>
                            </Grid>
                            <Grid container item xs={2} direction="column" justify="center" alignItems="center">
                              <Grid item> 
                                <Typography variant="body2">{row.asset}</Typography>
                              </Grid>
                            </Grid>
                            <Grid container item xs={2} direction="column" justify="center" alignItems="center">
                              <Grid item> 
                                <Typography variant="body2">{row.balance}</Typography>
                              </Grid>
                            </Grid>
                            <Grid container item xs={2} direction="column" justify="center" alignItems="center">
                              <Grid item> 
                                <Typography variant="body2">{row.deposit}</Typography>
                              </Grid>
                            </Grid>
                            <Grid container item xs={2} direction="column" justify="center" alignItems="center">
                              <Grid item> 
                                <Typography variant="body2">{row.apy}</Typography>
                              </Grid>
                            </Grid>
                            <Grid container item xs={2} direction="column" justify="center" alignItems="center">
                              <Grid item> 
                                <Typography variant="body2">{row.earnings}</Typography>
                              </Grid>
                            </Grid>
                          </Grid>
                        </Grid>
                      )
                    })}
                  </Grid>
                </Paper>
              </Grid>
              <Grid container item xs={4} className={classes.paperContainer}>
                <Paper className={classes.actionPaper} elevation={5}>
                  <Grid container item className={classes.actionContainer} direction='column' alignItems='center' spacing={3}>
                    <Grid item>
                      <img className={classes.assetLogo} src={tableData[selectedAsset].image_url} alt=""/>
                    </Grid>
                    <Grid container item justify="center" spacing={1}>
                      <TabContext value={tabIndex}>
                        <TabList
                          onChange={handleTabChange}
                          indicatorColor="primary"
                          variant= "fullWidth"
                          centered
                        >
                          <Tab label="Deposit" value="1" className={classes.tab}/>
                          <Tab label="Withdraw" value="2" className={classes.tab}/>
                        </TabList>
                        <TabPanel value="1">
                          <Grid container item spacing={3}>
                            <Grid container item xs={12} direction='row' justify="center">
                              <Grid container item xs={6} direction='column' alignItems='center'>
                                <Grid item> <Typography variant="body1">Earn APY</Typography> </Grid>
                                <Grid item> <Typography variant="body1">{tableData[selectedAsset].apy}</Typography> </Grid>
                              </Grid>
                              <Grid container item xs={6} direction='column' alignItems='center'>
                                <Grid item> <Typography variant="body1">Wallet Balance</Typography> </Grid>
                                <Grid item> <Typography variant="body1">{tableData[selectedAsset].balance}</Typography> </Grid>
                              </Grid>
                            </Grid>
                            <Grid container item xs={12} direction='row' justify="space-between">
                              <Grid item xs={8}>
                                <TextField color="primary" variant="outlined" autoFocus={true} className={classes.input} label="Amount" onChange={e => handleAmountChange(e)} />
                              </Grid>
                              <Grid item xs={3}>
                                <Button className={classes.secondaryButton} color="secondary" variant="contained" onClick={() => handleAmountChange(tableData[selectedAsset].balance)}>
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
                        <TabPanel value="2">
                          <Grid container item spacing={3}>
                              <Grid container item xs={12} direction='row' justify="center">
                                <Grid container item xs={6} direction='column' alignItems='center'>
                                  <Grid item> <Typography variant="body1">Deposited</Typography> </Grid>
                                  <Grid item> <Typography variant="body1">{tableData[selectedAsset].deposit}</Typography> </Grid>
                                </Grid>
                                <Grid container item xs={6} direction='column' alignItems='center'>
                                  <Grid item> <Typography variant="body1">Earnings</Typography> </Grid>
                                  <Grid item> <Typography variant="body1">{tableData[selectedAsset].earnings}</Typography> </Grid>
                                </Grid>
                              </Grid>
                              <Grid container item xs={12} direction='row' justify="space-between">
                                <Grid item xs={8}>
                                  <TextField color="primary" variant="outlined" autoFocus={true} className={classes.input} label="Amount" onChange={e => handleAmountChange(e)} />
                                </Grid>
                                <Grid item xs={3}>
                                  <Button className={classes.secondaryButton} color="secondary" variant="contained" onClick={() => handleAmountChange(tableData[selectedAsset].balance)}>
                                    Max
                                  </Button>
                                </Grid>
                              </Grid>
                              <Grid item xs={12}>
                                <TextField color="primary" variant="outlined" autoFocus={true} className={classes.input} label="Amount" onChange={e => handleAmountChange(e)} />
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