import React, { /*memo*/ } from 'react';

import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../rootReducer';
import { setActiveItemDisplay } from '../../model/ModelSlice'
import { setTestDataMode } from '../../model/ModelThunks'

const Settings: React.FC = () => {

  const dispatch = useDispatch();
  const { navActiveFilter, testDataMode } = useSelector((state:RootState)=>state.model.navigate);
  const { model } = useSelector((state:RootState)=>state);

  return ( 
    <>
      <FormControlLabel
          control={
            <Switch
              checked={ navActiveFilter }
              onChange = {(e) => { 
                dispatch(setActiveItemDisplay({navActiveFilter: !navActiveFilter})); 
              }}
              value="ignore"
              color="primary"
            />
          }
          label="Show only active items" 
        />

      <FormControlLabel
          control={
            <Switch
              checked={ testDataMode }
              onChange = {(e) => { 
                dispatch(setTestDataMode(!testDataMode)); 
              }}
              value="ignore"
              color="primary"
            />
          }
          label="Test API mock data mode" 
        />

        <hr/>
        <pre id="model">
        { JSON.stringify(model,null,1) }
        </pre>        
    </>
  );  
} 

export default Settings;