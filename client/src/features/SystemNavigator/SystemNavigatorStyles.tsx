import { makeStyles } from '@material-ui/core/styles';

export const useTreeItemStyles = makeStyles(theme => ({
    treeviewRoot: {
      "& .MuiTreeItem-root.Mui-selected > .MuiTreeItem-content" : {
        backgroundColor: theme.palette.background.default
      },
      "& sup" : {
        //opacity: 1
      },
      "& sup:nth-child(2)" : {
        //opacity: 0.7
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
      //opacity: 0.8,
      fontSize: '1.3em'
    },
    labelIconInProgress: {
      marginRight: theme.spacing(1),
      color: 'darkgreen',
      cursor: 'default',
      backgroundColor: 'white',
      borderRadius: '3px',
      //opacity: 0.7,      
      fontSize: '1.2em'
    },
    labelIconNotInProgress: {
      marginRight: theme.spacing(1),
      color: 'maroon',
      cursor: 'default',
      backgroundColor: 'white',
      borderRadius: '3px',
      //opacity: 0.7,    
      fontSize: '1.2em'
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
      boxShadow: 'none',
      padding: '6px'
    },  
    paperFullHeight: {
      padding: theme.spacing(1),
      textAlign: 'left',
      color: theme.palette.text.primary,
      height: "calc(100vh - 97px)",
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
      backgroundColor: '#192254', // '#3f51b5'
      "&" : {
        borderBottom: 'groove'
      }
    },
    buttonBar: {
      paddingRight: "6px",
      "& button": {
          marginLeft: 5,
          marginTop: "2px",
          paddingTop: "4px !important",
          paddingBottom: "4px !important",
          paddingLeft: "6px !important",
          paddingRight: "6px !important",
          maxHeight: "32px",
          maxWidth: "47vw",
          overflow: "hidden",
          whiteSpace: "nowrap",
          justifyContent: "center",
          textOverflow: "ellipsis"
      }
    }
  }));
  
  export const useSearchStyles = makeStyles((theme) => ({
    root: {
      padding: '2px 4px',
      display: 'flex',
      alignItems: 'center',
      height: '2.3em',
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1)
    },
    input: {
      marginLeft: theme.spacing(1),
      flex: 1,
    },
    iconButton: {
      padding: 10,
    }
  }));
