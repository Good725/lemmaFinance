import React from "react";
import { withStyles } from '@material-ui/core/styles';
import { CircularProgress } from '@material-ui/core';
import { styles } from './styles';

function Loading({ classes }) {

  return (
    <div className={classes.loadingContainer}>
      <CircularProgress className={classes.loading}/>
    </div>
  );
}

export default withStyles(styles)(Loading);