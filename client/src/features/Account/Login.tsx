/*
    Baseramp - A database for end users, enabling personal and private data ownership,
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
import { Input, InputLabel, FormControl, Button } from '@material-ui/core';
import { useDispatch } from 'react-redux';
import { authLogin } from './AccountThunks';
import { StateType } from './AccountPage';
import { Redirect } from 'react-router';
import { VerticalSpace } from '../../utils/utils';

const useStyles = makeStyles(theme => ({
    container: {
      margin: "auto",
      textAlign: "center",
      spacing: "10%",
      paddingBottom: "50px"
    },
    formControl: {
      display: "inline-block",
      margin: theme.spacing(1),
    },
    buttons: {
      marginLeft: 20, 
      height: 50, 
      width: 110, 
      lineHeight: "1em"
    }
  }));

export const Login = (props:{state:StateType, setState: React.Dispatch<React.SetStateAction<StateType>>}) => {
    const state = props.state;
    const { login, password } = state;
    const setState = props.setState;
    const classes = useStyles();
    const dispatch = useDispatch();
    const [ redirect, setRedirect ] = useState<boolean>(false)
    return redirect ? <Redirect push to="/info" /> : <>
      <FormControl className={classes.formControl}>
          <InputLabel htmlFor="login-input">Login</InputLabel>
          <Input
              type="text"
              value={login}
              onChange={ (e:React.ChangeEvent<HTMLInputElement>) => { 
                          setState({...state,login:e.target.value}) }}
              id="login-input"/>
      </FormControl>
  
      <FormControl className={classes.formControl}>
          <InputLabel htmlFor="password-input">Password</InputLabel>
          <Input
            type='password'
            value={password}
            onChange={ (e:React.ChangeEvent<HTMLInputElement>) => { 
                        setState({...state,password:e.target.value}) }}
            id="password-input"/>
      </FormControl>
  
      <div style={{marginTop: "4em"}}>
        <Button 
            variant='contained' 
            className={classes.buttons}
            onClick={ () => { setState({...state,newUserForm:true}); } } >
          Register
        </Button>
        <Button 
            variant='contained' 
            className={classes.buttons}
            disabled={!login || !password} 
            onClick={ () => (dispatch(authLogin(login,password))) } >
          Login
        </Button>
      </div>  
      <br></br>
      <br></br>
      <br></br>
      <span style={{ fontSize: '18px' }}>
        Are you a first time visitor, interested in learning more about Baseramp?
        <br></br>
        <a style={{ fontSize: '18px', textDecoration: 'none', position: 'relative', top: '10px' }}
          href={"#"} onClick={ () => {setRedirect(true)} }> 
          <em>Click here for the 
            &nbsp;<span style={{ textDecoration: 'underline' }}>Information</span>&nbsp;
            tab...</em>
        </a>
      </span>
    </>;
  }
  