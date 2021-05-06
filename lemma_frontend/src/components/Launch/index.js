import React, { useState } from "react";
import { withStyles } from "@material-ui/core/styles";
import { useHistory } from "react-router-dom";
import {
  Grid,
  Button,
  TextField,
  Paper,
  Snackbar,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Fab,
  Link,
  CircularProgress,
} from "@material-ui/core";
import TwitterIcon from "@material-ui/icons/Twitter";
import { Alert } from "@material-ui/lab";
import { styles } from "./styles";
import { axios_request } from "../../utils/rest_request";
import DiscordIcon from "../../assets/img/discord.svg";
import { utils, getDefaultProvider } from "ethers";

function LaunchPage({ classes }) {
  const [open, setOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [loadOpen, setLoadOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadMessage, setLoadMessage] = useState("");
  const [address, setAddress] = useState("");
  const [twitter, setTwitter] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const provider = getDefaultProvider(
    "https://mainnet.infura.io/v3/2a1a54c3aa374385ae4531da66fdf150"
  );
  const history = useHistory();

  function getSteps() {
    return [
      "Enter ETH wallet address or ENS name",
      "Tweet about us!",
      "Join our community :)",
    ];
  }

  function getStepContent(step) {
    switch (step) {
      case 0:
        return (
          <Grid item xs={12}>
            <TextField
              color="primary"
              variant="filled"
              value={address}
              className={classes.input}
              label="ETH Wallet Info"
              onChange={(e) => handleAddressChange(e)}
            />
          </Grid>
        );
      case 1:
        return (
          <Grid item xs={12}>
            <Link
              target="_blank"
              href="https://twitter.com/intent/tweet?text=Looking%20forward%20to%20making%20superior%20%26%20sustainable%20yield%20on%20my%20ETH%20thanks%20to%20@lemmafinance's%20basis%20trading%20protocol%20%23yield%20%23defi"
            >
              <Button
                className={classes.twitterButton}
                startIcon={<TwitterIcon />}
                variant="contained"
              >
                Tweet!
              </Button>
            </Link>
            <TextField
              color="primary"
              variant="filled"
              value={twitter}
              className={classes.input}
              label="Twitter Post URL"
              onChange={(e) => handleTwitterChange(e)}
            />
          </Grid>
        );
      case 2:
        return (
          <Grid item container xs={12} spacing={3}>
            <Grid item>
              <Link target="_blank" href="https://twitter.com/LemmaFinance">
                <Fab className={classes.twitterFab}>
                  <TwitterIcon />
                </Fab>
              </Link>
            </Grid>
            <Grid item>
              <Link target="_blank" href="https://discord.gg/7w9HaVVJ">
                <Fab className={classes.discordFab}>
                  <img src={DiscordIcon} className={classes.discordIcon} />
                </Fab>
              </Link>
            </Grid>
          </Grid>
        );
      default:
        return "Unknown step";
    }
  }

  const steps = getSteps();

  const getIsAddressValid = (address) => {
    return utils.isAddress(address);
  };
  const getIsTwitterURLValid = (twitterURL) => {
    const twitterRegEX = /http(?:s)?:\/\/(?:www\.)?twitter\.com\/([a-zA-Z0-9_]+)/;
    const match = twitter.match(twitterRegEX);
    console.log(match);
    if (!match) {
      return false;
    }
    return true;
  };
  const handleNext = async () => {
    if (activeStep === 0) {
      const isAddressValid = getIsAddressValid(address);

      //if not valid then
      //for resolving ens names
      if (!isAddressValid) {
        setLoadMessage("Resolving ENS name");
        setErrorOpen(false);
        setLoadOpen(true);
        const actualAddress = await provider.resolveName(address);
        setLoadOpen(false);
        //actual address will be null if there is no ens name exists
        if (actualAddress) {
          setAddress(actualAddress);
        } else {
          setErrorMessage("Enter a valid ETH wallet address or ENS name");
          setErrorOpen(true);
          setActiveStep(-1);
        }
      }
    }
    if (activeStep === 1) {
      const isValidTwitterURL = getIsTwitterURLValid(twitter);
      if (!isValidTwitterURL) {
        setErrorMessage("Enter a valid tweet URL");
        setErrorOpen(true);
        setActiveStep(0);
      }
    }
    if (activeStep === steps.length - 1) {
      if (!getIsAddressValid(address)) {
        setErrorMessage("Enter a valid ETH wallet address or ENS name");
        setErrorOpen(true);
        setActiveStep(-1);
      } else if (!getIsTwitterURLValid(twitter)) {
        //when user click on more than one time this could happen
        setErrorMessage("Enter a valid tweet URL");
        setErrorOpen(true);
        setActiveStep(0);
      } else {
        const userObj = {
          user: {
            address,
            twitter,
          },
        };
        const url =
          "https://api.sheety.co/a7212da9bb1fc02c085b10c5607ce541/lemmaEmailList/users";
        axios_request(url, userObj);
        setAddress("");
        setTwitter("");
        setOpen(true);
      }
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);

    console.log(activeStep);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleAddressChange = (event) => {
    setAddress(event.target.value);
  };

  const handleTwitterChange = (event) => {
    setTwitter(event.target.value);
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
    setErrorOpen(false);
    setLoadOpen(false);
  };

  const alertAnchor = {
    vertical: "top",
    horizontal: "center",
  };

  return (
    <div className={classes.root}>
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={alertAnchor}
      >
        <Alert
          elevation={6}
          variant="filled"
          onClose={handleClose}
          severity={"success"}
        >
          Successfully reserved allocation!
        </Alert>
      </Snackbar>
      <Snackbar
        open={errorOpen}
        autoHideDuration={3000}
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
          {loadMessage}
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
                  onClick={() => history.push("/")}
                  variant="body2"
                >
                  <b>LEMMA</b>
                </Typography>
              </Grid>
            </Grid>
            <Grid item container xs={8} justify="flex-end" spacing={5}>
              <Grid item>
                <Button className={classes.navButton} href="/">
                  Back To Testnet
                </Button>
              </Grid>
            </Grid>
          </Grid>

          <Grid
            container
            item
            xs={10}
            xl={8}
            className={classes.mainContainer}
            justify="center"
          >
            <Grid container item direction="column">
              <Grid item className={classes.title}>
                Reserve allocation for our Mainnet release
              </Grid>
              <Grid item className={classes.subtitle}>
                Initial hard cap will be 500 ETH
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
                md={4}
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
                        src={require("../../assets/img/logo.png")}
                        alt=""
                      />
                    </Grid>
                    <Grid container item xs={11} justify="center">
                      <Grid item>
                        <Typography variant="body1" className={classes.content}>
                          Whitelist Your Account
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Stepper
                          className={classes.stepperContainer}
                          activeStep={activeStep}
                          orientation="vertical"
                        >
                          {steps.map((label, index) => (
                            <Step key={label}>
                              <StepLabel>{label}</StepLabel>
                              <StepContent>
                                <Typography>{getStepContent(index)}</Typography>
                                <div className={classes.stepActionContainer}>
                                  <div>
                                    <Button
                                      disabled={activeStep === 0}
                                      onClick={handleBack}
                                      className={classes.stepButton}
                                    >
                                      Back
                                    </Button>
                                    <Button
                                      variant="contained"
                                      color="primary"
                                      onClick={handleNext}
                                      className={classes.stepButton}
                                    >
                                      {activeStep === steps.length - 1
                                        ? "Finish"
                                        : "Next"}
                                    </Button>
                                  </div>
                                </div>
                              </StepContent>
                            </Step>
                          ))}
                        </Stepper>
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
