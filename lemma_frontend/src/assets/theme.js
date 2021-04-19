import { createMuiTheme } from '@material-ui/core/styles';

let theme = createMuiTheme({
  typography: {
    useNextVariants: true,
    body1: {
      color: '#1E242B',
      textAlign: 'center',
    },
    body2: {
      color: '#6A758A',
      fontSize: '1vw'
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