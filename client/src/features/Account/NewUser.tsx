/*
    Baseramp Tracker - An open source Project Management software built
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

import React, { useState, memo } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';
import { NodeForm, NodeFormEditState, NodeFormProps } from '../NodeForm/NodeForm';
import { INavigateState } from '../SystemNavigator/NavigateSlice';
import { SettingsState } from '../SettingsPage/SettingsSlice';
import { useRecord } from '../../model/ModelSelectors';
import { insertRecord } from '../../model/ModelThunks';
import { useDispatch } from 'react-redux';
import { Login_OnDone } from './AccountPage';

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

// Review: memoized form required to retain field edits...
const NodeFormMemoized = memo((props:NodeFormProps) => <NodeForm {...props}/>,()=>true);

export const NewUser = (props:{ onDone: Login_OnDone }) => 
{
    const record = useRecord('user');
    const [ userRecord, setUserRecord ] = useState(new NodeFormEditState());

    console.log(`<NewUser/> initial record = ${JSON.stringify(record)}`);
    return <>
      <NodeFormMemoized
        navTable = 'user' 
        navTableID = '-1' 
        record = { record } 
        dispatch = { setUserRecord }
        /> 
      <CancelRegisterButtons 
        onDone = { props.onDone } />
    </>;
  
  function CancelRegisterButtons(
      props: { 
        onDone : Login_OnDone
      }
  ) {
    const classes = useStyles();
    const { onDone } = props;
    const dispatch = useDispatch();
    console.log('CancelRegisterButtons');

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
              dispatch(insertRecord(
                { navTable:'user' } as INavigateState, 
                { activeFilter: true, showAdminTables: false } as SettingsState,
                userRecord.record));
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
}
