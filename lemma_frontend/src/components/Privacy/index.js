import React from 'react';
import Grid from '@material-ui/core/Grid';
import Footer from 'components/Footer/index.js';
import PrivacySection from './section';
import withStyles from "@material-ui/core/styles/withStyles";

const styles = {
  root: {
    backgroundColor: '#F4F7FA',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
}

function Privacy({classes}) {

  return (
    <Grid container className={classes.root} justify="center">
      <Grid item xs={10}>
        <PrivacySection/>
      </Grid>
      <Footer/>
    </Grid>
  );
}

export default withStyles(styles)(Privacy);