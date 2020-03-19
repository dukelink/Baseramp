export const Environment = { 
    // following assumes [scheme]://<host>:<port>/ format, 
    // to which our api path is added...
    serverURL : document.baseURI.split('/').slice(0,3).join('/')+'/api/' 
};