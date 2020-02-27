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

import React, { useState, useRef, MutableRefObject } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';
import { NodeForm, NodeFormEditState, NodeFormEditState_OnChange } from '../NodeForm/NodeForm';
import { useInitializedRecord } from '../../model/ModelSlice';
import { insertRecord } from '../../model/ModelThunks';
import { useDispatch } from 'react-redux';
import { Login_OnDone } from '../Account/AccountPage';

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

export const NewUser = (props:{ onDone: Login_OnDone }) => 
{
    const record = useInitializedRecord('user');
    // STUDY: Does the following scheme even need a 'ref' type?
    // Is this the best way????
    let nodeFormCallbackRef = useRef<NodeFormEditState_OnChange>(
      // dummy callback until crudButtons renders
      ()=>{}
    ); 
    console.log(`<NewUser/> initial record = ${JSON.stringify(record)}`);
    return <>
      <NodeForm 
        navTable = 'user' 
        navTableID = '-1' 
        record = { record } 
        onChange = { (rec)=>nodeFormCallbackRef.current(rec) } 
        /> 
      <CancelRegisterButtons 
        callbackRef = { nodeFormCallbackRef }
        onDone = { props.onDone } />
    </>;
  }
  
  const CancelRegisterButtons = (
      props: { 
        callbackRef : MutableRefObject<NodeFormEditState_OnChange>,
        onDone : Login_OnDone
      }
  ) => {
    const classes = useStyles();
    const { callbackRef, onDone } = props;
    const [ userRecord, setUserRecord ] = useState(new NodeFormEditState());
    const dispatch = useDispatch();
    console.log('CancelRegisterButtons');

    callbackRef.current = (newState:NodeFormEditState) => { 
      /* if (newState) */ setUserRecord(newState); 
    }

    return (
      <div style={{marginTop: "4em"}}>
        <Button 
          variant='contained' 
          className={classes.buttons}
          onClick={ () => { onDone('','') } } >
            Cancel
        </Button>
        <Button 
          variant='contained' 
          className={classes.buttons}
          disabled={!userRecord.isFormValid} 
          onClick={ () => { 
              dispatch(insertRecord('user', userRecord.record));
              // TODO: Consider a thunk w/ callback or something similar
              // to NOT return to login page if insertRecord fails!!!
              onDone(
                userRecord.record['user_login'], 
                userRecord.record['user_password_hash']);
          } } >
            Register
        </Button>
      </div>  
    );
  }
