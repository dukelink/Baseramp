/*
    Baseramp - A database for end users enabling personal and private data ownership,
    built as a Progressive Web Application (PWA) using
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
import { TreeView, TreeItem } from '@material-ui/lab';
import { Typography } from '@material-ui/core';
import { useTreeItemStyles } from './SystemNavigatorStyles';

import { useDispatch } from 'react-redux';
import { setFocus } from './NavigateSlice';
import { OutlineNode } from '../../model/ModelOutline';

import FolderIcon from '@material-ui/icons/Folder';
import AssignmentIcon from '@material-ui/icons/Assignment';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import InputIcon from '@material-ui/icons/Input';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';

function OutlineItemLabel(props: { item : OutlineNode })
{
  const classes : any = useTreeItemStyles();
  const { item } = props; 

  const labelClassName = 
    item.inProgress 
      ? classes.labelIconInProgress 
        : ( ( !item.tableID || item.closedItem ) 
        ? classes.labelIcon : classes.labelIconNotInProgress );

  let childCount : (number|string) = item.children
    .filter( item => item.children.length || item.showTable ).length;
  if (childCount===1)
    childCount = 0;

  let grandChildCounts = 
    Object.entries(item.totalChildRecords)
    .filter((x) => x[0]!==item.table && x[0][0].toLowerCase()===x[0][0])
    .sort((f,s) => (Object.keys(s[1]).length - Object.keys(f[1]).length))
    .filter((x,index) => index < 3)
    .map( x => x[0][0] + x[0][1] //+ x[0][2]
      + ':' + Object.keys(x[1]).length/* for debug use: .join(', ')*/)
    .join(', ');
  if (Object.keys(item.totalChildRecords)
      .filter((x) => x[0]!==item.table).length > 3)
    grandChildCounts += ", ...";    

  return (
    <div className={classes.labelRoot}>
      { !item.tableID ?
          <FolderIcon color="inherit" className={ labelClassName } />
        : ( item.children.length ?
              <InputIcon color="inherit" className={ labelClassName } />
            : <AssignmentIcon color="inherit" className={ labelClassName } />  
          )
      }
      <Typography 
          variant="body2" 
          className={
            item.closedItem ? 
              classes.labelTextClosedItem : classes.labelText }>
        { item.itemTitle }
        { !childCount ? '' : <sup>&nbsp;({childCount})</sup> }
        { !grandChildCounts ? '' : 
          <sup>&nbsp;
              ({ grandChildCounts })
          </sup>
        }
      </Typography> 
    </div> 
  )
}

const OutlineItem = memo((props:{item:OutlineNode, key : any, children?:any}) => { 
  const { item  } = props;
  const dispatch = useDispatch();
  console.log('OutlineItem');
  return (
    <TreeItem 
        key = { item.itemKey } 
        nodeId = { item.itemKey as string } 
        className = 'customItem' 
        label = { OutlineItemLabel({ item }) }  
        onClick={ (e:any) => { outlineItemClick(item) }}>
      { item.children
          .filter( item => item.children.length || item.showTable )
          .map( item => <OutlineItem item={item} key={item.itemKey}/> )
      }
    </TreeItem>);

  function outlineItemClick(item:OutlineNode) { dispatch(setFocus(item)); }
});

export const Outline = (props:{outline:OutlineNode[]}) => {
  const classes : any = useTreeItemStyles();

  return (
    <TreeView 
        className = {classes.treeviewRoot}
        defaultCollapseIcon={<ArrowDropDownIcon />} 
        defaultExpandIcon={<ArrowRightIcon />} >
      { 
        props.outline.map(
          (item) => <OutlineItem item={item} key = { item.itemKey }/>
      )}
    </TreeView> 
  )
} 
