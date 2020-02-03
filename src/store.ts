import { configureStore, Action } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';

import rootReducer, { RootState } from './rootReducer';

import { initialLoad, setTestDataMode } from './model/ModelThunks';

const store = configureStore<RootState,any>({
  reducer: rootReducer
})

// console.log('Store.ts: process.env.NODE_ENV:'+process.env.NODE_ENV);

if (process.env.NODE_ENV==='test')
  store.dispatch(setTestDataMode(true));
else
  initialLoad(store);

/* TODO: Check if I should add this dev-time feature:
if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept('./rootReducer', () => {
    const newRootReducer = require('./rootReducer').default
    store.replaceReducer(newRootReducer)
  })
}
*/

export type AppDispatch = typeof store.dispatch

export type AppThunk = ThunkAction<void, RootState, null, Action<string>>

export default store