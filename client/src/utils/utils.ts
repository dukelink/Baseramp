import { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { RecordOfAnyType } from '../model/ModelTypes';

export const recordDelta = (newObj: {[key:string]:any}, origObj: {[key:string]:any}) => {
  var changes = {} as RecordOfAnyType;
  Object.keys(newObj).forEach((fld) => {
      if (newObj[fld] !== origObj[fld]
          && !fld.includes("Project Sprint")) // HACK: XREF - do not write compound virtual 'key' fields
        changes[fld] = (newObj[fld] || '');
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
