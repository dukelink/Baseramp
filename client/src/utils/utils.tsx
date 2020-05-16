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

import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { RecordOfAnyType } from '../model/ModelTypes';

export const recordDelta = (newObj: {[key:string]:any}, origObj: {[key:string]:any}) => {
  var changes = {} as RecordOfAnyType;
  Object.keys(newObj).forEach((fld) => {
      if (newObj[fld] !== origObj[fld]
          && !fld.includes("Project Sprint")) // HACK: XREF - do not write compound virtual 'key' fields
        changes[fld] = (newObj[fld] || null);
  });
  return changes;
}

export const properCase = (s:string) => {
  return s[0].toUpperCase().toUpperCase() + s.substr(1).toLowerCase();
}

export const properCasePluralize = (s: string):string => 
{
  let proper : string;

  proper = s[0].toUpperCase().toUpperCase() + s.substr(1).toLowerCase();
  if (s.substr(-1).toLowerCase() === 'y') {
      return proper.substring(0, proper.length - 1) + 'ies';
  }
  return proper + (proper.substr(-1).match(/[sz]$/) ? 'es' : 's'); 
}

// https://reactjs.org/docs/hooks-faq.html#how-to-get-the-previous-props-or-state
export const usePrevious = (value:any) : any =>
{
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export function useWindowSize() {
  const ref = useRef<[number,number]>();
  ref.current = [window.innerWidth, window.innerHeight];
  const [size, setSize] = useState(ref.current);

  console.log(`useWindowSize(): size = ${JSON.stringify(size)}, innerWidth=${window.innerWidth}, innerHeight=${window.innerHeight}`);

  function updateSize() {
    setSize([window.innerWidth, window.innerHeight]);
  }

  useLayoutEffect(() => {
    // Trigger update for web apps pinned to desktop in IOS
    // (no resize events are fired so I am using setInterval() 
    //  as a universal solution!). This reduces # of updates too,
    //  like a denounce solution...
    const intv = setInterval( () => {
      if (ref.current && ( 
          ref.current[0]!==window.innerWidth
          || ref.current[1]!==window.innerHeight )
      ) {
        ref.current = [window.innerWidth, window.innerHeight];
        updateSize();
      }
    }, 200 ); 
    return () => { clearInterval(intv); }
  }, []);
  
  return size; 
}

export const VerticalSpace = (props:{pixels?:number, vh?:number}) => (
  <div style={{
      display: 'inline-block', 
      height: props.pixels ? props.pixels+'px' :
        (props.vh ? props.vh+'vh' : ''), 
      width: '100%' }}>
    &nbsp; {/* Some browsers need content for spacer to work... */}
  </div>);

// https://stackoverflow.com/questions/16167581/sort-object-properties-and-json-stringify
export function JSONstringifyOrder( obj : object, space ?: string | number )
{
    var allKeys = [] as any;
    JSON.stringify( obj, function( key, value ){ allKeys.push( key ); return value; } )
    allKeys.sort();
    return JSON.stringify( obj, allKeys, space );
}