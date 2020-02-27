import { useRef, useEffect } from 'react';

export const recordDelta = (newObj: {[key:string]:any}, origObj: {[key:string]:any}) => {
    var changes : {[key:string]:any} = {};
    Object.keys(newObj).forEach((fld) => {
        if (newObj[fld] !== origObj[fld])
            changes[fld] = (newObj[fld] || '');
    });
    return changes;
  }

  export const properCase = (s:string) => {
    return s[0].toUpperCase().toUpperCase() + s.substr(1).toLowerCase();
  }

//
// Following copied from: https://reactjs.org/docs/hooks-faq.html#how-to-get-the-previous-props-or-state
// STUDY
export const usePrevious = (value:any) : any =>
{
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
