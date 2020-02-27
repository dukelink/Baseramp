import { makeStyles } from '@material-ui/core/styles';

export const useTreeItemStyles = makeStyles(theme => ({
    labelRoot: {
      display: 'flex',
      alignItems: 'center',
      padding: theme.spacing(0.5, 0),
      cursor: 'default'
    },
    labelIcon: {
      marginRight: theme.spacing(1),
      cursor: 'default',
    },
    labelIconInProgress: {
      marginRight: theme.spacing(1),
      color: 'darkgreen',
      cursor: 'default'
    },
    labelIconNotInProgress: {
      marginRight: theme.spacing(1),
      color: 'maroon',
      cursor: 'default'
    },
    labelText: {
      fontSize: 16,
      flexGrow: 1,
      cursor: 'default',
    },
    labelTextClosedItem: {
      fontSize: 16,
      flexGrow: 1,
      cursor: 'default',
      textDecoration: 'line-through'
    }    
  }));
  
  export const useNavPanelStyles = makeStyles(theme=>({
    root: {
      flexGrow: 1,
    },  
    paperFullHeight: {
      padding: theme.spacing(2),
      textAlign: 'left',
      color: theme.palette.text.primary,
      height: "calc(100vh - 50px)",
      overflowY: "auto",
      overflowX: "hidden",
      marginBottom: "0px"
    },
  }));
  