import {credentials} from '../components/Login'


// TODO: if response format is json, we could include
// ".then(res => res && res.json())" in this fetch wrapper...
//
// IMPORTANT: To avoid runtime (unhandled) exceptions with
// Fetch(), calls should include catch handling
// even though I have a centralized alert message now.  Note that
// exceptions may be quashed using ".catch((error) =>{})".
//
export var Fetch = (resource:any,init?:any):Promise<Response | void> => { 
    // no sense in mutating callers object; also handle undefined case w/ defaults
    let _init = {...(init || {})}; 
    _init.headers = _init.headers || {};
    _init.headers.Authorization = 'Basic '+btoa(credentials.auth_name+':'+credentials.auth_pw);
    _init.headers['Content-Type'] = _init.headers['Content-Type'] || 'application/json; charset=utf-8';

    return new Promise<Response>((resolve,reject)=>{
        return fetch(resource,_init)        
        .then(res => {
            if (res.status >= 400/* Http error response range */) {
                alert(res.statusText); 
                reject(res.statusText);
            }
            else
                resolve(res); 
        })        
        .catch((error) => {
            alert(error); 
            reject(error);
        });
    })
}
