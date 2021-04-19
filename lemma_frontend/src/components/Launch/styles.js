import Background from '../../assets/img/background.jpg';

export const styles = theme => ({

  // ******************** MAIN LANDING *************** //
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `url(${Background})`
    // backgroundColor: '#F4F7FA'
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
    display: 'inline-block',
    paddingLeft: '15px',
  },
  logoImg: {
    display: 'inline-block',
    height: 40
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
  actionPaper: {
    width: '100%',
    paddingTop: '2vw',
    paddingBottom: '2vw',
    paddingLeft: '0.5vw',
    paddingRight: '0.5vw',
    borderRadius: '20px',
    background: 'rgba( 255, 255, 255, 0.55 )',
    boxShadow: '0 8px 32px 0 rgba( 31, 38, 135, 0.37 )',
    backdropFilter: 'blur( 8px )',
    border: '1px solid rgba( 255, 255, 255, 0.18 )',
  },
  content: {
    fontSize: '1.5vw',
  },
  assetLogo: {
    maxHeight: 50
  },
  input: {
    width: '100%',
    height: '50px',
    color: 'white',
    marginBottom: '2vw',
    marginTop: '2vw'
  },
  button: {
    color: 'white',
    height: '54px'
  },


})