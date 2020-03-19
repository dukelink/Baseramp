import { combineReducers } from '@reduxjs/toolkit';

import userLoginReducer from './features/Account/AccountSlice';
import modelReducer from './model/ModelSlice';
import sampleReducer from './features/SamplePage/SampleSlice';
import settingsReducer from './features/SettingsPage/SettingsSlice';
import navigateReducer from './features/SystemNavigator/NavigateSlice';

const rootReducer = combineReducers({
  userLogin: userLoginReducer,
  model: modelReducer,
  navigate: navigateReducer,
  sample: sampleReducer,
  settings: settingsReducer
})

export type RootState = ReturnType<typeof rootReducer>

export default rootReducer
