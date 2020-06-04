/*
  Baseramp - An end user database system, 
  enabling personal data usage and private data ownership,
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

import React, { useState, Dispatch, SetStateAction } from "react";

import { Grid } from "@material-ui/core";
import { Button } from "@material-ui/core";

import AddCircleIcon from "@material-ui/icons/AddCircleTwoTone";
import UndoIcon from "@material-ui/icons/UndoTwoTone";
import SaveIcon from "@material-ui/icons/SaveTwoTone";
import DeleteIcon from "@material-ui/icons/DeleteForeverTwoTone";

import { useNavPanelStyles } from "../SystemNavigator/SystemNavigatorStyles";

import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../rootReducer";
import { NodeFormEditState } from "../NodeForm/NodeForm";
import { EditMode } from "../SystemNavigator/SystemNavigator";
import {
  updateRecord,
  insertRecord,
  deleteRecord,
} from "../../model/ModelThunks";
import {
  addNewBlankRecordForm,
  setFocus,
} from "../SystemNavigator/NavigateSlice";
import { SettingsState } from "../SettingsPage/SettingsSlice";
import { INavigateState } from "../SystemNavigator/NavigateSlice";
import { recordDelta } from "../../utils/utils";

import { RecordOfAnyType } from "../../model/ModelTypes";

export function AddDeleteSaveUndo(props: {
  record: RecordOfAnyType;
  origRecord: RecordOfAnyType;
  latestNodeformState: NodeFormEditState;
  setLatestNodeformState: Dispatch<SetStateAction<NodeFormEditState>>;
  mode: EditMode;
  setMode: Dispatch<SetStateAction<EditMode>>;
}) {
  const classes = useNavPanelStyles();
  const navigate = useSelector<RootState, INavigateState>(
    (state) => state.navigate
  );
  const settings = useSelector<RootState, SettingsState>(
    (state) => state.settings
  );
  const dispatch = useDispatch();
  const [rerenderFlag, setRerenderFlag] = useState(1);

  const {
    record,
    origRecord,
    setLatestNodeformState,
    mode,
    setMode,
    latestNodeformState,
  } = props;
  const { isFormValid } = latestNodeformState;
  const { navTable, navTableID, navParentTable, navStrParentID } = navigate;

  const cleanFlag = isCleanFlag(navTableID,origRecord,record);

  return (
    <div
      className={classes.buttonBar}
      style={{ display: "inline-block", float: "right" }}
    >
      {cleanFlag ? (
        <>
          <Button
            variant="contained"
            style={{ maxWidth: "140px ! important" }}
            onClick={() => {
              // TODO: Move handlers out of render...
              dispatch(addNewBlankRecordForm({ navTable }));
              // setMode(mode === "Both" ? mode : "Edit");
            }}
          >
            <AddCircleIcon
              style={{ fontSize: "1.7em", color: "darkgreen", opacity: 1 }}
            />{" "}
            {navTable}
          </Button>

          {navTableID && (
            <Button
              id="crudDelete"
              variant="contained"
              style={{ minWidth: "30px" }}
              onClick={() => {
                // TODO: Move handlers out of render...
                dispatch(deleteRecord(navigate, settings));
                setMode(mode === "Both" ? mode : "Outline");
              }}
            >
              <DeleteIcon
                style={{ fontSize: "1.8em", color: "maroon", opacity: 0.9 }}
              />
            </Button>
          )}
        </>
      ) : (
        navTableID && (
          <Grid>
            <Button
              id="crudSave"
              variant="contained"
              disabled={!isFormValid}
              style={{ backgroundColor: isFormValid ? 'lightgrey' : 'darkgrey' }}
              onClick={() => {
                // TODO: Move handlers out of render...
                if (!isFormValid) {
                  alert("Please fill in all required fields before saving");
                  return;
                }
                if (navTableID === "-1")
                  dispatch(insertRecord(navigate, settings, record));
                else {
                  dispatch(
                    updateRecord(
                      navigate,
                      settings,
                      recordDelta(record, origRecord)
                    )
                  );
                }
              }}
            >
              <SaveIcon
                style={{ fontSize: "1.8em", color: "darkgreen", opacity: 1 }}
              />
              Save
            </Button>
            <Button
              id="crudCancel"
              variant="contained"
              onClick={() => {
                // TODO: Move handlers out of render...
                setLatestNodeformState({
                  record: origRecord,
                  isFormValid: true,
                });
                // Remove form if Add New record form...
                if (navTableID === "-1") {
                  dispatch(
                    setFocus({
                      table: navTable,
                      tableID: "",
                      parentTable: navParentTable,
                      parentID: navStrParentID,
                    })
                  );
                  // Return to outline display only...
                  setMode("Outline");
                }
                // If user was editing an existing record, flag rerender...
                else setRerenderFlag(rerenderFlag + 1);
              }}
            >
              <UndoIcon
                style={{ fontSize: "1.8em", color: "maroon", opacity: 0.9 }}
              />
            </Button>
          </Grid>
        )
      )}
    </div>
  );
}

export function isCleanFlag(navTableID:string|number,origRecord:RecordOfAnyType,record:RecordOfAnyType) {
  const strOrigRecord = JSON.stringify(
    origRecord,
    Object.keys(origRecord).sort()
  );
  const strRecord = JSON.stringify(record, Object.keys(record).sort());
  const cleanFlag =
    (!navTableID || strOrigRecord === strRecord) && navTableID !== "-1";
  return cleanFlag && navTableID !== -1;
}
