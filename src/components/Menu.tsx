import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Settings from '../features/SettingsPage/SettingsPage'
import SystemNavigator from '../features/SystemNavigator/SystemNavigator';
import { SampleForm } from '../features/SamplePage/SampleForm';
import { BrowserRouter as Router, Switch, Link, Route } from "react-router-dom";

function TabPanel(props:any) {
  const { children, value, index, ...other } = props;

  return (
    <Typography
      component="div"
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      <Box p={3}>{children}</Box>
    </Typography>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired,
};

function a11yProps(index:any) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper
  },
  menuItem: {
    textDecoration:"none",
    color: 'white',
    border: 'none',
    outline: 'none' 
  }
}));


export const SimpleTabs = (props:any) => {
  const classes = useStyles();

  console.log('SimpleTabs');

  return (
    <div className={classes.root}>
      <Router>
        <Switch>
          <AppRoute exact path='/' menuItem={0}></AppRoute> 
          <AppRoute exact path='/Settings' menuItem={1}></AppRoute>
          <AppRoute exact path='/SampleForm' menuItem={2}></AppRoute>
        </Switch>
      </Router>     
    </div>
  );
}


class AppRoute extends Component<any>
{
  render() { 
    const { children, menuItem, path, ...other } = this.props;
    return <> 
      {/* Every route repeats the App bar... */}
      <Route path={path} {...other}>
        <AppBarMenu menuItem={ menuItem } path={ path }></AppBarMenu>
      </Route>

      { path==='/SampleForm' 
        ? 
          <SampleForm/>
          :
          <>
            {/* But every route shares all (route associated) panels in order to save micro-state on panel content
                such as cursor focus and control state that isn't covered 100% by 'props' controlled components. */}
            <TabPanels menuItem = { menuItem } />
          </>
      }
    </> 
  }
} 

const lbl = (props:any) => (
  <Link style={{color:'white', textDecoration:'none'}} to={props.to}>{ props.label }</Link>
);

function AppBarMenu(props:{menuItem:number, path:string, children?:any}) 
{
  const { menuItem } = props;

  console.log('AppBarMenu');

  return (
    <AppBar position="static">
      <Tabs value={ menuItem } aria-label="Application Tabs">
        <Tab label={lbl({to:'/',label:'System Navigator'})} {...a11yProps(0)} />
        <Tab label={lbl({to:'/Settings',label:'Settings...'})} {...a11yProps(1)} />
        <Tab label={lbl({to:'/SampleForm',label:'Sample Form'})} {...a11yProps(2)} />
      </Tabs> 
    </AppBar> );
}

const TabPanels = (props:{menuItem:number}) =>
{
  const { menuItem } = props;
  return (<>
    <TabPanel value={menuItem} index={0}><SystemNavigator/></TabPanel>  
    <TabPanel value={menuItem} index={1}><Settings/></TabPanel>  
    <TabPanel value={menuItem} index={2}><SampleForm/></TabPanel>  
  </>)
}

