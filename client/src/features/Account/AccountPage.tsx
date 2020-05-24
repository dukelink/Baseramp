/*
    Baseramp - A database for end users enabling personal and private data ownership,
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

import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';
import { useDispatch } from 'react-redux';
import { authLogout } from './AccountThunks';
import { Login } from './Login';
import { NewUser } from './NewUser';
import { useAuthStatus } from './AccountSlice';

const useStyles = makeStyles(theme => ({
  container: {
    margin: "auto",
    textAlign: "center",
    spacing: "10%",
    paddingBottom: "50px",
    height: "100vh"
  },
  buttons: {
    marginLeft: 20, 
    height: 50, 
    width: 110, 
    lineHeight: "1em"
  }
}));

const initialState = {
  login : "",
  password : "",
  newUserForm : false
}

export type StateType = typeof initialState;

export type Login_OnDone = (newUser:string, newPassword:string) => void;

export const AccountPage = () => {
  const [ state, setState ] = useState(initialState);
  const classes = useStyles();
  const dispatch = useDispatch();
  const { isLoggedIn, accountState } = useAuthStatus();

  console.log(`AccountPage; isLoggedIn = ${isLoggedIn}`);
  if (isLoggedIn)
    return (
      <div className={classes.container}>
        <h2>
          { accountState?.user_title + ', you are logged in...' }
        </h2>
        <Button 
          variant='contained' 
          className={classes.buttons}
          onClick={ () => { dispatch(authLogout()); } } >
            Logout
        </Button>        
      </div>
    );
  else if (!state.newUserForm)
    return (
      <div className={classes.container}>
        <h2>Login or Register</h2>
        <Login state={state} setState={setState}/> 
      </div>
    );
  else
    return (
      <div className={classes.container}>
        <h2>Register as a new user...</h2>
        <NewUser onDone = { (newUser, newPassword) => {
          setState({
            ...state, 
            login:newUser, 
            password:newPassword, 
            newUserForm:false}); 
        } }/>
      </div>
    );
}

