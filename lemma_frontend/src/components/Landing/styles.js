export const styles = theme => ({

  // ******************** MAIN LANDING *************** //
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F4F7FA'
  },
  body: {
    position: 'relative',
  },
  navigationContainer: {
    marginTop: '2vw',
  },
  mainContainer: {
    marginTop: '3vw',
  },
  logo: {
    border: '3px solid',
    paddingLeft: '20px',
    paddingRight: '20px',
    paddingTop: '5px',
    paddingBottom: '5px',
  },
  title: {
    marginBottom: '1vh',
    fontFamily: 'Roboto',
    color: '#1E242B',
    fontStyle: 'normal',
    fontWeight: 'normal',
    textAlign: 'center',

    [theme.breakpoints.down('sm')]: {
      marginTop: '7vh',
      fontSize: '7.5vw',
      lineHeight: '8.5vw'
    },
    [theme.breakpoints.up('md')]: {
      fontSize: '3.2vw',
      lineHeight: '4vw',
    },
  },
  subtitle: {
    fontFamily: 'Roboto',
    fontStyle: 'normal',
    fontWeight: 'normal',
    color: '#6A758A',
    textAlign: 'center',

    [theme.breakpoints.down('sm')]: {
      fontSize: '5vw',
      lineHeight: '5.5vw',
    },
    [theme.breakpoints.up('md')]: {
      fontSize: '1.5vw',
      lineHeight: '2.2vw',
    },
  },

  //*************************** PAPER **********************************//
  //********************************************************************//

  contentContainer: {
    marginTop: '3vw',
  },
  tableContainer: {
    maxHeight: 440,
  },
  actionContainer: {
  },
  tablePaper: {
    width: '100%',
    paddingTop: '3vw',
    paddingBottom: '2vw',
    paddingLeft: '2vw',
    paddingRight: '2vw',
  },
  actionPaper: {
    width: '100%',
    paddingTop: '2vw',
    paddingBottom: '1vw',
    paddingLeft: '0.5vw',
    paddingRight: '0.5vw',
  },
  tableButton: {
    borderRadius: 15,
    marginTop: '1vw',
    '&:hover': {
      background: "#F4F7FA",
   },
  },
  selectedTableButton: {
    marginTop: '1vw',
    background: '#D9F3E7',
    borderRadius: 15
  },
  assetLogo: {
    maxHeight: 60
  },
  tab: {
    minWidth: 140,
  },
  input: {
    width: '100%',
    height: '50px'
  },
  button: {
    color: 'white',
    height: '50px'
  },
  secondaryButton: {
    color: '#52B788',
    width: '100%',
    height: '50px'
  }

})