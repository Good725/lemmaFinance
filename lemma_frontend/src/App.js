import React from "react";
import { BrowserRouter as Router, Route } from "react-router-dom";
import theme from "./assets/theme";

import Landing from "./components/Landing/index";
import Launch from "./components/Launch/index";
import Privacy from "./components/Privacy/index";
import Terms from "./components/Terms/index";

import { ThemeProvider } from "@material-ui/core";
import { ConnectedWeb3 } from "./context";

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <ConnectedWeb3>
        <Router>
          <Route exact path="/" component={Landing} />
          <Route exact path="/registration" component={Launch} />
          <Route exact path="/privacy" component={Privacy} />
          <Route exact path="/terms" component={Terms} />
        </Router>
      </ConnectedWeb3>
    </ThemeProvider>
  );
};

export default App;
