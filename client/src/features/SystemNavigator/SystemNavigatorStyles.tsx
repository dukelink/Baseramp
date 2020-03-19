import { makeStyles } from '@material-ui/core/styles';

export const useTreeItemStyles = makeStyles(theme => ({
    treeviewRoot: {
      "& .MuiTreeItem-root.Mui-selected > .MuiTreeItem-content" : {
        backgroundColor: theme.palette.background.default
      }
    },
    labelRoot: {
      display: 'flex',
      alignItems: 'center',
      padding: theme.spacing(0.5, 0),
      cursor: 'default'
    },
    labelIcon: {
      marginRight: theme.spacing(1),
      cursor: 'default',
      opacity: 0.7,
      fontSize: '1.8em'
    },
    labelIconInProgress: {
      marginRight: theme.spacing(1),
      color: 'darkgreen',
      cursor: 'default',
      backgroundColor: 'white',
      borderRadius: '3px',
      opacity: 0.7      
    },
    labelIconNotInProgress: {
      marginRight: theme.spacing(1),
      color: 'maroon',
      cursor: 'default',
      backgroundColor: 'white',
      borderRadius: '3px',
      opacity: 0.7    
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
      padding: theme.spacing(1),
      textAlign: 'left',
      color: theme.palette.text.primary,
      height: "calc(100vh - 107px)",
      overflowY: "auto",
      overflowX: "hidden",
      marginBottom: "0px",
      width: "100%",
      boxShadow: 'none'
    },
    rotate80: {
      transform: 'rotate(180deg)'
    },
    OutlineEditButton: {
      height: "47px",
      padding: "4px", 
      paddingLeft: "0px",
      textAlign: 'left', 
      "&" : {
        borderBottom: 'groove'
      }
    },
    buttonBar: {
      paddingRight: "6px",
      "& button": {
          marginLeft: 5,
          marginTop: "2px",
          paddingTop: "5px !important",
          paddingBottom: "4px !important",
          paddingLeft: "10px !important",
          paddingRight: "10px !important",
      }
    }
  }));
  