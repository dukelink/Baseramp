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

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserLoginState {
    login : string;
    password : string;
    authenticated : boolean;
}

const initialState: UserLoginState = {
    login: '',
    password: '',
    authenticated: false 
}

const userLoginSlice = createSlice({
  name: 'userLogin',
  initialState,
  reducers: {
    update(state, action: PayloadAction<{field:'login'|'password',value:string}>) {
      state[action.payload.field] = action.payload.value;
    }
  }
})

export const { update } = userLoginSlice.actions

export default userLoginSlice.reducer

