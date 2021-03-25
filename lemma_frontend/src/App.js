import React from "react";
import { BrowserRouter as Router, Route } from "react-router-dom";
import theme from "assets/theme";

import Landing from "components/Landing/index";
import Privacy from "components/Privacy/index";
import Terms from "components/Terms/index";

import { ThemeProvider } from "@material-ui/core";

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <div>
          <Route exact path="/" component={Landing} />
          <Route exact path="/privacy" component={Privacy} />
          <Route exact path="/terms" component={Terms} />
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;
