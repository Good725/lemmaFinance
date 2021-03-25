import { createMuiTheme } from '@material-ui/core/styles';

let theme = createMuiTheme({
  typography: {
    useNextVariants: true,
    body1: {
      color: '#6A758A',
      textAlign: 'center'
    },
    body2: {
      color: '#1E242B',
    }
  },
  palette: {
    primary: {
      light: '#D9F3E7',
      main: '#52B788',
    },
    secondary: {
      light: '#E9F8F1',
      main: '#D9F3E7',
    },
  }
});

export default theme;