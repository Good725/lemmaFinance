import React from "react";
import { BrowserRouter as Router, Route } from "react-router-dom";
import theme from "./assets/theme";

import Landing from "./components/Landing/index";
import Launch from "./components/Launch/index";
import Privacy from "./components/Privacy/index";
import Terms from "./components/Terms/index";
import { UseWalletProvider } from 'use-wallet';

import { ThemeProvider } from "@material-ui/core";

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <div>
          <UseWalletProvider
            chainId={100}
            connectors={{
              // This is how connectors get configured
              portis: { dAppId: 'my-dapp-id-123-xyz' },
            }}
          >
            <Route exact path="/" component={Landing} />
            <Route exact path="/privacy" component={Privacy} />
            <Route exact path="/terms" component={Terms} />
          </UseWalletProvider>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;
