/*
  Baseramp Tracker - An open source Project Management software built
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
 
import { ViewModelDerived, RecordDerived, RecordOfAnyType } from './ModelTypes';
import { SettingsState } from '../features/SettingsPage/SettingsSlice';
import { properCasePluralize } from '../utils/utils';

export interface OutlineNode {
  itemKey : (number | string),  // When itemType=='Heading': use table names, and when 
  itemTitle : string,
  table ?: string,
  tableID ?: number | string,
  rank ?: number,
  parentTable ?: string,
  parentID ?: number | string,
  children : OutlineNode[],
  closedItem ?: boolean,
  inProgress ?: boolean,
  showTable : boolean,
  totalChildRecords : RecordOfAnyType 
}

const parentChildTables: any = { 
  category: ['category', // CYCLIC: category
    'project', 'chore','requirement',
    'resource','challenge','account',
    'sale', 'sprint'], 
  project: ['story', 'requirement'],
  challenge: ['response'],
//    story: ['task'], // pending...
  user: [],
  sprint: [
    'story',
    // NOTE: A sprint-project virtual table will be 
    // created using the story table since  project is not 
    // direclty related to sprint.
    'Project Sprint'  // HACK: XREF
  ],
  'Project Sprint': [ 'story' ],
  AppTable: ['AppColumn'],
  status: ['sale'],
  chore: ['checkoff'],
  // HACK: Prevent direct browsing to junction tables...
  dummy: [ 'StoryStory', 'StoryRequirement', 'StatusAppTable', 'CategoryAppTable' ] 
}

// Get set of all 'child' tables, used to exclude them from top levels of outline...
const childTableSet = new Set(
  Object.values(parentChildTables)
  .flat()
  .filter( (tbl) => (!['category'].includes(tbl)) )  // HACK: CYCLIC; TODO: Generalize
);

export function buildOutline(
    derivedModel: ViewModelDerived, 
    settings: SettingsState ) {
  const { activeFilter } = settings;
  let outline = buildTableHeadingsOutline(Object.keys(derivedModel));

  outline = sequenceOutline(outline) as OutlineNode[];
  addRecordTallies(outline);
  return outline;

  // REVIEW: Is this currently being used?
  // Was the intent to help with keyboard navigation of outline?
  function sequenceOutline(outline: OutlineNode[],path='') 
  {
    return outline
      .filter((item) => (!activeFilter || !item.closedItem))
      .map<OutlineNode>((outline: OutlineNode) => {
        path = path + outline.table + (outline.tableID||'');
        outline.itemKey = path + (outline.parentID||'');
        outline.children = sequenceOutline(outline.children,path); 
        return outline;
      })
  }

  // Tally number of records for all children by 'table'...
  function addRecordTallies(outline: OutlineNode[]) : RecordOfAnyType 
  {
    let tallies : RecordOfAnyType = {};
    // REVIEW: Make sure all destructuring used is really needed,
    // as in the following line AND Object.assign within the
    // return values, and that the I'm using the fastest method
    // to merge to arrays of string within the Set() call, etc....
    //
    // NOTE: See commit of 4/23/2020 and consider:
    //   Instead of just tallying, I build a list of IDs
    //     so that I can troubleshoot via TreeviewOutline.tsx view.
    //   I tried using set instead of object to track unique IDs 
    //     and the first effort failed; I wish I'd just debugged that
    //     as it must have been a silly, correctable error; but
    //     objects were easy to work with.
    //   I could go back to just tallying record counts, when I 
    //     no longer need/want the option of the 'troubleshooting' display...
    //
    [...outline].forEach( node => {
      if (node.table && node.tableID) {
        if (!tallies[node.table]) {
          tallies[node.table] = {};
          tallies[node.table][
            // HACK: XREF - use split to count just one node type
            node.tableID.toString().split('-')[0]
          ] = 1; // any dummy value
        } else {
          tallies[node.table][
            // HACK: XREF - use split to count just one node type
            node.tableID.toString().split('-')[0]
          ] = 1; // any dummy value
        }
      }
      let subTallies = addRecordTallies(node.children);
      node.totalChildRecords  = subTallies;
      (new Set([...Object.keys(tallies),...Object.keys(subTallies)]))
      .forEach(table => {
        if (!tallies[table])
          tallies[table] = subTallies[table];
        else
          tallies[table] 
            = { ...(tallies[table] || {}),
                ...(subTallies[table] || {}) };
      })  
    })
    return Object.assign({},tallies);
  }

  function buildRowsOutline(
        tableHeading: string,
        parentTable?: string,
        parentID?: number
    ) {
    let rowsObj = derivedModel[tableHeading];

    //if (typeof rows === 'object') 
    let rows = Object.values(rowsObj); // conversion to table objects

    if (parentTable && parentID)
      rows = rows
        .filter((row:RecordDerived) => { 
          // HACK: CYCLIC RELATIONSHIPS... 
          // - only present under parent record of same type...
          if (row.record[tableHeading+'_'+tableHeading+'_id']
              && tableHeading !== parentTable)
            return false;
          // ... HACK: CYCLIC RELATIONSHIPS

          return row.record[tableHeading + '_' + parentTable + '_id'] 
            === parentID;
        });
    else
      // HACK: CYCLIC RELATIONSHIPS ... 
      // - only present under parent record of same type...
      rows = rows
        .filter((row:RecordDerived) => ( 
          !row.record[tableHeading+'_'+tableHeading+'_id']
              || tableHeading === parentTable));
      // ... HACK: CYCLIC RELATIONSHIPS
   
    return rows
      .map((row): OutlineNode => (
      // Following code embeds some DB naming convention rules: 
      //    _id, _title, _<table>_<parentTable>_id, ...
      {
        itemKey: row.record[tableHeading + '_id'].toString(),
        itemTitle: row.record[tableHeading + '_title'],
        table: tableHeading,
        tableID: row.record[tableHeading + '_id'],
        rank: row.record[tableHeading + '_rank'],
        parentTable,
        parentID,
        showTable: true,
        children: buildTableHeadingsOutline(
          (parentChildTables[tableHeading] || []),
          tableHeading,
          row.record[tableHeading + '_id'] 
        ),
        totalChildRecords : {}
      }
    ))
    .map((row) => ({
      ...row,
      closedItem: 
        derivedModel[tableHeading] 
          && derivedModel[tableHeading][row.tableID||0].closedItem,
      inProgress: 
        derivedModel[tableHeading] 
          && derivedModel[tableHeading][row.tableID||0].inProgress,
    }))
    .sort((firstEl,secondEl) => {
      const   firstStarted = (firstEl.inProgress ? 0 : 1 ) + (firstEl.closedItem ? 2 : 0 ),
          secondStarted = (secondEl.inProgress ? 0 : 1 ) + (secondEl.closedItem ? 2 : 0 ),
          firstRank = firstEl.rank, // sort by rank if available
          secondRank = secondEl.rank,
          firstID = -(firstEl.tableID || 0), // sort most recent to top
          secondID = -(secondEl.tableID || 0);
      const   firstOrd = firstStarted*1000000 + (firstRank||(100000+firstID)),
          secondOrd = secondStarted*1000000 + (secondRank||(100000+secondID));
      return  firstOrd - secondOrd; 
    });
  }

  function buildTableHeadingsOutline(
        tableHeadings: string[],
        parentTable?: string,
        parentID?: number
  ) {
    //
    // TODO: If we provide direct access to metaModel then we wouldn't need
    // to derive this....
    //
    let outline: OutlineNode[];
        const tableRoles = Object.values(derivedModel['AppTable'])
          .reduce( (prev,curr) => ( { 
            ...prev, 
            [(curr.record['AppTable_title'])] : curr.record['role_title'] 
          } ), {} as {[key:string]:string});

    outline = tableHeadings
      .filter( tableHeading => (
          // Tables w/ parents are filtered by parentIDs in buildRowsOutline()
          parentTable
            // Otherwise top level of outine only presents tables 
            // that are never children
            || !childTableSet.has(tableHeading)
          ) && ( 
            settings.showAdminTables 
              || tableRoles[tableHeading] !=='Admin' 
          )
      )
      .reduce((prev, tableHeading:string) => { 
        let itemTitle : string;
        let showTable : boolean = true; // default assumption
  
        if (tableHeading.includes(" "))
          // HACK: XREF - compound headings, temp hack - split at space
          itemTitle = properCasePluralize(tableHeading.split(" ")[0])
        else
          itemTitle = properCasePluralize(tableHeading);

        // See if parent table has an M:M junction
        // table virtual field, and if so filter to 
        // only those table names (tableHeading) that
        // have been select as in-scope within parent record...
        if (parentTable && parentID) {
          //
          // TODO: If we provide direct access to metaModel then we wouldn't need
          // to derive this....
          //
          const appColumnRec = Object.values(derivedModel['AppColumn'])
            .filter(rec => (
              rec.record['AppColumn_column_name'].toLowerCase()
                === parentTable+'_'+parentTable+'apptable_apptable_id')
            )[0];

            // If the parent record is for a table that references
            // an AppTable junction, then filter child tables included
            // in the outline to just those select by this junction table
            // information...
            if (appColumnRec) {
              const parentRec = derivedModel[parentTable][parentID].record; 
              const m2m_fieldName = parentTable+'_'+parentTable[0].toUpperCase()
                +parentTable.substr(1)+'AppTable_AppTable_id';
              const showTableIDs = parentRec[m2m_fieldName] || [];
              const currTableDef = Object.values(derivedModel['AppTable'])
                .filter(rec => rec.record['AppTable_table_name']===tableHeading)
                  [0].record;
                showTable = (showTableIDs.includes(currTableDef['AppTable_id']));
            }
        }
 
        const childRows = buildRowsOutline(tableHeading, parentTable, parentID);

        // HACK: CYCLIC outline headings may be removed
        if (  tableHeading===parentTable 
          || (!parentTable && tableHeading==='category' && childRows.length) ) 
          prev.push(...childRows);
        else
          prev.push({
            itemKey: tableHeading,
            itemTitle,
            table: tableHeading,
            parentTable,
            parentID,
            closedItem: false,
            inProgress: false,
            showTable,
            children: childRows,
            totalChildRecords: {}
          });

        return prev;
      }, [] as OutlineNode[]);

    return outline;
  }
}
