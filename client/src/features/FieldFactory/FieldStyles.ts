import { makeStyles } from '@material-ui/core';

export const useStyles = makeStyles(theme => ({
    container: {
      display: 'flex',
      flexWrap: 'wrap',
    },
    nowrap: {
      display: 'inline-flex',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      paddingTop: '6px',
      marginRight: '15px', 
      marginLeft: '15px', 
      "& label" : {
        paddingTop: "12px"
      }
    }, 
    formControl: {
      margin: theme.spacing(1),
    },
    textControl: {
      margin: theme.spacing(1),
      /* Following ensures TextInput (multiline) is "open" (1st five lines) when 
      ** with a scrollbar in case of text overflow.  The control should expand to 
      ** 10 ilnes but doesn't when it is initially hidden.  Modifying AutoForm
      ** PureComponent to rerender on menu focus would likely resolve this issue, 
      ** but the following remedy is good and performant too...
      */
      "& div>textarea:first-of-type" : {
        minHeight: "95px",
        overflowY: "scroll !important"
      }
    },
    fkDefaultLable: {
      /*
      ** Foreign key label placement hacks (focus vs. not vs. empty vs. filled)
      ** (I tried FormControlLabel instead of InputLabel but that hasn't helped yet)
      */
      "&": { left: 23, top: 3 },    
      "&.Mui-focused,&.MuiFormLabel-filled": { top: 0 }
    },
    chips: {
      display: 'flex',
      flexWrap: 'wrap',
    },
    chip: {
      margin: 2,
    }    
  }));