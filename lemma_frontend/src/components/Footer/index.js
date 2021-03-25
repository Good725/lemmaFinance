import React from "react";
import withStyles from "@material-ui/core/styles/withStyles";
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';

const footerStyle = {
  footer: {
    height: '5vw',
    background: '#F4F8F9',
  },
  button: {
    fontSize: '1.1vw',
    lineHeight: '1.1vw',
    color: '#19284B',
  },
}

function Footer({ classes }) {

  return (
    <Grid container className={classes.footer} justify='space-evenly' alignItems='center'>
      <Grid item className={classes.button}>
        <Button className={classes.button} color="primary" href="/terms">
          Terms Of Service
        </Button>
      </Grid>
      <Grid item className={classes.button}>
        <Button className={classes.button} color="primary" href="/privacy">
          Privacy
        </Button>
      </Grid>
      <Grid item className={classes.button}>
        <Button className={classes.button} color="primary" onClick={() => { window.location.href = "mailto:matthieu@eiventures.io"; }}>
          Contact Us
        </Button>
      </Grid>
    </Grid>
  );
}

export default withStyles(footerStyle)(Footer);
