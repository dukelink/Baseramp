import React from 'react';

import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';

import { Grid, Paper } from '@material-ui/core';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../rootReducer';
import { setPaletteType, setActiveItemDisplay } from './SettingsSlice';

const Settings: React.FC = () => {

  const dispatch = useDispatch();
  const settings = useSelector((state:RootState)=>state.settings);
  const { activeFilter, showAdminTables, paletteType } = settings;

  function toggleAdminDisplay() {
    dispatch(setActiveItemDisplay({ settings:
        {...settings, showAdminTables: !showAdminTables } }
    )); 
  }
  //
  function toggleActiveDisplay() {
    dispatch(setActiveItemDisplay({ settings:
        {...settings, activeFilter: !activeFilter } }
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
                checked = { showAdminTables }
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
                checked={ !activeFilter }
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
      {/* process.env.NODE_ENV !== 'development' ? <></> :
        <pre id="model"  style={{height:"calc(80vh - 185px)", overflowY:"scroll" }} >
        { JSON.stringify(model,null,1) } 
        </pre>
      */}
    </Paper>
  );  
}

export default Settings;