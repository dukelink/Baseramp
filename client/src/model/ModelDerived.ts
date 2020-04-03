/*
    Baseramp Project Manager - An open source Project Management software built
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

import { 
  Model, 
  ViewModelDerived, 
  RecordOfAnyType, 
  Records, 
  RecordDerived, 
  AppColumnRow 
} from './ModelTypes';

export function buildDerived(model: Model) 
// TODO: Incremental updates possible
{
  const apiModel = model.apiModel;
  let inactive_status_ids: Array<number>;
  let inprogress_status_ids: Array<number>;
  let apiDerived : ViewModelDerived = {}; 

  //
  // Compute attributes of closed & in progress for all records in all tables
  //
  inactive_status_ids = Object.values<RecordOfAnyType>(apiModel['status'])
    .filter( (row) => (
      ['Completed', 'Canceled', 'Suspended'].includes(row['status_title']) ))
    .map( (row) => (row['status_id']) );
  //
  inprogress_status_ids = Object.values<RecordOfAnyType>(apiModel['status'])
    .filter( (row) => (row['status_title'] === 'Started') )
    .map( (row) => (row['status_id']) );
  //
  Object.keys(apiModel).forEach(tableName=>{
    const records = apiModel[tableName];
    let recordsDerived : Records<RecordDerived> = {};
    Object.keys(records).forEach( key => {
      const stat_id = records[key][tableName + '_status_id'];
      const recordDerived : RecordDerived = {
        closedItem : (stat_id && inactive_status_ids.includes(stat_id)),
        inProgress : (stat_id && inprogress_status_ids.includes(stat_id)),
        record : records[key]
      }
      recordsDerived[key] = recordDerived;
    })
    apiDerived[tableName] = recordsDerived;
  })

  //
  // Retain list of inactive and in-progress status IDs 
  //
  Object.assign(model,{inactive_status_ids,inprogress_status_ids});

  // HACK: XREF ...
  //
  // Computed derived xref keys and tables...
  //
  // Derive Project x Sprint junction entity from stories
  let ProjectSprint : Records<RecordDerived> 
    = apiDerived['Project Sprint'] = {};
  Object.values(apiDerived['story']).forEach( (derivedStory) => {
    let storyRecord = derivedStory.record;
    // Compute new key field value...
    const { story_project_id, story_sprint_id } = derivedStory.record;
    const { closedItem, inProgress } = derivedStory;
    const newKey = story_project_id + '-' + story_sprint_id;
    // Add as foreign key to stories table
    storyRecord['story_Project Sprint_id'] = newKey;
    // Add new junction table row if not already done...
    if (!ProjectSprint[newKey]) {
      ProjectSprint[newKey] = { 
        closedItem : closedItem,
        inProgress : inProgress,
        record : {
          // TODO: STUDY: A blank object here, clears all RecordDerived members
          'Project Sprint_id' : newKey,
          'Project Sprint_sprint_id' : story_sprint_id,
          'Project Sprint_project_id' : story_project_id,
          'Project Sprint_title' : 
            model.apiModel['project'][story_project_id]['project_title']
        } 
      };
    } else {
      ProjectSprint[newKey].closedItem = closedItem && ProjectSprint[newKey].closedItem;
      ProjectSprint[newKey].inProgress = inProgress || ProjectSprint[newKey].inProgress;
    }
  })
  // ... HACK: XREF

  model.derivedModel = apiDerived;
}

export function loadData(model:Model,data:Records<any>)
{
  Object.assign(model.apiModel,data);

  // Sync meta data if loaded as part of post-login 'all' route,
  // otherwise do not clear existing metadata...
  if (Object.keys(model.apiModel.AppTable)) {
    // Code prior to XREF hack...
    // state.metaModel.AppTable = state.apiModel.AppTable;
    // state.metaModel.AppColumn = state.apiModel.AppColumn;

    // HACK: XREF ...
    model.metaModel.AppTable = 
      Object.assign(                          
        model.apiModel.AppTable
        ,{        
          'Project Sprint': {
            AppTable_id : 'Project Sprint',
            AppTable_title : 'Project Sprint',
            AppTable_table_name: 'Project Sprint'
          }                                     
        });                        
    model.metaModel.AppColumn = 
      Object.assign(                          
        model.apiModel.AppColumn
        ,{                            
          //
          // Use Object.assign() below to convert back to POJOs
          // from the AppColumnRow class derived objects that I
          // created to leverage class constructor initialization...
          // (Reducers flag an error for non-serializable __proto__)
          //
          'Project Sprint_id' : 
            Object.assign({},new 
              AppColumnRow('Project Sprint_id','Project Sprint')),
          'Project Sprint_sprint_id' : 
            Object.assign({},new 
              AppColumnRow('Project Sprint_sprint_id','Project Sprint','sprint_id')),
          'story_Project Sprint_id' :
            Object.assign({},new 
              AppColumnRow('story_Project Sprint_id','story','Project Sprint_id'))
        });
    // Copy column metadata from 'project' to virtual xref copy of project
    const reAliasedProjectAppCols = Object.entries(model.metaModel.AppColumn)
      .filter( ([,value]) => ( value.AppColumn_AppTable_id === 'project' ))
      .reduce( (prev : any, [key,value]) => {
        prev[key.replace('project_','Project Sprint_')] = 
          { ...value, AppColumn_AppTable_id: 'Project Sprint' };     
        return prev;  
      }, {} as any );
    model.metaModel.AppColumn = 
      Object.assign(model.metaModel.AppColumn,reAliasedProjectAppCols);
    // ... HACK: XREF
  }

  // Computed derived model data...
  buildDerived(model);
}