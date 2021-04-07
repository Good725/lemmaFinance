import React, { useState } from "react";
import { withStyles } from '@material-ui/core/styles';
import { Grid, Paper, Typography } from '@material-ui/core';
import classNames from 'classnames';

import { styles } from './styles';

function Table({ classes }) {
  const [selectedAsset, setSelectedAsset] = useState(0);

  const handleAssetClick = (assetNumber) => {
    setSelectedAsset(assetNumber);
  };

  const tableData = [
    {
      'image_url': require('../../assets/img/usdc.png'),
      'asset': 'USDC',
      'balance': '0',
      'deposit': '0',
      'apy': '90%',
      'earnings': '0',
      'assetNumber': '0'
    },
    {
      'image_url': require('../../assets/img/eth.png'),
      'asset': 'ETH',
      'balance': '0',
      'deposit': '0',
      'apy': '12%',
      'earnings': '0',
      'assetNumber': '1'
    },
    {
      'image_url': require('../../assets/img/uni.png'),
      'asset': 'UNI',
      'balance': '0',
      'deposit': '0',
      'apy': '12%',
      'earnings': '0',
      'assetNumber': '2'
    },
  ];

  return (
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
        {tableData.map(row => {
            return (
            <Grid
                container
                item
                className={classNames(selectedAsset == row.assetNumber ? classes.selectedTableButton : classes.tableButton)}
                onClick={() => handleAssetClick(row.assetNumber)}
                key={row.asset}
            >
                <Grid container item>
                <Grid container item xs={2} direction="column" justify="center" alignItems="center">
                    <Grid item>
                    <img className={classes.assetLogo} src={row.image_url} alt="" />
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
            );
        })}
        </Grid>
    </Paper>
    </Grid>
  );
}

export default withStyles(styles)(Table);