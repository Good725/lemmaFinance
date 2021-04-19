import React, { useState } from "react";
import { withStyles } from '@material-ui/core/styles';
import { Grid, Button, TextField, Paper, Snackbar, Typography } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { styles } from './styles';
import { axios_request } from 'utils/rest_request';

function LaunchPage({ classes }) {

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handleSubmitClick = () => {
    const emailObj = {
      email: {
        email
      }
    };
    const url = 'https://api.sheety.co/a7212da9bb1fc02c085b10c5607ce541/lemmaEmailList/emails';
    axios_request(url, emailObj);
    setEmail('');
    setOpen(true);
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

  return (
    <div className={classes.root}>
      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose} anchorOrigin={alertAnchor}>
        <Alert elevation={6} variant="filled" onClose={handleClose} severity="success">
          Registered successfully!
        </Alert>
      </Snackbar>
      <div className={classes.body}>
        <Grid container justify="center">
          <Grid container item xs={11} md={9} xl={8} className={classes.navigationContainer} justify="flex-start">
            <Grid item container xs={4} alignItems="center">
              <Grid item><img className={classes.logoImg} src={require('../../assets/img/logo.png')} alt="" /></Grid>
              <Grid item><Typography className={classes.logo} variant="body2"><b>LEMMA</b></Typography></Grid>
            </Grid>
          </Grid>

          <Grid container item xs={10} md={9} xl={8} className={classes.mainContainer} justify="center">

            <Grid container item direction="column">
              <Grid item className={classes.title}>Superior, low risk, sustainable yield.</Grid>
              <Grid item className={classes.subtitle}>Deposit USDC and we’ll earn you money via basis trading.</Grid>
            </Grid>

            <Grid container item className={classes.contentContainer} justify="center">
              <Grid container item xs={12} md={4} className={classes.paperContainer}>
                <Paper className={classes.actionPaper} elevation={5}>
                  <Grid container item className={classes.actionContainer} direction='column' alignItems='center' spacing={4}>
                    <Grid item>
                      <img className={classes.assetLogo} src={require('../../assets/img/logo.png')} alt="" />
                    </Grid>
                    <Grid container item xs={10} justify="center">
                      <Grid item><Typography variant="body1" className={classes.content}>1 Million USDC cap</Typography></Grid>
                      <Grid item><Typography variant="body2" className={classes.content}>Register now</Typography></Grid>
                      <Grid item xs={12}>
                        <TextField color="primary" variant="filled" value={email} autoFocus={true} className={classes.input} label="Email" onChange={e => handleEmailChange(e)} />
                      </Grid>
                      <Grid item xs={12}>
                        <Button fullWidth className={classes.button} color="primary" variant="contained" onClick={() => handleSubmitClick()}>
                          Submit
                        </Button>
                      </Grid>
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

export default withStyles(styles)(LaunchPage);