
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