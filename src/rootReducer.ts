import { combineReducers } from '@reduxjs/toolkit';

import userLoginReducer from './features/UserLogin/UserLoginSlice';
import modelReducer from './model/ModelSlice';
import sampleReducer from './features/SamplePage/SampleSlice';

const rootReducer = combineReducers({
  userLogin: userLoginReducer,
  model: modelReducer,
  sample: sampleReducer
})

export type RootState = ReturnType<typeof rootReducer>

export default rootReducer
