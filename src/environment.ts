const env = (document.baseURI||"")
    .includes('localhost') ? 
        ( document.baseURI.includes('3000') ? 'development' : 'local') : 'production';

// console.log(`Settings.ts: Referrer & resulting environment: ${document.baseURI}, ${env}`)

const url = {
    production : {
        serverURL : 'https://wrl-projects.azurewebsites.net/api/'
    },
    local : {
        serverURL : 'http://localhost:8080/api/'
    },
    development : {
        serverURL : 'http://localhost:8080/api/' // same as above, node server still on 8080, port 3000 is only for client
    }
}

export const Environment = { 
    mode : env,
    serverURL : url[env].serverURL 
};