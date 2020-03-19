// TODO: if response format is json, we could include
// ".then(res => res && res.json())" in this fetch wrapper...
//
// IMPORTANT: To avoid runtime (unhandled) exceptions with
// Fetch(), calls should include catch handling
// even though I have a centralized alert message now.  Note that
// exceptions may be quashed using ".catch((error) =>{})".
//
export var Fetch = (resource:any,init:RequestInit={},defaultMessage=true):Promise<Response | void> => { 
    // no sense in mutating callers object; also handle undefined case w/ defaults
    let _init : any = {...init}; 
    _init.headers = _init.headers || {};
    _init.headers['Content-Type'] = _init.headers['Content-Type'] || 'application/json; charset=utf-8';

    return new Promise<Response>((resolve,reject)=>{
        return fetch(resource,_init)        
        .then(res => {
            if (res.status >= 400/* Http error response range */) {
                if (defaultMessage)
                    alert(`Error fetching resource ${resource}: ${res.statusText}`); 
                reject(res.statusText);
            }
            else
                resolve(res); 
        })        
        .catch((error) => {
            //
            // Example of this case is a CORS error, which populates error with a string of:
            //  "TypeError: NetworkError when attempting to fetch resource".
            //
            // For these errors, more information may be provided by the browser; where in 
            // the example above we get a console.warn of:
            //   Cross-Origin Request Blocked: The Same Origin Policy disallows reading the 
            //   remote resource at http://localhost:8080/api/all. (Reason: CORS request did not succeed).
            // TODO: Access and report these additional details from accessing browser console API...
            //
            if (error)
                alert(error); 
            else if (defaultMessage)
                console.warn(`Fetch exception with no error message`)
            reject(error);
        });
    })
}
