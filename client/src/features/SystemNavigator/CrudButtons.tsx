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

import React, {
  useState,
  Dispatch,
  SetStateAction,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";

import { Grid, IconButton, Paper, InputBase } from "@material-ui/core";
import { Button } from "@material-ui/core";

import PlayCircleFilledIcon from "@material-ui/icons/PlayCircleFilled";
import InputIcon from "@material-ui/icons/InputTwoTone";
import SearchIcon from "@material-ui/icons/SearchRounded";
import AddCircleIcon from "@material-ui/icons/AddCircleTwoTone";
import UndoIcon from "@material-ui/icons/UndoTwoTone";
import SaveIcon from "@material-ui/icons/SaveTwoTone";
import HighlightOffIcon from "@material-ui/icons/HighlightOffTwoTone";
import DeleteIcon from "@material-ui/icons/DeleteForeverTwoTone";
import FolderOpenIcon from "@material-ui/icons/FolderOpen";

import { useNavPanelStyles, useSearchStyles } from "./SystemNavigatorStyles";

import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../rootReducer";
import { NodeFormEditState } from "../NodeForm/NodeForm";
import { EditMode } from "./SystemNavigator";
import {
  updateRecord,
  insertRecord,
  deleteRecord,
} from "../../model/ModelThunks";
import { addNewBlankRecordForm, setFocus } from "./NavigateSlice";
import { setOutlineFilters } from "../../features/SettingsPage/SettingsSlice";
import { useTableAppCols } from "../../model/ModelSelectors";
import { useWindowSize, recordDelta, usePrevious } from "../../utils/utils";

import { RecordOfAnyType } from "../../model/ModelTypes";

const initialSearchParams = {
  searchKeyInput: "",
  searchKey: "",
};

export const CrudButtons = (props: {
  latestNodeformState: NodeFormEditState;
  setLatestNodeformState: Dispatch<SetStateAction<NodeFormEditState>>;
  mode: EditMode;
  setMode: Dispatch<SetStateAction<EditMode>>;
  origRecord: RecordOfAnyType;
}) => {
  const { setLatestNodeformState, mode, setMode } = props;
  const { isFormValid } = props.latestNodeformState;

  const classes = useNavPanelStyles();
  const state = useSelector<RootState, RootState>((state) => state);
  const dispatch = useDispatch();
  const [mobileSearchMode, setMobileSearchMode] = useState(false);
  const [rerenderFlag, setRerenderFlat] = useState(1);
  const [width] = useWindowSize();
  const [search, setSearch] = useState(initialSearchParams);
  const priorSearch = usePrevious(search);

  const otherMode = mode === "Outline" ? "Edit" : "Outline";

  const mobileSearchLayout = width < 640;

  useEffect(() => {
    if (mobileSearchMode && !mobileSearchLayout) setMobileSearchMode(false);
    if (state.settings.searchFilter != search.searchKey)
      setSearch({ ...search, searchKey: state.settings.searchFilter });
  }, [mobileSearchLayout, state.settings.searchFilter]);

  console.log("CRUDBUTTONS()");

  // TODO: Use for accessibility / altText?
  //const otherLabel = mode==='Outline' ? 'Form' : 'Outline';

  const {
    navTable,
    navTableID,
    navParentTable,
    navStrParentID,
  } = state.navigate;

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

  const strOrigRecord = JSON.stringify(
    origRecord,
    Object.keys(origRecord).sort()
  );
  const strRecord = JSON.stringify(record, Object.keys(record).sort());

  const cleanFlag =
    (!navTableID || strOrigRecord === strRecord) && navTableID !== "-1";

  let searchFilterCSS: CSSStyleDeclaration | {} = {
    fontSize: "1.5em",
    color: "black",
    opacity: search.searchKeyInput ? "1" : "0.5",
  };
  if (search.searchKey)
    searchFilterCSS = Object.assign(searchFilterCSS, {
      color: "darkgreen",
      opacity: "1",
    });

  return (
    <Grid
      container
      xs={12}
      className={classes.OutlineEditButton}
      style={{ backgroundColor: "lightgrey" }}
    >
      {!navTable || mobileSearchMode ? (
        <SearchBarOnly />
      ) : (
        <div color="secondary" style={{ width: "100%" }}>
          {mode !== "Both" && navTableID ? (
            !mobileSearchLayout ? (
              <Grid container xs={12}>
                <Grid item xs={2}>
                  <OutlineFormSwitch />
                </Grid>
                <Grid item xs={6}>
                  {mode !== "Edit" && <SearchBox />}
                </Grid>
                <Grid item xs={4}>
                  <AddDeleteSaveUndo />
                </Grid>
              </Grid>
            ) : (
              <Grid container xs={12}>
                <Grid item xs={2}>
                  <OutlineFormSwitch />
                </Grid>
                <Grid item xs={3} style={{ textAlign: "right" }}>
                  {mode !== "Edit" && (
                    <IconButton
                      area-label="Search"
                      style={{ padding: 6, position: "relative", top: -6 }}
                      onClick={() => {
                        // TODO: Move handlers out of render...
                        setMobileSearchMode(true);
                      }}
                    >
                      <SearchIcon style={searchFilterCSS} />
                    </IconButton>
                  )}
                </Grid>
                <Grid item xs={7}>
                  <AddDeleteSaveUndo />
                </Grid>
              </Grid>
            )
          ) : !mobileSearchLayout ? (
            <Grid container xs={12}>
              <Grid item xs={6}>
                <SearchBox />
              </Grid>
              <Grid item xs={6}>
                <AddDeleteSaveUndo />
              </Grid>
            </Grid>
          ) : (
            <Grid container xs={12}>
              <Grid item xs={3}></Grid>
              <Grid item xs={2}>
                <IconButton
                  area-label="Search"
                  style={{ padding: 6, position: "relative", top: -6 }}
                  onClick={() => {
                    // TODO: Move handlers out of render...
                    setMobileSearchMode(true);
                  }}
                >
                  &nbsp;&nbsp;
                  <SearchIcon style={searchFilterCSS} />
                </IconButton>
              </Grid>
              <Grid item xs={7}>
                <AddDeleteSaveUndo />
              </Grid>
            </Grid>
          )}
        </div>
      )}
    </Grid>
  );

  function SearchBox() {
    const classes = useSearchStyles();
    const formRef = useRef<any>();
    useLayoutEffect(() => {
      const input = formRef.current.getElementsByTagName(
        "input"
      )[0] as HTMLInputElement;
      if (search.searchKeyInput && search.searchKeyInput !== priorSearch?.searchKeyInput)
        // TODO: this is a hack related to loss of record focus
        input.focus();
    });
    console.log("SearchBox()");
    const searchEdited = search.searchKeyInput !== search.searchKey;
    let highlightSearch: CSSStyleDeclaration | {} = {
      backgroundColor: "lightgrey",
      color: "black",
    };
    if (search.searchKey)
      highlightSearch = {
        ...highlightSearch,
        backgroundColor: "darkgreen",
        color: "white",
        opacity: "0.7",
      };
    if (searchEdited) {
      highlightSearch = { ...highlightSearch, color: "red" };
      if (search.searchKey) {
        highlightSearch = {
          ...highlightSearch,
          backgroundColor: "green",
          opacity: "0.9",
        };
      }
    }

    return (
      <Grid container xs={12}>
        <Grid item xs={11}>
          <Paper
            component="form"
            className={classes.root}
            style={{ height: 32, marginTop: 2 }}
            onSubmit={(e) => {
              e.preventDefault();
              dispatch(
                setOutlineFilters({
                  settings: {
                    ...state.settings,
                    searchFilter: search.searchKeyInput,
                  },
                })
              );
              setSearch({ ...search, searchKey: search.searchKeyInput });
            }}
          >
            <IconButton
              type="submit"
              className={classes.iconButton}
              aria-label="search"
              style={{
                ...highlightSearch,
                paddingLeft: 4,
                paddingRight: 0,
                paddingTop: 0,
                paddingBottom: 0,
                height: 28,
              }}
            >
              <SearchIcon />
            </IconButton>
            <InputBase
              ref={formRef}
              className={classes.input}
              placeholder="Enter search text / Select item below..."
              inputProps={{ "aria-label": "full-text search" }}
              style={{
                fontKerning: "auto",
                fontWeight:
                  search.searchKey && !searchEdited ? "bold" : "normal",
              }}
              value={search.searchKeyInput}
              onChange={setInputFieldState}
            />
            {searchEdited && (
              <IconButton
                className={classes.iconButton}
                aria-label="search"
                onClick={() => {
                  setSearch({ ...search, searchKeyInput: search.searchKey });
                }}
              >
                <UndoIcon style={{ color: "red", opacity: 0.7 }} />
              </IconButton>
            )}
            <HighlightOffIcon
              style={{
                fontSize: "1.8em",
                color: "green",
                position: "relative",
                left: -4,
                cursor: "pointer",
                display: search.searchKey ? "default" : "none",
              }}
              onClick={() => {
                dispatch(
                  setOutlineFilters({
                    settings: { ...state.settings, searchFilter: "" },
                  })
                );
                setSearch({ ...search, searchKeyInput: "", searchKey: "" });
              }}
            />
          </Paper>
        </Grid>
        <Grid item xs={1}></Grid>
      </Grid>
    );
  }

  function setInputFieldState(e: React.SyntheticEvent | React.KeyboardEvent) {
    const target = e.target as HTMLInputElement;
    setSearch({
      ...search,
      searchKeyInput: target.value,
    });
  }

  function SearchBarOnly() {
    return (
      <>
        {mobileSearchMode && (
          <Grid item xs={1} style={{ cursor: "pointer", textAlign: "center" }}>
            <PlayCircleFilledIcon
              className={classes.rotate80}
              style={{
                fontSize: "2.1em",
                position: "relative",
                left: 2,
                top: 1,
                opacity: 0.7,
                color: "black",
              }}
              onClick={() => {
                setMobileSearchMode(false);
              }}
            />
          </Grid>
        )}
        <Grid
          item
          xs={mobileSearchMode ? 11 : 12}
          style={{ backgroundColor: "lightgrey" }}
        >
          <SearchBox />
        </Grid>
      </>
    );
  }

  function OutlineFormSwitch() {
    return (
      <IconButton
        area-label="Navigation Outline"
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
            color: "black",
            opacity: 0.7,
          }}
          className={otherMode === "Outline" ? classes.rotate80 : ""}
        />
        <div style={{ height: "1.4em" }}>
          {otherMode === "Outline" ? (
            <FolderOpenIcon
              style={{
                fontSize: "1.5em",
                color: "darkgreen",
                opacity: 0.7,
              }}
            />
          ) : (
            <InputIcon
              style={{
                fontSize: "1.3em",
                color: "darkgreen",
                opacity: 0.7,
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

  function AddDeleteSaveUndo() {
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
                console.log(mode);
                setMode(mode === "Both" ? mode : "Edit");
              }}
            >
              <AddCircleIcon
                style={{ fontSize: "1.7em", color: "darkgreen", opacity: 0.7 }}
              />{" "}
              {navTable}
            </Button>

            {navTableID && (
              <Button
                id="crudDelete"
                variant="contained"
                onClick={() => {
                  // TODO: Move handlers out of render...
                  dispatch(deleteRecord(state.navigate, state.settings));
                  setMode(mode === "Both" ? mode : "Outline");
                }}
              >
                <DeleteIcon
                  style={{ fontSize: "1.8em", color: "maroon", opacity: 0.7 }}
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
                onClick={() => {
                  // TODO: Move handlers out of render...
                  if (!isFormValid) {
                    alert("Please fill in all required fields before saving");
                    return;
                  }
                  if (navTableID === "-1")
                    dispatch(
                      insertRecord(state.navigate, state.settings, record)
                    );
                  else {
                    console.log(`ORIGRECORD = ${strOrigRecord}`);
                    console.log(`RECORD = ${strRecord}`);
                    dispatch(
                      updateRecord(
                        state.navigate,
                        state.settings,
                        recordDelta(record, origRecord)
                      )
                    );
                  }
                }}
              >
                <SaveIcon
                  style={{ fontSize: "2em", color: "darkgreen", opacity: 0.7 }}
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
                  else setRerenderFlat(rerenderFlag + 1);
                }}
              >
                <UndoIcon
                  style={{ fontSize: "2em", color: "maroon", opacity: 0.7 }}
                />
              </Button>
            </Grid>
          )
        )}
      </div>
    );
  }
};
