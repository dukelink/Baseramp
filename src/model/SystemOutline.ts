import { Model } from './ModelSlice';

export interface outlineNode {
    itemKey: (number | string),  // When itemType=='Heading': use table names, and when
    itemTitle: string,
    table?: string,
    tableID?: number,
    parentTable?: string,
    parentID?: number,
    children: outlineNode[],
    closedItem?: boolean,
    inProgress?: boolean 
}

// HACK: XREF FEATURE...
function build_xrefs(model:Model) {
    let apiModel : any = model.apiModel;
    let derivedModel : any = model.derivedModel;

    apiModel['project~story'] = {};
    derivedModel['project~story'] = {};
    [...new Set(
        Object.keys(apiModel.story)
        .map( (story_id:string) => {
            const story = apiModel.story[story_id];
            return JSON.stringify({
                'project~story_id' : story.story_project_id+'~'+story.story_sprint_id,
                'project~story_title' : apiModel['project'][story.story_project_id.toString()]['project_title'],
                'project~story_rank' : apiModel['project'][story.story_project_id.toString()]['project_rank'],
                'project~story_sprint_id' : story.story_sprint_id,
                'project~story_project_id' : story.story_project_id
        })} 
    ))]
    .map( (s:any) => JSON.parse(s))
    .forEach( (x) => {
        apiModel['project~story'][x['project~story_id']] = x;
        derivedModel['project~story'][x['project~story_id']] = {
            'closedItem' : Object.values(model.apiModel.story)
                .filter( (y) =>
                    y['story_sprint_id']===x['project~story_sprint_id']
                    && y['story_project_id']===x['project~story_project_id'] ) 
                .every( (y) => model.derivedModel.story[y['story_id']].closedItem ), 
            'inProgress' : true
        };
        
    });
}
// HACK: ...XREF FEATURE

const parentChildTables: any = { 
    category: ['project'],
    project: ['story'],
    user: [],

// HACK: XREF FEATURE...
    sprint: ['story','project~story'],
    'project~story': ['story'],
// HACK: ...XREF FEATURE

    AppTable: ['AppColumn']
}

// Get set of all 'child' tables '~' used to exclude child tables from top levels of outline...
const childTableSet = new Set(Object.values(parentChildTables).flat());

export function buildOutline(model: Model, navActiveFilter: boolean) {
    const viewModel = model.apiModel;
    const derivedModel = model.derivedModel;

    // HACK: XREF FEATURE...
    build_xrefs(model);
    let outline = buildTableHeadingsOutline(viewModel, Object.keys(viewModel), []);
    // HACK: ...XREF FEATURE

    outline = sequenceOutline(outline) as outlineNode[];

    return outline;

    function sequenceOutline(outline: outlineNode[],path='') {
        return outline
            .filter((item) => (!navActiveFilter || !item.closedItem))
            .map<outlineNode>((outline: outlineNode) => {
                path = path + outline.table + (outline.tableID||'');
                outline.itemKey = path;
                outline.children = sequenceOutline(outline.children,path);
                return outline;
            })
    }

    function buildRowsOutline(
                tableHeading: string,
                filterPredicates : Function[],      // HACK: XREF FEATURE
                parentTable?: string,
                parentID?: number
        ) {
        let rows = viewModel[tableHeading] as any;

        if (typeof rows === 'object') rows = Object.values(rows); // conversion to table objects

        // HACK: XREF FEATURE...
        let newPred = [...filterPredicates];        // HACK: XREF FEATURE
        if (parentTable && parentID) {
            const _parentID = parentID.toString().split('~')[0];
            newPred.push((row: any,tableHeading:any) => {
                return ((row[tableHeading + '_' + parentTable.split('~')[0] + '_id'] || _parentID ).toString() === _parentID)
            }); 
            newPred.forEach(pred =>
                rows = rows.filter( (row:any) => pred(row, tableHeading) )
            );
        } 
        // HACK: ...XREF FEATURE

        // PRIOR TO HACK: XREF FEATURE:
//      if (parentTable && parentID)
//      rows = rows
//          .filter((row: any) => (row[tableHeading + '_' + parentTable + '_id'] === parentID));


        return rows
            .map((row: any): outlineNode => (
            // Following code embeds some DB naming convention rules: 
            //    _id, _title, _<table>_<parentTable>_id, ...
            {
                itemKey: row[tableHeading + '_id'].toString(),
                itemTitle: row[tableHeading + '_title'],
                table: tableHeading,
                tableID: row[tableHeading + '_id'],
                parentTable,
                parentID,
                children: buildTableHeadingsOutline(
                    viewModel,
                    (parentChildTables[tableHeading] || []),
                    newPred,                        // HACK: XREF FEATURE
                    tableHeading,
                    row[tableHeading + '_id']
                )
            }
        ))
        .map((row:any) => ({
            ...row,
            closedItem: 
                derivedModel[tableHeading] // TODO:? protection needed for xref built headings
                    && derivedModel[tableHeading][row.tableID].closedItem,
            inProgress: 
                derivedModel[tableHeading] // TODO:? protection needed for xref built headings
                    && derivedModel[tableHeading][row.tableID].inProgress
        }))
        .sort((firstEl:any,secondEl:any) => {
            const   firstStarted = (firstEl.inProgress ? 0 : 1 ) + (firstEl.closedItem ? 2 : 0 ),
                    secondStarted = (secondEl.inProgress ? 0 : 1 ) + (secondEl.closedItem ? 2 : 0 ),
                    // TODO: restore rank support...
                    //firstRank = firstEl[tableHeading + '_rank'],
                    //secondRank = secondEl[tableHeading + '_rank'],
                    firstID = firstEl.tableID,
                    secondID = secondEl.tableID;
            const   firstOrd = firstStarted*1000000 + /*(firstRank||0)*10000 +*/ (firstID||0),
                    secondOrd = secondStarted*1000000 + /*(secondRank||0)*10000 +*/ (secondID||0);
            return  firstOrd - secondOrd;
        });
    }

    function buildTableHeadingsOutline(
                viewModel: any,
                tableHeadings: string[],
                filterPredicates: Function[],       // HACK: XREF FEATURE
                parentTable?: string,
                parentID?: number
        ) {
        let outline: outlineNode[];
        outline = tableHeadings
            .filter((TableHeading) => (
                parentTable ||                     // Tables w/ parents are filtered by parentIDs in buildRowsOutline()
                !childTableSet.has(TableHeading))  // Otherwise top level of outine only presents tables that are never children
            )
            .map((tableHeading): outlineNode => (
                {
                    itemKey: tableHeading,
                    itemTitle: properCasePluralize(tableHeading),
                    table: tableHeading,
                    parentTable,
                    parentID,
                    closedItem: false,
                    inProgress: false,
                    children: buildRowsOutline(
                                tableHeading, 
                                filterPredicates,     // HACK: XREF FEATURE
                                parentTable, parentID) 
                }
            ));
        return outline;
    }
}

const properCasePluralize = (s: string):string => 
{
    let proper : string;

    // HACK: XREF FEATURE...
    let xrefTables = s.split('~');
    if (xrefTables.length>1) {
        return xrefTables.map( tableName => properCasePluralize(tableName)).join(' & '); 
    }
    // HACK: ...XREF FEATURE

    proper = s[0].toUpperCase().toUpperCase() + s.substr(1).toLowerCase();
    if (s.substr(-1).toLowerCase() === 'y') {
        return proper.substring(0, proper.length - 1) + 'ies';
    }
    return proper + (proper.substr(-1) === 's' ? 'es' : 's');
}