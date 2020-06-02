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

import React, { memo, useRef, useEffect, useState, ChangeEvent } from "react";
import { TreeView, TreeItem } from "@material-ui/lab";
import { Typography } from "@material-ui/core";
import { useTreeItemStyles } from "./SystemNavigatorStyles";

import { useDispatch, useSelector } from "react-redux";
import { setFocus } from "./NavigateSlice";
import { OutlineNode } from "../../model/ModelOutline";
import { RootState } from "../../rootReducer";
import { usePrevious } from "../../utils/utils";

import FolderIcon from "@material-ui/icons/Folder";
import AssignmentIcon from "@material-ui/icons/Assignment";
import ArrowRightIcon from "@material-ui/icons/ArrowRight";
import InputIcon from "@material-ui/icons/Input";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";

function OutlineItemLabel(props: { item: OutlineNode }) {
  const classes: any = useTreeItemStyles();
  const { item } = props;
  const settings = useSelector((state: RootState) => state.settings);
  const ctrlRef = useRef<HTMLSpanElement | any>();

  const labelClassName = item.inProgress
    ? classes.labelIconInProgress
    : !item.tableID || item.closedItem
    ? classes.labelIcon
    : classes.labelIconNotInProgress;

  const childCount: number | string = item.children.filter(searchFilterRule)
    .length;

  // Limit the tally subscript display to avoid TOO much detail and wrapping...
  const maxSubTalliesToShow = 3;

  let grandChildCounts = Object.entries(item.totalChildRecords)
    .filter((x) => x[0] !== item.table && x[0][0].toLowerCase() === x[0][0])
    .sort((f, s) => Object.keys(s[1]).length - Object.keys(f[1]).length)
    .filter((x, index) => index < maxSubTalliesToShow)
    .map(
      (x) =>
        // Just 1st 2 letters of table name for subtally stats
        x[0][0] +
        x[0][1] +
        ":" +
        // Followed by tally count...
        Object.keys(x[1]).length
      // To see tableIDs making up tally, use: ".join(', ')"
    )
    .join(", ");

  // Limit the tally subscript display to avoid TOO much detail and wrapping...
  if (
    Object.keys(item.totalChildRecords).filter((x) => x[0] !== item.table)
      .length > maxSubTalliesToShow
  )
    grandChildCounts += ", ...";

  // isAhit used to 'dim' (opacity .5) items that are NOT hits,
  // only used for top-level outline branches at present, as will
  // filter out non-hits everywhere else...
  const isAhit = childCount || grandChildCounts || item.inFilterPropagated;

  let itemTitle = item.itemTitle;
  const searchFilter = settings.searchFilter;
  const matchMarkupPrefix = '<span style="background-color:yellow">';
  const matchMarkupSuffix = "</span>";
  let pos = 0;
  while (
    searchFilter &&
    item.inFilterPropagated &&
    (pos = itemTitle.toLowerCase().indexOf(searchFilter.toLowerCase(), pos)) !==
      -1
  ) {
    if (pos === -1) break;
    itemTitle =
      itemTitle.slice(0, pos) +
      matchMarkupPrefix +
      itemTitle.slice(pos, pos + searchFilter.length) +
      matchMarkupSuffix +
      itemTitle.slice(pos + searchFilter.length);
    pos +=
      searchFilter.length + matchMarkupPrefix.length + matchMarkupSuffix.length;
  }

  useEffect(() => {
    (ctrlRef.current as HTMLSpanElement).innerHTML = itemTitle;
  }, [itemTitle]);

  return (
    <div className={classes.labelRoot}>
      {!item.tableID ? (
        <FolderIcon color="inherit" className={labelClassName} />
      ) : item.children.length ? (
        <InputIcon color="inherit" className={labelClassName} />
      ) : (
        <AssignmentIcon color="inherit" className={labelClassName} />
      )}
      <Typography
        variant="body2"
        style={{ opacity: isAhit ? 1.0 : 0.5 }}
        className={
          item.closedItem ? classes.labelTextClosedItem : classes.labelText
        }
      >
        <span ref={ctrlRef}>{/*itemTitle*/}</span>
        {((childCount === 1 && !grandChildCounts) || childCount > 1) && (
          <sup>&nbsp;({childCount})</sup>
        )}
        {!grandChildCounts ? "" : <sup>&nbsp; ({grandChildCounts})</sup>}
      </Typography>
    </div>
  );
}

function searchFilterRule(item: OutlineNode) {
  return (
    Object.keys(item.totalChildRecords).length ||
    (item.showTable && item.inFilterPropagated)
  );
}

const OutlineItem = memo(
  (props: { item: OutlineNode; key: any; children?: any }) => {
    const { item } = props;
    const dispatch = useDispatch();
    console.log("OutlineItem");
    const outlineLabel = OutlineItemLabel({ item });
    return (
      <TreeItem
        key={item.itemKey}
        nodeId={item.itemKey as string}
        className="customItem"
        label={outlineLabel}
        onClick={ outlineItemClick }
      >
        {item.children.filter(searchFilterRule).map((item) => (
          <OutlineItem item={item} key={item.itemKey} />
        ))}
      </TreeItem>
    );

    function outlineItemClick() {
      dispatch(setFocus(item));
    }
  }
);

export const Outline = (props: { outline: OutlineNode[] }) => {
  const classes: any = useTreeItemStyles();
  const searchFilter = useSelector(
    (state: RootState) => state.settings.searchFilter
  );
  const navTableID = useSelector(
    (state: RootState) => state.navigate.navTableID
  );
  const [expanded, setExpanded] = useState([] as string[]);
  const [selected, setSelected] = useState("");
  const priorSearchFilter = usePrevious(searchFilter);

  useEffect(() => {
// I think the following line was to clear record focus after
// cancelling out of new record addition...  But it messes with
// commit/story titled "Navigation focus vs. expand/collapse action"
// I'll add the issue to the story titled:
// "NIT: After new record save, update outline focus"
// And then I can delete this note after that story is completed...
//  if ((!navTableID || navTableID === "-1") && selected) setSelected("");

    // RULE: (Default pending expand/collapse control):
    // Collapse outline after any search, but retain open nodes when search is cleared via 'x'
    if (searchFilter !== priorSearchFilter && searchFilter) setExpanded([]);
  }, [searchFilter,navTableID,priorSearchFilter,selected]);

  const handleToggle: any = (event: ChangeEvent, nodeIds: string[]) => {
    // onNodeToggle is raised before onNodeSelect, and I need the information
    // from both events but I don't want to track when both have been raised
    // so the following derives the selected node from the prior and current
    // set of expanded nodes...
    const isExpandedLarger = expanded.length > nodeIds.length;
    const smallerArray = isExpandedLarger ? nodeIds : expanded;
    const largerArray = isExpandedLarger ? expanded : nodeIds;
    const smallerSet = new Set(smallerArray);
    const newlySelected = largerArray.find((id)=>(!smallerSet.has(id)));
    
    // RULE: if node not expanded, then expand, select, and display form
    if (!isExpandedLarger)
      setExpanded(nodeIds);
    // RULE: if already selected and expanded, then collapse outline
    else if (selected===newlySelected)
      setExpanded(nodeIds);
    // else RULE: if not selected and expanded, then select but don't collapse
  };

  const handleSelect: any = (event: ChangeEvent, nodeId: string) => {
    setSelected(nodeId);
  };
  console.log("Outline");
  return (
    <TreeView
      className={classes.treeviewRoot}
      defaultCollapseIcon={<ArrowDropDownIcon />}
      defaultExpandIcon={<ArrowRightIcon />}
      expanded={expanded}
      selected={selected}
      onNodeToggle={handleToggle}
      onNodeSelect={handleSelect}
    >
      {props.outline.map((item) => (
        <OutlineItem item={item} key={item.itemKey} />
      ))}
    </TreeView>
  );
};
