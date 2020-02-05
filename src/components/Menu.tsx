/*
    Baseramp Project Manager - An open source Project Management software built
    as a Single Page Application (SPA) and Progressive Web Application (PWA) using
    Typescript, React, and an extensible SQL database model.

    Copyright (C) 2019-2020  William R. Lotherington, III

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

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
import UserLogin from '../features/UserLogin/UserLogin';
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
          <AppRoute exact path='/Navigate' menuItem={1}></AppRoute>
          <AppRoute exact path='/Settings' menuItem={2}></AppRoute>
          <AppRoute exact path='/SampleForm' menuItem={3}></AppRoute>
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
        <Tab label={lbl({to:'/',label:'User Login'})} {...a11yProps(1)} />
        <Tab label={lbl({to:'/Navigate',label:'System Navigator'})} {...a11yProps(1)} />
        <Tab label={lbl({to:'/Settings',label:'Settings...'})} {...a11yProps(2)} />
        <Tab label={lbl({to:'/SampleForm',label:'Sample Form'})} {...a11yProps(3)} />
      </Tabs> 
    </AppBar> );
}

const TabPanels = (props:{menuItem:number}) =>
{
  const { menuItem } = props;
  return (<>
    <TabPanel value={menuItem} index={0}><UserLogin/></TabPanel>  
    <TabPanel value={menuItem} index={1}><SystemNavigator/></TabPanel>  
    <TabPanel value={menuItem} index={2}><Settings/></TabPanel>  
    <TabPanel value={menuItem} index={3}><SampleForm/></TabPanel>  
  </>)
}

