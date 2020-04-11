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

import React, { memo, Dispatch, SetStateAction } from 'react';
import { NodeForm, NodeFormEditState } from './NodeForm';
import { useSelector } from 'react-redux';
import { RootState } from '../../rootReducer'; 
import { RecordOfAnyType } from '../../model/ModelTypes';
import { useRecord } from '../../model/ModelSelectors';

export const NodeFormView = memo( 
// NOTE: Memoization is required to prevent loss of state (edits)     
    (props: {dispatch   : Dispatch<SetStateAction<NodeFormEditState>>}) => {
    const { dispatch } = props;
    const state = useSelector<RootState,RootState>(state=>state);
    let { navTable, navTableID, navParentTable, navStrParentID } = state.navigate;
    const derivedModel = state.model.derivedModel;
    const initialRecord : RecordOfAnyType = useRecord(navTable); // TODO: should we memoize?

    console.log(
        `<NodeFormView/> navTable: ${navTable},`
        + ` navTableID: ${navTableID},`
        + ` initialRecord = ${JSON.stringify(initialRecord)}` );

    let record : RecordOfAnyType = {};
    if (navTable && navTableID) { 
        if (navTableID==="-1") {
            record = {...initialRecord};
            if (navParentTable && navStrParentID) {
                record[navTable + '_' + navParentTable + '_id'] = navStrParentID;
            }
        } else {
            record = derivedModel[navTable][navTableID].record;
//            dispatch(new NodeFormEditState(true,record));
        }
        console.log(`NodeFormView: record = ${JSON.stringify(record)}`)
        return <NodeForm 
            navTable = { navTable } 
            navTableID = { navTableID }
            record = { record }
            dispatch = { dispatch } />
    }

    return <></>;
});

