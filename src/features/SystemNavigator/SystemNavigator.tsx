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

import React, { memo } from 'react';
import TreeView from '@material-ui/lab/TreeView';
import TreeItem from '@material-ui/lab/TreeItem';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import { NodeForm } from '../NodeForm/NodeForm';
import { useTreeItemStyles, useNavPanelStyles } from './SystemNavigatorStyles';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../rootReducer'; 
import { setFocus, NavigateState, ViewModelState, RecordOfAnyType } from '../../model/ModelSlice';
import { outlineNode } from '../../model/SystemOutline';

import FolderIcon from '@material-ui/icons/Folder';
import AssignmentIcon from '@material-ui/icons/Assignment';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import InputIcon from '@material-ui/icons/Input';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';

function OutlineItemLabel(props: { item : outlineNode })
{
  const classes : any = useTreeItemStyles();
  const { item } = props; 
  const labelClassName = item.inProgress 
          ? classes.labelIconInProgress 
            : ( ( !item.tableID || item.closedItem ) ? classes.labelIcon : classes.labelIconNotInProgress ); 
  return (
    <div className={classes.labelRoot}>
      { !item.tableID ?
          <FolderIcon color="inherit" className={ labelClassName } />
        : ( item.children.length ?
              <InputIcon color={"inherit"} className={ labelClassName } />
            : <AssignmentIcon color="inherit" className={ labelClassName } />  
          )
      }
      <Typography variant="body2" className={ item.closedItem ? classes.labelTextClosedItem : classes.labelText }>
        { item.itemTitle }
      </Typography>
    </div> 
  )
}

const OutlineItem = memo((props:{item:outlineNode, key : any, children?:any}) => { 
  const { item  } = props;
  const dispatch = useDispatch();
  console.log('OutlineItem');
  return (
    <TreeItem 
        key = { item.itemKey } 
        nodeId = { item.itemKey as string } 
        className = 'customItem' 
        label = { OutlineItemLabel( { item }) }  
        onClick={ (e:any) => { outlineItemClick(item) }}>
      { item.children.map((item)=><OutlineItem item={item} key={item.itemKey}/>) }
    </TreeItem>);

  function outlineItemClick(item:outlineNode) { 
    dispatch(setFocus(item)); 
  }
});

const Outline = (props:{outline:outlineNode[]}) => {
  return (
    <TreeView defaultCollapseIcon={<ArrowDropDownIcon />} defaultExpandIcon={<ArrowRightIcon />} >
      { props.outline.map((item)=><OutlineItem item={item} key = { item.itemKey }/>) }
    </TreeView> 
  )
} 

export default function SystemNavigator() {
  const classes = useNavPanelStyles();
  let { navOutline, navTable, navTableID, navParentTable, navStrParentID } 
    = useSelector<RootState,NavigateState>(state=>state.model.navigate);
  const viewModel = useSelector<RootState,ViewModelState>(state=>state.model.apiModel);
  let record : RecordOfAnyType = {};

  console.log(`SystemNavigator:: navTable: ${navTable}, navTableID: ${navTableID}`);

  // HACK: XREF FEATURE...
  // handle xref derived (hyphenated) table names by return parent table info...
  let xref_node = false;
  if (navTable.split('~').length>1) 
  {
    xref_node = true;
    navTable = navTable.split('~')[0];    
    navTableID = navTableID.split('~')[0]; // xref support
  }
  // HACK: ...XREF FEATURE

  if (navTable) { 
    if (navTableID!=="-1") 
      record = viewModel[navTable][navTableID];
    else {
      record = {};
      if (navParentTable && navStrParentID) {
        // HACK: XREF FEATURE...
        navParentTable = navParentTable.split('~')[0];  
        navStrParentID = navStrParentID.split('~')[0];
        // HACK: ...XREF FEATURE
        record[navTable + '_' + navParentTable + '_id'] = navStrParentID;
      }
    }
  }

  return (
    <div className={classes.root}>
      <Grid container spacing={3}>
        <Grid item xs={6}>
          <Paper className={classes.paperFullHeight} component="div" >
            <Outline outline={ navOutline }/>
          </Paper>        
        </Grid>
        <Grid item xs={6}>
          <Paper className={classes.paperFullHeight}>
            { // HACK: XREF FEATURE...
              // Suppress adding records under xref headings
              (xref_node && !navTableID) 
              ? 
                <></> 
              : // HACK: ...XREF FEATURE
                <NodeForm 
                  navTable={ navTable } 
                  navTableID={ navTableID }
                  record={ record } />
            }
          </Paper>
        </Grid>
      </Grid>
    </div>          
  );
}
