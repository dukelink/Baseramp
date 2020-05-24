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

import store, { AppThunk } from  '../../store';
import { Fetch } from '../../utils/Fetch';
import { load } from '../../model/ModelSlice';
import { setOutlineFilters, SettingsState } from './SettingsSlice';

export const loadOrUnloadSecurityTables = (settings:SettingsState) 
  : AppThunk => async dispatch =>
{
  // Clear out any partial data that may have replicated
  // via audit_updates as inconsistent table data can cause
  // exceptions when building derived model data...
  // TODO:  We probably shouldn't replicate 'role' or'user' data
  //        when admin mode is OFF.
  store.dispatch(load({user:{},role:{}}));

  if (settings.showAdminTables)
    Fetch('security')
    .then(res => res && res.json())
    .catch(() =>{})
    .then(res => {
        store.dispatch(load(res));
        store.dispatch(setOutlineFilters({settings}));
        return res;
    });  
  else {
    store.dispatch(setOutlineFilters({settings}));    
  }
}