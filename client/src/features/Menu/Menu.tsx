/*
    Baseramp - An end user database system, 
    enabling personal data usage and private data ownership,
    built as a Progressive Web Application (PWA) using
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

import React, { Component, useRef } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import { AppBar, Tabs, Tab } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import Settings from '../SettingsPage/SettingsPage';
import { SystemNavigator } from '../SystemNavigator/SystemNavigator'; 
import { AccountPage } from '../Account/AccountPage';
import { BrowserRouter as Router, Switch, Link, Route } from "react-router-dom";
import { useAuthStatus } from '../Account/AccountSlice';
import Iframe from 'react-iframe';
import { useWindowSize } from '../../utils/utils';

function TabPanel(props:any) {
  const { children, value, index, ...other } = props;

  return (
    <Typography
        component="div"
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other} > 
      { children }
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

const menuHeight = 30;

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
    "& header": {
      boxShadow: "none"
    },
    /* Hide underscore indicating currently select menu option pending fixup after responsive hiding of Editor option.
    ** TODO: Restore once I figure out how to track properly following responsively hidden menu pad....
    */
    "& header span": {
      backgroundColor: "transparent"
    },
    "& button.MuiTab-root" : {
      opacity: 1,
      padding: 0,
      width: '25%'
    }
  },
  menuItem: {
    color:'white',
    backgroundColor: 'transparent',
    height: menuHeight+'px',
    width:'inherit',
    minWidth: '100px',
    textDecoration:'none',
    paddingTop: 0,
    lineHeight: '1.5em'
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
          <AppRoute exact path='/Navigator' menuItem={1}></AppRoute>
          <AppRoute exact path='/Settings' menuItem={2}></AppRoute>
          <AppRoute exact path='/Info' menuItem={3}></AppRoute>
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

      { (() => {    
          return  <>
              {/* But every route shares all (route associated) panels in order to save micro-state on panel content
                  such as cursor focus and control state that isn't covered 100% by 'props' controlled components. */}
              <TabPanels menuItem = { menuItem } />
            </>
        })() }
    </> 
  }
} 

const MyLabel : React.FC<{ 
        to : string, 
        label ?: string, 
        path : string,
        children ?: (string|JSX.Element) 
      }> = (props) => {
  const { to, label, path, children } = props;
  const classes = useStyles();  
  return (
    <Link className={classes.menuItem} style={{ opacity: to===path ? 1.0 : 0.7 }} to={to}>
      { label || children }
    </Link>
  )
};

const AppBarMenu = (props:{menuItem:number, path:string, children?:any}) =>
{
  const { menuItem, path } = props;
  const { isLoggedIn } = useAuthStatus(); 

  console.log('AppBarMenu');
  
  return (
    <AppBar position="static" style={{backgroundColor:'#192254'}}>
      <Tabs value={ menuItem } aria-label="Application Tabs">

         <Tab label={
            isLoggedIn ?
              <MyLabel to='/' path={path}>
                <div style={{padding:10}}>Logout</div>
              </MyLabel>
            : <MyLabel to='/' path={path}>
                <div style={{padding:10}}>Login</div>
            </MyLabel>
          } {...a11yProps(0)} /> 

        <Tab disabled={!isLoggedIn} label={
           <MyLabel to='/Navigator' path={path}>
            <div style={{padding:10}}>Database</div>
           </MyLabel>
          } {...a11yProps(1)} style={{display:isLoggedIn?'initial':'none'}} />

        <Tab disabled={!isLoggedIn} label={
            <MyLabel to='/Settings' path={path}>
              <div style={{padding:10}}>Settings</div>
            </MyLabel>
          } {...a11yProps(2)} style={{display:isLoggedIn?'initial':'none'}} />

        <Tab label={
          <MyLabel to='/Info' path={path}>
            <div style={{padding:10}}>Info</div>
          </MyLabel>
          } {...a11yProps(3)} style={{visibility:!isLoggedIn?'initial':'initial'}} />
      </Tabs> 
    </AppBar> ); 
}

function InfoPanel()
{
  const { pathname } = document.location;
  const infoPath = useRef('');
  const [ width, height ] = useWindowSize();

  if (pathname==='/Info') 
  {
    infoPath.current = process.env.PUBLIC_URL 
      + (width<960 ? '/info/mobile.html' : '/info/index.html');
    console.log(`InfoPanel(): width=${width} height=${height} infoPath=${infoPath}`);
  }
  return <>{ 
    infoPath.current &&
    <Iframe 
      url = { infoPath.current } width="100%"
      height = { (height - menuHeight) +'px' } />
  }</>
}

const TabPanels = (props:{menuItem:number}) =>
{
  const { menuItem } = props;
  return (<>
    <TabPanel value={menuItem} index={0}><AccountPage/></TabPanel>
    <TabPanel value={menuItem} index={1}><SystemNavigator/></TabPanel>  
    <TabPanel value={menuItem} index={2}><Settings/></TabPanel>  
    <TabPanel value={menuItem} index={3}><InfoPanel/></TabPanel>  
  </>)
}

