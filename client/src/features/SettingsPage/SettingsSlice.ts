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

export interface SettingsState {
  paletteType: PaletteType
}

const initialState: SettingsState = {
  paletteType : 'light'
}

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setPaletteType(state, action: PayloadAction<PaletteType>) {
      state.paletteType = action.payload;
    }
  }
})

export const { setPaletteType } = settingsSlice.actions

export default settingsSlice.reducer

