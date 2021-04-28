import Background from "../../assets/img/background.jpg";

export const styles = (theme) => ({
  // ******************** MAIN LANDING *************** //
  root: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // backgroundColor: '#F4F7FA'
  },
  body: {
    height: "100%",
    position: "relative",
    backgroundImage: `url(${Background})`,
    backgroundSize: "cover",
    [theme.breakpoints.down("sm")]: {
      height: "unset",
    },
  },
  navigationContainer: {
    marginTop: "2vw",
  },
  mainContainer: {
    marginTop: "3vw",
  },
  logo: {
    display: "inline-block",
    paddingLeft: "15px",
    color: "#6A758A",
    [theme.breakpoints.down("sm")]: {
      fontSize: "4vw",
    },
    [theme.breakpoints.up("md")]: {
      fontSize: "1vw",
    },
  },
  logoImg: {
    display: "inline-block",
    height: 40,
  },
  navButton: {
    textTransform: "none",
    color: "white",
  },
  title: {
    marginBottom: "1vh",
    fontFamily: "Roboto",
    color: "#1E242B",
    fontStyle: "normal",
    fontWeight: "normal",
    textAlign: "center",

    [theme.breakpoints.down("sm")]: {
      marginTop: "7vh",
      fontSize: "7.5vw",
      lineHeight: "8.5vw",
    },
    [theme.breakpoints.up("md")]: {
      fontSize: "3.2vw",
      lineHeight: "4vw",
    },
  },
  subtitle: {
    fontFamily: "Roboto",
    fontStyle: "normal",
    fontWeight: "normal",
    color: "#6A758A",
    textAlign: "center",

    [theme.breakpoints.down("sm")]: {
      fontSize: "5vw",
      lineHeight: "5.5vw",
    },
    [theme.breakpoints.up("md")]: {
      fontSize: "1.5vw",
      lineHeight: "2.2vw",
    },
  },

  //*************************** PAPER **********************************//
  //********************************************************************//

  contentContainer: {
    marginTop: "3vw",
    marginBottom: "10vw",
  },
  actionPaper: {
    width: "100%",
    paddingTop: "2vw",
    paddingLeft: "0.5vw",
    paddingRight: "0.5vw",
    borderRadius: "20px",
    background: "rgba( 255, 255, 255, 0.55 )",
    boxShadow: "0 8px 32px 0 rgba( 31, 38, 135, 0.37 )",
    backdropFilter: "blur( 8px )",
    border: "1px solid rgba( 255, 255, 255, 0.18 )",
  },
  content: {
    // fontSize: "1.5vw",
    marginBottom: "1vw",
  },
  assetLogo: {
    maxHeight: 50,
  },
  stepperContainer: {
    backgroundColor: "transparent",
  },
  stepActionContainer: {
    marginBottom: theme.spacing(2),
  },
  stepButton: {
    marginTop: theme.spacing(1),
    marginRight: theme.spacing(1),
    color: "white",
  },
  input: {
    width: "100%",
    color: "white",
    marginTop: "1vw",
    marginBottom: "1.5vw",
  },
  twitterButton: {
    backgroundColor: "#1DA1F2",
    width: "100%",
    color: "white",
    marginTop: "1vw",
    height: "51px",
    "&:hover": {
      backgroundColor: "#55b8f5",
    },
  },
  twitterFab: {
    backgroundColor: "#1DA1F2",
    color: "white",
    marginTop: "1vw",
    marginBottom: "1.5vw",
    "&:hover": {
      backgroundColor: "#55b8f5",
    },
  },
  discordFab: {
    backgroundColor: "#7289DA",
    marginTop: "1vw",
    marginBottom: "1.5vw",
    "&:hover": {
      backgroundColor: "#91a3e2",
    },
  },
  discordIcon: {
    width: "32px",
  },
});
