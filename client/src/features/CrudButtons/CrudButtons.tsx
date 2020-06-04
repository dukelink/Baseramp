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

import { Grid, IconButton } from "@material-ui/core";

import PlayCircleFilledIcon from "@material-ui/icons/PlayCircleFilled";
import InputIcon from "@material-ui/icons/InputTwoTone";
import FolderOpenIcon from "@material-ui/icons/FolderOpen";

import { useNavPanelStyles } from "../SystemNavigator/SystemNavigatorStyles";

import { useSelector } from "react-redux";
import { RootState } from "../../rootReducer";
import { NodeFormEditState } from "../NodeForm/NodeForm";
import { EditMode } from "../SystemNavigator/SystemNavigator";

import { INavigateState } from "../SystemNavigator/NavigateSlice";
import { useTableAppCols } from "../../model/ModelSelectors";
import { useWindowSize } from "../../utils/utils";
import { SearchBox } from "./SearchBox";
import { AddDeleteSaveUndo, isCleanFlag } from "./AddDeleteSaveUndo";

import { RecordOfAnyType } from "../../model/ModelTypes";

export const CrudButtons = (props: {
  latestNodeformState: NodeFormEditState;
  setLatestNodeformState: Dispatch<SetStateAction<NodeFormEditState>>;
  mode: EditMode;
  setMode: Dispatch<SetStateAction<EditMode>>;
  origRecord: RecordOfAnyType;
}) => {
  const { latestNodeformState, setLatestNodeformState, mode, setMode } = props;

  const classes = useNavPanelStyles();
  const navigate = useSelector<RootState, INavigateState>(
    (state) => state.navigate
  );

  const [mobileSearchMode, setMobileSearchMode] = useState(false);

  const [width] = useWindowSize();

  const otherMode = mode === "Outline" ? "Edit" : "Outline";

  const mobileSearchLayout = width < 640;

  console.log("CRUDBUTTONS()");

  // TODO: Use for accessibility / altText?
  //const otherLabel = mode==='Outline' ? 'Form' : 'Outline';

  const { navTable, navTableID } = navigate;

  const tableVisibleFieldNames = useTableAppCols(navTable)
    .filter(
      (appCol) =>
        // REVIEW:
        // Filters out ui hidden since they are not needed to drive UI,
        // and MORE IMPORTANTLY, I want to filter recordDelta
        // to only visible fields using this hook, so that we
        // don't try to send fields updates to the server
        // for fields that are not editable (like SQL computed fields)
        !appCol.AppColumn_ui_hidden ||
        // REVIEW:
        // Make an exception for the primary key field,
        // as it is used to avoid rendering empty/null records
        // around lines 56-69 in NodeForm.tsx...
        appCol.AppColumn_column_name === navTable + "_id"
    )
    .map((appCol) => appCol.AppColumn_column_name);

  const filterOnlyVisibleColumns = (rec: RecordOfAnyType) => {
    const rv: RecordOfAnyType = Object.keys(rec).reduce((prev, colName) => {
      if (tableVisibleFieldNames.includes(colName))
        prev[colName] = rec[colName];
      return prev;
    }, {} as RecordOfAnyType);
    return rv;
  };
  const origRecord = filterOnlyVisibleColumns(props.origRecord);
  const record = filterOnlyVisibleColumns(props.latestNodeformState.record);
  const cleanFlag = isCleanFlag(navTableID,origRecord,record);

  const searchBarOnly = !navTable || mobileSearchMode;

  console.log(`searchBarOnly=${searchBarOnly}`);

  return (
    <Grid
      container
      xs={12}
      className={ classes.OutlineEditButton }
    >
      {searchBarOnly ? (
        <SearchBox
          mobileSearchLayout={mobileSearchLayout}
          mobileSearchMode={mobileSearchMode}
          searchBarOnly={searchBarOnly}
          setMobileSearchMode={setMobileSearchMode}
        />
      ) : (
        <div color="secondary" style={{ width: "100%" }}>
          {mode !== "Both" && navTableID ? (
            !mobileSearchLayout ? (
              <Grid container xs={12}>
                <Grid item xs={2}>
                  <OutlineFormSwitch />
                </Grid>
                <Grid item xs={6}>
                  {mode !== "Edit" && (
                    <SearchBox
                      mobileSearchLayout={mobileSearchLayout}
                      mobileSearchMode={mobileSearchMode}
                      searchBarOnly={searchBarOnly}
                      setMobileSearchMode={setMobileSearchMode}
                    />
                  )}
                </Grid>
                <Grid item xs={4}>
                  <AddDeleteSaveUndo
                    record={record}
                    origRecord={origRecord}
                    latestNodeformState={latestNodeformState}
                    setLatestNodeformState={setLatestNodeformState}
                    mode={mode}
                    setMode={setMode}
                  />
                </Grid>
              </Grid>
            ) : (
              <Grid container xs={12}>
                <Grid item xs={3}>
                  <OutlineFormSwitch />
                </Grid>
                <Grid item xs={2}>
                  {mode !== "Edit" && (
                    <SearchBox
                      collapsed={true}
                      mobileSearchLayout={mobileSearchLayout}
                      mobileSearchMode={mobileSearchMode}
                      searchBarOnly={searchBarOnly}
                      setMobileSearchMode={setMobileSearchMode}
                    />
                  )}
                </Grid>
                <Grid item xs={7}>
                  <AddDeleteSaveUndo
                    record={record}
                    origRecord={origRecord}
                    latestNodeformState={latestNodeformState}
                    setLatestNodeformState={setLatestNodeformState}
                    mode={mode}
                    setMode={setMode}
                  />
                </Grid>
              </Grid>
            )
          ) : !mobileSearchLayout ? (
            <Grid container xs={12}>
              <Grid item xs={6}>
                <SearchBox
                  mobileSearchLayout={mobileSearchLayout}
                  mobileSearchMode={mobileSearchMode}
                  searchBarOnly={searchBarOnly}
                  setMobileSearchMode={setMobileSearchMode}
                />
              </Grid>
              <Grid item xs={6}>
                <AddDeleteSaveUndo
                  record={record}
                  origRecord={origRecord}
                  latestNodeformState={latestNodeformState}
                  setLatestNodeformState={setLatestNodeformState}
                  mode={mode}
                  setMode={setMode}
                />
              </Grid>
            </Grid>
          ) : (
            <Grid container xs={12}>
              <Grid item xs={3}></Grid>
              <Grid item xs={2}>
                <SearchBox
                  collapsed={true}
                  mobileSearchLayout={mobileSearchLayout}
                  mobileSearchMode={mobileSearchMode}
                  searchBarOnly={searchBarOnly}
                  setMobileSearchMode={setMobileSearchMode}
                />
              </Grid>
              <Grid item xs={7}>
                <AddDeleteSaveUndo
                  record={record}
                  origRecord={origRecord}
                  latestNodeformState={latestNodeformState}
                  setLatestNodeformState={setLatestNodeformState}
                  mode={mode}
                  setMode={setMode}
                />
              </Grid>
            </Grid>
          )}
        </div>
      )}
    </Grid>
  );

  function OutlineFormSwitch() {
    return (
      <IconButton
        area-label="Navigation Outline"
        disabled = { !cleanFlag }
        style={{ padding: 6, position: "relative", top: -6 }}
        onClick={() => {
          // TODO: Move handlers out of render...
          setMode(otherMode);
        }}
      >
        <PlayCircleFilledIcon
          style={{
            fontSize: "1.4em",
            position: "relative",
            top: 1,
            color: cleanFlag ? "white" : "grey",
            opacity: 0.8,
          }}
          className={otherMode === "Outline" ? classes.rotate180 : ""}
        />
        <div style={{ height: "1.4em" }}>
          {otherMode === "Outline" ? (
            <FolderOpenIcon
              style={{
                fontSize: "1.5em",
                color: cleanFlag ? "white" : "grey",
                opacity: 0.8,
              }}
            />
          ) : (
            <InputIcon
              style={{
                fontSize: "1.3em",
                color: cleanFlag ? "white" : "grey",
                opacity: 0.8,
                position: "relative",
                top: 3,
                left: 2,
              }}
            />
          )}
        </div>
      </IconButton>
    );
  }
};
