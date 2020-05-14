import React from 'react';

import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';

import { Grid, Paper } from '@material-ui/core';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../rootReducer';
import { setActiveItemDisplay } from '../../model/ModelSlice';
import { setPaletteType } from './SettingsSlice';

const Settings: React.FC = () => {

  const dispatch = useDispatch();
  const state = useSelector((state:RootState)=>state);
  const { navActiveFilter, navShowAdminTables } = state.navigate;
  const { paletteType } = state.settings;
  const { model } = state;

  //
  // Do not inline reducer calls on JSX forms, since
  // the callback functions needed may slow rendering...
  //
  function toggleAdminDisplay() {
    dispatch(setActiveItemDisplay({ navigate:
        {...state.navigate, navShowAdminTables: !navShowAdminTables } }
    )); 
  }
  //
  function toggleActiveDisplay() {
    dispatch(setActiveItemDisplay({ navigate:
        {...state.navigate, navActiveFilter: !navActiveFilter } }
    )); 
  }
  //
  function toggleDarkMode(e : React.ChangeEvent<HTMLInputElement>) {
    dispatch(setPaletteType(e.target.checked?"dark":"light"));
  }

  return ( 
    <Paper style={{ height: "100vh", width:"80%", paddingLeft: "10%", paddingTop: "20px", boxShadow: "none" }}>
      <div>
        <FormControlLabel
            control={
              <Switch
                checked = { navShowAdminTables }
                onChange = { toggleAdminDisplay }
                value="ignore"
                color="primary"
              />
            }
            label="Show Admin Tables"
          />
      </div>
      <br/>

      <div>
        <FormControlLabel
            control={
              <Switch
                checked={ !navActiveFilter }
                onChange = { toggleActiveDisplay }
                value="ignore"
                color="primary"
              />
            }
            label="Show archived items" 
          />
      </div>
      <br/>

      <Grid component="label" container alignItems="center" spacing={1}>
        <Grid item>Light Mode</Grid>
        <Grid item>
          <Switch
            checked={ paletteType==="dark" }
            onChange = { toggleDarkMode }
            value="ignore"
            color="primary"
          />
        </Grid>
        <Grid item>Dark Mode</Grid>
      </Grid>
 
      <hr/>
      { process.env.NODE_ENV !== 'development' ? <></> :
        <pre id="model"  style={{height:"calc(80vh - 185px)", overflowY:"scroll" }} >
        { JSON.stringify(model,null,1) } 
        </pre>
      }
    </Paper>
  );  
}

export default Settings;