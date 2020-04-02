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
 
import { ViewModelDerived, RecordDerived } from './ModelTypes';

import { properCasePluralize } from '../utils/utils';

export interface OutlineNode {
    itemKey : (number | string),  // When itemType=='Heading': use table names, and when 
    itemTitle : string,
    table ?: string,
    tableID ?: number | string,
    parentTable ?: string,
    parentID ?: number | string,
    children : OutlineNode[],
    closedItem ?: boolean,
    inProgress ?: boolean 
}

const parentChildTables: any = { 
    category: ['project'],
    project: ['story', 'project'  /* Cyclic relationship */ ],
    quiz: ['problem','quiz'],
    problem: ['response'],
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
    AppTable: ['AppColumn']

}

// Get set of all 'child' tables, used to exclude them from top levels of outline...
const childTableSet = new Set(Object.values(parentChildTables)
    .flat()
    .filter( (tbl) => (tbl !== 'quiz') )  // HACK: CYCLIC; TODO: Generalize
);

export function buildOutline(derivedModel: ViewModelDerived, navActiveFilter: boolean) {

    let outline = buildTableHeadingsOutline(Object.keys(derivedModel));
    outline = sequenceOutline(outline) as OutlineNode[];
    return outline;
    function sequenceOutline(outline: OutlineNode[],path='') {
        return outline
            .filter((item) => (!navActiveFilter || !item.closedItem))
            .map<OutlineNode>((outline: OutlineNode) => {
                path = path + outline.table + (outline.tableID||'');
                outline.itemKey = path;
                outline.children = sequenceOutline(outline.children,path); 
                return outline;
            })
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
            .map((row: any): OutlineNode => (
            // Following code embeds some DB naming convention rules: 
            //    _id, _title, _<table>_<parentTable>_id, ...
            {
                itemKey: row.record[tableHeading + '_id'].toString(),
                itemTitle: row.record[tableHeading + '_title'],
                table: tableHeading,
                tableID: row.record[tableHeading + '_id'],
                parentTable,
                parentID,
                children: buildTableHeadingsOutline(
                    (parentChildTables[tableHeading] || []),
                    tableHeading,
                    row.record[tableHeading + '_id'] 
                )
            }
        ))
        .map((row:any) => ({
            ...row,
            closedItem: 
                derivedModel[tableHeading] 
                    && derivedModel[tableHeading][row.tableID].closedItem,
            inProgress: 
                derivedModel[tableHeading] 
                    && derivedModel[tableHeading][row.tableID].inProgress,
        }))
        .sort((firstEl:any,secondEl:any) => {
            const   firstStarted = (firstEl.inProgress ? 0 : 1 ) + (firstEl.closedItem ? 2 : 0 ),
                    secondStarted = (secondEl.inProgress ? 0 : 1 ) + (secondEl.closedItem ? 2 : 0 ),
                    // TODO: restore rank support...
                    //firstRank = firstEl[tableHeading + '_rank'],
                    //secondRank = secondEl[tableHeading + '_rank'],
                    firstID = firstEl.tableID,
                    secondID = secondEl.tableID;
            const   firstOrd = firstStarted*1000000 + (firstID||0),
                    secondOrd = secondStarted*1000000 + (secondID||0);
            return  firstOrd - secondOrd;
        });

    }

    function buildTableHeadingsOutline(
                tableHeadings: string[],
                parentTable?: string,
                parentID?: number
        ) {
        let outline: OutlineNode[];
        outline = tableHeadings
            .filter((TableHeading) => (
                parentTable ||                     // Tables w/ parents are filtered by parentIDs in buildRowsOutline()
                !childTableSet.has(TableHeading))  // Otherwise top level of outine only presents tables that are never children
            )
            .map((tableHeading): OutlineNode => { 
                let itemTitle : string;

                if (tableHeading===parentTable)
                    // HACK: CYCLIC RELATIONSHIPS - format outline title "Sub <Table>"
                    itemTitle = 'Sub ' + properCasePluralize(tableHeading);
                else if (tableHeading.includes(" "))
                    // HACK: XREF - compound headings, temp hack - split at space
                    itemTitle = properCasePluralize(tableHeading.split(" ")[0])
                else
                    itemTitle = properCasePluralize(tableHeading);

                return ({
                    itemKey: tableHeading,
                    itemTitle,
                    table: tableHeading,
                    parentTable,
                    parentID,
                    closedItem: false,
                    inProgress: false,
                    children: buildRowsOutline(tableHeading, parentTable, parentID)
                })
            });
        return outline;
    }
}
