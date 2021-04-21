import { createMuiTheme } from '@material-ui/core/styles';

let theme = createMuiTheme({
  typography: {
    useNextVariants: true,
    body1: {
      color: '#1E242B',
      textAlign: 'center',
    },
    body2: {

    }
  },
  palette: {
    primary: {
      main: '#52B788',
    },
    secondary: {
      main: '#FFFFFF',
    },
  }
});

export default theme;