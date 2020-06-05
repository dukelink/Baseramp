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
  useLayoutEffect,
  useRef,
} from "react";

import { Grid, IconButton, Paper, InputBase } from "@material-ui/core";

// Stock Material UI icons...
import PlayCircleFilledIcon from "@material-ui/icons/PlayCircleFilled";
import SearchIcon from "@material-ui/icons/SearchRounded";
import UndoIcon from "@material-ui/icons/UndoTwoTone";
import HighlightOffIcon from "@material-ui/icons/HighlightOffTwoTone";

// Material Design Icons site...
// https://dev.materialdesignicons.com/getting-started/react
// https://materialdesignicons.com/tag/community
import Icon from '@mdi/react';
import { mdiExpandAllOutline, mdiCollapseAllOutline } from '@mdi/js'; 

import {
  useNavPanelStyles,
  useSearchStyles,
} from "../SystemNavigator/SystemNavigatorStyles";

import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../rootReducer";

import {
  setOutlineFilters,
  SettingsState,
} from "../SettingsPage/SettingsSlice";

import { CSSProperties } from "@material-ui/core/styles/withStyles";

const initialSearchParams = {
  searchKeyInput: "",
  searchKey: "",
};

export function SearchBox(props: {
  mobileSearchLayout: boolean;
  mobileSearchMode: boolean;
  searchBarOnly: boolean;
  setMobileSearchMode: Dispatch<SetStateAction<boolean>>;
  collapsed?: boolean;
}) {
  const classes = useSearchStyles();
  const formRef = useRef<any>();
  const search = useRef(initialSearchParams);
  const settings = useSelector<RootState, SettingsState>(
    (state) => state.settings
  );
  const dispatch = useDispatch();
  const [rerenderFlag, setRerenderFlag] = useState(1);

  const { mobileSearchMode, setMobileSearchMode, mobileSearchLayout } = props;

  useLayoutEffect(() => {
    if (mobileSearchMode && !mobileSearchLayout) setMobileSearchMode(false);

    if (settings.searchFilter !== search.current.searchKey) {
      console.log(
        `RERENDER 1: settings.searchFilter=${JSON.stringify(
          settings.searchFilter
        )}, search.current.searchKey=${JSON.stringify(
          search.current.searchKey
        )}`
      );
      search.current = {
        ...search.current,
        searchKey: settings.searchFilter,
        searchKeyInput: settings.searchFilter,
      };
      setRerenderFlag(rerenderFlag + 1);
    }
  }, [mobileSearchLayout, mobileSearchMode]);

  console.log(`SearchBox(); search=${JSON.stringify(search)}`);

  if (props.searchBarOnly) return <SearchBarOnly />;
  if (props.collapsed) return <MobileSearchCollapsed />;

  const searchEdited =
    search.current.searchKeyInput !== search.current.searchKey;
  let highlightSearch: CSSStyleDeclaration | {} = {
    backgroundColor: "lightgrey",
    color: "black",
  };
  if (search.current.searchKey)
    highlightSearch = {
      ...highlightSearch,
      color: "darkgreen",
      //opacity: "0.7",
    };
  if (searchEdited) {
    highlightSearch = { ...highlightSearch, color: "maroon" };
    if (search.current.searchKey) {
      highlightSearch = {
        ...highlightSearch,
        backgroundColor: "green",
        //opacity: "0.9",
      };
    }
  }

  const displayFilterClearIcon = settings.searchFilter ? "default" : "none";

  return (
    <Grid container xs={12}>
      <Grid item xs={9}>
        <Paper
          component="form"
          className={classes.root}
          style={{ height: 32, marginTop: 2, backgroundColor: 'lightgrey' }}
          onSubmit={(e) => {
            e.preventDefault();
            console.log("RERENDER 2");
            // NOTE: RERENDER 1 takes care of updating
            // 'search.current.searchKey' once state settles
            dispatch(
              setOutlineFilters({
                settings: {
                  ...settings,
                  searchFilter: search.current.searchKeyInput,
                },
              })
            );
            search.current.searchKey = search.current.searchKeyInput;
            setRerenderFlag(rerenderFlag + 1);
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
              backgroundColor: "lightgrey",
              fontWeight:
                search.current.searchKey && !searchEdited ? "bold" : "normal",
            }}
            value={search.current.searchKeyInput}
            onChange={setInputFieldState}
          />
          {searchEdited && (
            <IconButton
              className={classes.iconButton}
              aria-label="search"
              onClick={() => {
                console.log("RERENDER 3");
                search.current.searchKeyInput = search.current.searchKey;
                setRerenderFlag(rerenderFlag + 1);
              }}
            > 
              <UndoIcon style={{ color: "maroon", opacity: 0.7 }} />
            </IconButton>
          )}
          <HighlightOffIcon
            key = {
              // Probable React Bug: was not detecting display attribute
              // change alone, so I've added this key. 
              displayFilterClearIcon 
            }
            style={{
              fontSize: "1.6em",
              color: "darkgreen",
              position: "relative",
              left: -4,
              cursor: "pointer",
              display: displayFilterClearIcon,
            }}
            onClick={() => {
              console.log("RERENDER 4");
              dispatch(
                setOutlineFilters({
                  settings: { ...settings, searchFilter: "" },
                })
              );
              search.current.searchKeyInput = "";
              search.current.searchKey = "";
              setRerenderFlag(rerenderFlag + 1);
            }}
          />
        </Paper>
      </Grid>
      <Grid item xs={3} style={{color: 'white', paddingTop: '3px'}}>
        <Grid container xs={12} style={{ justifyContent: 'space-around'}}> 
          <div
            style={{cursor:'pointer'}} 
            onClick={() => {
            dispatch(
              setOutlineFilters({
                settings: { ...settings, expandOutline: true,
                  expandCollapseUpdateCounter : settings.expandCollapseUpdateCounter + 1 },
              })
            );
          }}>
            <Icon path={mdiExpandAllOutline}
              title="Outline - Expand All"
              size={1.2}
              horizontal
              vertical
              rotate={180}
              color="lightgrey" />
          </div>
          <div
            style={{cursor:'pointer'}} 
            onClick={() => {
            dispatch(
              setOutlineFilters({
                settings: { ...settings, expandOutline: false, 
                  expandCollapseUpdateCounter : settings.expandCollapseUpdateCounter + 1 },
              })
            );
          }}>
            <Icon path={mdiCollapseAllOutline}
              title="Outline - Collapse All"
              size={1.2}
              horizontal
              vertical
              rotate={0}
              color="lightgrey" />
          </div>
        </Grid>
      </Grid>
    </Grid>
  );

  function setInputFieldState(e: React.SyntheticEvent | React.KeyboardEvent) {
    const target = e.target as HTMLInputElement;
    console.log("RERENDER 5");
    search.current.searchKeyInput = target.value;
    setRerenderFlag(rerenderFlag + 1);
  }

  function MobileSearchCollapsed() {
    let searchFilterCSS: CSSProperties = {
      fontSize: "1.5em",
      color: "white",
      opacity: search.current.searchKeyInput ? "1" : "0.8",
    };

    if (search.current.searchKey)
      searchFilterCSS = Object.assign(searchFilterCSS, {
        color: "darkgreen",
        opacity: "1",
      });

    return (
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
    );
  }

  function SearchBarOnly() {
    const classes = useNavPanelStyles();
    return (
      <>
        {mobileSearchMode && (
          <Grid item xs={1} style={{ cursor: "pointer", textAlign: "center" }}>
            <PlayCircleFilledIcon
              className={classes.rotate180}
              style={{
                fontSize: "2.1em",
                position: "relative",
                left: 2,
                top: 1,
                opacity: 0.8,
                color: "white",
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
          style={{ backgroundColor: "transparent" }}
        >
          <SearchBox
            mobileSearchLayout={mobileSearchLayout}
            mobileSearchMode={mobileSearchMode}
            searchBarOnly={false}
            setMobileSearchMode={setMobileSearchMode}
          />
        </Grid>
      </>
    );
  }
}
