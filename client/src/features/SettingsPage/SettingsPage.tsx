import React, { /*memo*/ } from 'react';

import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';

import Grid from '@material-ui/core/Grid';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../rootReducer';
import { setActiveItemDisplay } from '../../model/ModelSlice'
import { setTestDataMode } from '../../model/ModelThunks';
import { setPaletteType } from './SettingsSlice';

const Settings: React.FC = () => {

  const dispatch = useDispatch();
  const state = useSelector((state:RootState)=>state);
  const { navActiveFilter, testDataMode } = state.navigate;
  const { paletteType } = state.settings;
  const { model } = state;

  return ( 
    <div>
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

      <div>
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
      </div>

      <Grid component="label" container alignItems="center" spacing={1}>
        <Grid item>Light Mode</Grid>
        <Grid item>
          <Switch
            checked={ paletteType==="dark" }
            onChange = {(e) => { 
              console.log(e.target.value);
              dispatch(setPaletteType(e.target.checked?"dark":"light"));
            }}
            value="ignore"
            color="primary"
          />
        </Grid>
        <Grid item>Dark Mode</Grid>
      </Grid>

      <hr/>
      { process.env.NODE_ENV !== 'development' ? <></> :
        <pre id="model"  style={{height:"calc(100vh - 185px)", overflowY:"scroll" }} >
        { JSON.stringify(model,null,1) }
        </pre>        
      }
    </div>
  );  
} 

export default Settings;