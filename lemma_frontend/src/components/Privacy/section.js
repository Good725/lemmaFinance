import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';

const styles = theme => ({
  title: {
    textAlign: 'center',
    fontSize: '30px',
    color: '#19284B',
  },
  content: {
    fontSize: '17px',
    color: '#19284B',
  },
});

function PrivacySection({ classes }) {

  return (
    <Grid container justify="center">
      <Grid item xs={12} className={classes.title}>
        <h2> Privacy Policy </h2>
      </Grid> 
      <Grid item xs={12} className={classes.content}>
        <h3>Your privacy is important to us. It is Lemma's policy to respect your privacy regarding any information we may collect from you across our website, <a href="https://lemma.finance">https://lemma.finance</a>, and other sites we own and operate.</h3>
        <h3>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent.</h3>
        <h3> These are the ways we use your Zoom meeting data:
          <ul>
            <li> We import, transcribe and use a machine learning model to summarize your meetings.</li>
            <li> We store that data in a secure database to provide you with the dashboard you see on our website.</li>
          </ul>
        </h3>
        <h3>We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, as well as unauthorised access, disclosure, copying, use or modification.</h3>
        <h3>We don’t share any personally identifying information publicly or with third-parties, except when required to by law.</h3>
        <h3>Our website may link to external sites that are not operated by us. Please be aware that we have no control over the content and practices of these sites, and cannot accept responsibility or liability for their respective privacy policies.</h3>
        <h3>You are free to refuse our request for your personal information, with the understanding that we may be unable to provide you with some of your desired services.</h3>
        <h3>Your continued use of our website will be regarded as acceptance of our practices around privacy and personal information. If you have any questions about how we handle user data and personal information, feel free to contact us.</h3>
        <h3>This policy is effective as of 11 July 2020.</h3>
      </Grid>
    </Grid>
  );
}

PrivacySection.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(PrivacySection);