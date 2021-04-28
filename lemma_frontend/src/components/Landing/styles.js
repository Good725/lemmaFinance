import Background from "../../assets/img/background.jpg";

export const styles = (theme) => ({
  // ******************** MAIN LANDING *************** //
  root: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  body: {
    position: "relative",
    height: "100%",
    backgroundImage: `url(${Background})`,
    backgroundSize: "cover",
    [theme.breakpoints.down("sm")]: {
      height: "unset",
    },
  },
  navigationContainer: {
    [theme.breakpoints.down("sm")]: {
      marginTop: "8vw",
    },
    [theme.breakpoints.up("md")]: {
      marginTop: "2vw",
    },
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
  connectButton: {
    textTransform: "none",
    [theme.breakpoints.down("sm")]: {
      color: "#6A758A",
      border: "solid 2px #6A758A",
      "&:hover": {
        border: "solid 2px #6A758A",
      },
    },
    [theme.breakpoints.up("md")]: {
      color: "white",
      border: "solid 2px white",
      "&:hover": {
        border: "solid 2px white",
      },
    },
  },
  navButton: {
    textTransform: "none",
    color: "white",
  },
  title: {
    marginBottom: "1vh",
    fontFamily: "Roboto",
    color: "#1E242B",
    textAlign: "center",
    fontWeight: "bold",

    [theme.breakpoints.down("sm")]: {
      marginTop: "5vh",
      fontSize: "10vw",
      lineHeight: "10.5vw",
    },
    [theme.breakpoints.up("md")]: {
      fontSize: "3.2vw",
      lineHeight: "4vw",
    },
  },
  subtitle: {
    fontFamily: "Roboto",
    color: "#6A758A",
    textAlign: "center",

    [theme.breakpoints.down("sm")]: {
      marginTop: "2vw",
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
    [theme.breakpoints.down("sm")]: {
      marginTop: "10vw",
      marginBottom: "10vw",
    },
  },
  actionPaper: {
    width: "100%",
    paddingTop: "2vw",
    paddingBottom: "1vw",
    paddingLeft: "0.5vw",
    paddingRight: "0.5vw",
    borderRadius: "20px",
    background: "rgba( 255, 255, 255, 0.55 )",
    boxShadow: "0 8px 32px 0 rgba( 31, 38, 135, 0.37 )",
    backdropFilter: "blur( 8px )",
    border: "1px solid rgba( 255, 255, 255, 0.18 )",
    [theme.breakpoints.down("sm")]: {
      paddingTop: "5vw",
    },
  },
  assetLogo: {
    maxHeight: 50,
    marginBottom: "-16px",
  },
  tab: {
    textTransform: "none",
    color: "#1E242B",
    borderBottom: "2px solid #b9c9af",
    [theme.breakpoints.down("sm")]: {
      minWidth: "34.5vw",
    },
    [theme.breakpoints.up("md")]: {
      minWidth: "9.5vw",
    },
  },
  tabContent: {
    [theme.breakpoints.up("md")]: {
      paddingTop: "1.5vw",
    },
  },
  input: {
    width: "100%",
    height: "50px",
    color: "white",
  },
  button: {
    color: "white",
    height: "54px",
  },
});
