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

import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../rootReducer';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState   // Info about current auth user
{
  user_id     :  string,
  user_title  :  string,
  user_login  :  string,
  user_active :  boolean,
  user_role_id : number,
  role_title : string
}

export type AccountState = 
  UserState           // present if logged in
  | undefined;        // undefined if logged out

const accountSlice = createSlice({
  name: 'account',
  initialState : {} as AccountState,
  reducers: {
    setAccountState(state, action: PayloadAction<AccountState>) {
      Object.assign(state, action.payload 
        // trigger state change on logout (payload of undefined)
        || { user_id : undefined }
      );
    }
  }
})

export const useAuthStatus = () => {
  const accountState = useSelector<RootState,AccountState>(
    (state) => (state.userLogin)
  );
  const history = useHistory();  

  const isLoggedIn = Boolean(accountState?.user_id);

  console.log(`useIsLoggedIn() = ${isLoggedIn}`);
  
  useEffect(() => {
    history.push(isLoggedIn?'/Navigator':'/');
  }, [isLoggedIn,history])

  return { isLoggedIn, accountState };
}

export const { setAccountState } = accountSlice.actions

export default accountSlice.reducer

