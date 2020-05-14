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

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PaletteType } from '@material-ui/core';

import { Records, AuditUpdate } from '../../model/ModelTypes';

export interface SettingsState {
  paletteType: PaletteType;
  activeFilter: boolean;
  showAdminTables: boolean;
  lastAuditTableID: number;
}

const initialState: SettingsState = {
  paletteType : 'light',
  activeFilter: true,
  showAdminTables: false,
  lastAuditTableID: -1
}

const settingsSlice = createSlice({
  name: 'common', // critical if reducer logic is shared in other slices!
  initialState,
  reducers: {
    load(state, action:PayloadAction<Records<any>>) { 
      const records = action.payload;
      state.lastAuditTableID = Number.parseInt(
            Object.keys(records['audit'])[0] // (highest audit_id)
        ) || -1;  // -1 is just any low value that we can spot as 'uninitialized'
                  // (Unlikely to occur as the audit table will always have some data)
    },   
    refreshVMfromAuditRecords(state, 
      action:PayloadAction<{settings:SettingsState,audit_updates:AuditUpdate[]}>)
    {
      const { settings, audit_updates } = action.payload;
      if (audit_updates?.length)
        state.lastAuditTableID = 
            Object.values(audit_updates).slice(-1)[0].audit_id
              || settings.lastAuditTableID; // REVIEW: Consider MAX for safety's sake!
    },
    setActiveItemDisplay(state,action:PayloadAction<{settings : SettingsState}>) {
      Object.assign(state, action.payload.settings);
    },
    setPaletteType(state, action: PayloadAction<PaletteType>) {
      state.paletteType = action.payload;
    }
  }
})

export const { setPaletteType, setActiveItemDisplay } = settingsSlice.actions

export default settingsSlice.reducer

