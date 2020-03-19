import { useRef, useEffect, useLayoutEffect, useState } from 'react';

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

// https://reactjs.org/docs/hooks-faq.html#how-to-get-the-previous-props-or-state
export const usePrevious = (value:any) : any =>
{
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

// https://stackoverflow.com/questions/19014250/rerender-view-on-browser-resize-with-react
export function useWindowSize() {
  const [size, setSize] = useState([0, 0]);
  useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  return size;
}

/* 
function ShowWindowDimensions(props) {
  const [width, height] = useWindowSize();
  return <span>Window size: {width} x {height}</span>;
}
*/