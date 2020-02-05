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

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Input, InputLabel, FormControl, Button } from '@material-ui/core';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../rootReducer';
import { UserLoginState, update } from './UserLoginSlice';
import { setTestDataMode } from '../../model/ModelThunks';
import { useHistory } from 'react-router-dom';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  formControl: {
    margin: theme.spacing(1),
  }
}));

const UserLogin = 
  () => {
  const classes = useStyles();
  const history = useHistory();

  console.log('Rendering UserLogin');

  const { login, password }  = useSelector<RootState,UserLoginState>(state=>state.userLogin);
  const dispatch = useDispatch();

  return <>
    <h2>Login</h2>
    <div className={classes.container}>
        <FormControl className={classes.formControl}>
            <InputLabel htmlFor="login-input">Login</InputLabel>
            <Input
                type="text"
                value={login}
                onChange={(e:React.ChangeEvent<HTMLInputElement>) => 
                    dispatch(update({field:'login',value:e.target.value}))}
                id="login-input"/>
        </FormControl>

        <FormControl className={classes.formControl}>
            <InputLabel htmlFor="password-input">Password</InputLabel>
            <Input
                type='password'
                value={password}
                onChange={(e:React.ChangeEvent<HTMLInputElement>) => 
                    dispatch(update({field:'password',value:e.target.value}))}
                id="password-input"/>
        </FormControl>
    </div>

    <div className={classes.container} style={{marginTop: 40}}>
      <Button 
        variant='contained' 
        style={{marginLeft: 20, height: 70, width: 150}} 
        disabled={!login || !password} 
        onClick={ () => { 
          dispatch(setTestDataMode(false)); 
          history.push("/Navigate"); 
        } } >
          User Login
      </Button>
      <Button 
        variant='contained' 
        style={{marginLeft: 40, height: 70, width: 150}} 
        onClick={ () => { 
          dispatch(setTestDataMode(true)); 
          history.push("/Navigate"); 
        } } >
          Anonymous<br/>(test data)
      </Button>
    </div>
  </>;
}

export default UserLogin;