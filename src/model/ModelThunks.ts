import { Settings } from '../Settings';
import store, { AppThunk } from  '../store';
import { Fetch } from '../utils/Fetch';
import { load, refreshRecordInVM, addRecordToVM, deleteRecordFromVM, setTestDataModeReducer, clearModeReducer }
     from './ModelSlice';
import { testModelData } from '../model/testModel'

type AppStore = typeof store;

export const initialLoad = (store:AppStore,route:string="all") => {
  Fetch(Settings.serverURL + route)
  .then(res => res && res.json())
  .then(res => {
      store.dispatch(load(res));
      return res;
  })
  .catch((error) =>{});
}

export const updateRecord = (navTable:string,navTableID:string,recordDelta:any) 
    : AppThunk => async dispatch => {
  if (Object.keys(recordDelta).length) {
    if (process.env.NODE_ENV==='test') {
      dispatch(refreshRecordInVM({navTable,navTableID,recordDelta}));
    } else
      Fetch(Settings.serverURL + navTable + '/' + navTableID,
          {
              method: 'PUT',
              body: JSON.stringify(recordDelta),
              headers: { 'Content-Type': 'application/json' }
          }
      )
      .then(res => dispatch(refreshRecordInVM({navTable,navTableID,recordDelta})))
      .catch((error) =>{});
  }
}

export const insertRecord = (navTable:string,record:any) 
    : AppThunk => async dispatch => {
  if (Object.keys(record).length) {
    Fetch(Settings.serverURL + navTable, 
      { 
          method: 'POST', 
          body: JSON.stringify(record),
          headers: { 'Content-Type': 'application/json' }                        
      }
  )
  .then(res => res && res.json())
  .then(res => dispatch(addRecordToVM({navTable,record:res[0]})))
  .catch((error) =>{}) 
  }        
}

export const deleteRecord = (navTable:string, navTableID:string)
    : AppThunk => async dispatch => {
  Fetch(Settings.serverURL + navTable + '/' + navTableID,
      { method: 'DELETE' }
  )
  .then(res => dispatch(deleteRecordFromVM({navTable,navTableID})))
  .catch((error) =>{})
}

export const setTestDataMode = (testDataMode:boolean) : AppThunk => dispatch => {
  dispatch(clearModeReducer());
  dispatch(setTestDataModeReducer({testDataMode}));

  // COMMENT OUT TO GET FRESH TEST MODEL...
  if (testDataMode)
    dispatch(load(testModelData.apiModel)); 
  else
  // ...COMMENT OUT
    initialLoad(store,testDataMode?"test":"all"); 
//
// TODO: Clear current navigation focus
//
}