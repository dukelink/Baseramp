import store from  '../store';  // REVIEW: Are there any anti-patterns associated with thunks being state-aware?


// TODO: if response format is json, we could include
// ".then(res => res && res.json())" in this fetch wrapper...
//
// IMPORTANT: To avoid runtime (unhandled) exceptions with
// Fetch(), calls should include catch handling
// even though I have a centralized alert message now.  Note that
// exceptions may be quashed using ".catch((error) =>{})".
//
export var Fetch = (resource:any,init:RequestInit={},defaultMessage=true):Promise<Response | void> => 
{ 
    // Add in a querystring parameter for current user id globally
    // so that API can detect user changes, since current authentication
    // strategy updates cookies for whatever the latest login was within
    // any browser tag.  If the auth user doesn't match the apps idea
    // of who is logged in, then we can reject the request with a particular
    // http code and automatically log users out for now...
    // NOTE/REVIEW: not SSR compatible; but convinient for easy/quick/fast
    // access to Redux global store...
    const state = store.getState(); 
    const user_id = state.userLogin?.user_id
    if (user_id)
        resource += '?user_id='+user_id;

    // no sense in mutating callers object; also handle undefined case w/ defaults
    let _init : any = {...init}; 
    _init.headers = _init.headers || {};
    _init.headers['Content-Type'] = _init.headers['Content-Type'] || 'application/json; charset=utf-8';

    return new Promise<Response>((resolve,reject)=>{
        return fetch(resource,_init)        
        .then(res => {
            if ( // Forbidden, likely do to loss/change of sesion
                res.status === 401 || res.status === 403 
            ) {
                alert('This user is logged out possibly due to another user login from this browser -- return to login form...');
                const { origin, pathname } = document.location;
                document.location.replace(origin+pathname); 
            }
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
