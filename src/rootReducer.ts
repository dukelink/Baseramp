import { combineReducers } from '@reduxjs/toolkit';

import sampleReducer from './features/SamplePage/SampleSlice';
import modelReducer from './model/ModelSlice';

const rootReducer = combineReducers({
  sample: sampleReducer,
  model: modelReducer
})

export type RootState = ReturnType<typeof rootReducer>

export default rootReducer
