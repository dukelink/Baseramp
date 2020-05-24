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

import { AppThunk } from  '../../store';  // REVIEW: Are there any anti-patterns associated with thunks being state-aware?
import { Fetch } from '../../utils/Fetch';
import { clearModelReducer } from '../../model/ModelSlice';
import { initialLoad } from '../../model/ModelThunks';
import { setAccountState } from './AccountSlice';
// import { Alert } from '@material-ui/lab'; - TODO: Research Material-UI Alert messages

export const authLogin = (username:string,password:string)
    : AppThunk => async dispatch =>
{
    dispatch(clearModelReducer());

    await Fetch('login',
    { method: 'POST', 
        body: JSON.stringify({
            username,password
        }), 
        headers: { 'Content-Type': 'application/json' }                        
    }, false)
    .then(res => res && res.json())
    .then((data)=>{
        dispatch(setAccountState(data));
        initialLoad("all");    
    })
    .catch(()=>{
        alert('Login/Password failed - try again or create a new account...');
    });
}

export const authLogout = ()
    : AppThunk => async dispatch =>
{
    dispatch(setAccountState());
    dispatch(clearModelReducer());

    await Fetch('logout',{ method: 'GET' })
        .catch(()=>{}); // masking any logout issues is OK
}
 