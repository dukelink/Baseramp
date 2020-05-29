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

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PaletteType } from '@material-ui/core';

import { AuditUpdate } from '../../model/ModelTypes';

export interface SettingsState {
  activeFilter: boolean;
  showAdminTables: boolean;
  paletteType: PaletteType;
  lastAuditTableID: number;
  searchFilter: string;
}

const initialState: SettingsState = {
  paletteType : 'light',
  activeFilter: true,
  showAdminTables: false,
  lastAuditTableID: -1,
  searchFilter: ''
}

const settingsSlice = createSlice({
  name: 'common', // critical if reducer logic is shared in other slices!
  initialState,
  reducers: {
    refreshVMfromAuditRecords(state, 
      action:PayloadAction<{settings:SettingsState,audit_updates:AuditUpdate[]}>)
    {
      const { settings, audit_updates } = action.payload;
      if (audit_updates?.length)
        state.lastAuditTableID = 
            Object.values(audit_updates).slice(-1)[0].audit_id
              || settings.lastAuditTableID; // REVIEW: Consider MAX for safety's sake!
    },
    setOutlineFilters(state,action:PayloadAction<{settings : SettingsState}>) {
      Object.assign(state, action.payload.settings);
    },
    setPaletteType(state, action: PayloadAction<PaletteType>) {
      state.paletteType = action.payload;
    }
  }
})

export const { setPaletteType, setOutlineFilters } = settingsSlice.actions;

export default settingsSlice.reducer;

