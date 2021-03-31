import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import Grid from '@material-ui/core/Grid';
import Footer from '../../components/Footer/index.js';

const styles = theme => ({
  root: {
    backgroundColor: '#F4F7FA',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  title: {
    color: '#19284B',
    textAlign: 'center'
  },
  content: {
    color: '#19284B',
    display: 'flex',
    flexWrap: 'wrap',
  },
});

function Terms({ classes }) {
  return (
    <Grid container justify="center" className={classes.root}>
      <Grid item xs={12} className={classes.title}>
        <h2> Lemma Terms of Service </h2>
      </Grid>
      <Grid item xs={6} className={classes.content}>
        <h3>1. Terms</h3>
        <p>By accessing the website at <a href="https://lemma.finance">https://lemma.finance</a>, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site. The materials contained in this website are protected by applicable copyright and trademark law.</p>
        <h3>2. Use License</h3>
        <ol type="a">
          <li>Permission is granted to temporarily download one copy of the materials (information or software) on Lemma's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
           <ol type="i">
              <li>modify or copy the materials;</li>
              <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
              <li>attempt to decompile or reverse engineer any software contained on Lemma's website;</li>
              <li>remove any copyright or other proprietary notations from the materials; or</li>
              <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
            </ol>
          </li>
          <li>This license shall automatically terminate if you violate any of these restrictions and may be terminated by Lemma at any time. Upon terminating your viewing of these materials or upon the termination of this license, you must destroy any downloaded materials in your possession whether in electronic or printed format.</li>
        </ol>
        <h3>3. Disclaimer</h3>
        <ol type="a">
          <li>The materials on Lemma's website are provided on an 'as is' basis. Lemma makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</li>
          <li>Further, Lemma does not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the materials on its website or otherwise relating to such materials or on any sites linked to this site.</li>
        </ol>
        <h3>4. Limitations</h3>
        <p>In no event shall Lemma or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Lemma's website, even if Lemma or a Lemma authorized representative has been notified orally or in writing of the possibility of such damage. Because some jurisdictions do not allow limitations on implied warranties, or limitations of liability for consequential or incidental damages, these limitations may not apply to you.</p>
        <h3>5. Accuracy of materials</h3>
        <p>The materials appearing on Lemma's website could include technical, typographical, or photographic errors. Lemma does not warrant that any of the materials on its website are accurate, complete or current. Lemma may make changes to the materials contained on its website at any time without notice. However Lemma does not make any commitment to update the materials.</p>
        <h3>6. Links</h3>
        <p>Lemma has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Lemma of the site. Use of any such linked website is at the user's own risk.</p>
        <h3>7. Modifications</h3>
        <p>Lemma may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.</p>
        <h3>8. Governing Law</h3>
        <p>These terms and conditions are governed by and construed in accordance with the laws of New York and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.</p>
      </Grid>

      <Grid item xs={12}>
        <Footer />
      </Grid>
    </Grid>
  );
}

Terms.propTypes = {
  classes: PropTypes.object.isRequired,
};


export default withStyles(styles)(Terms);