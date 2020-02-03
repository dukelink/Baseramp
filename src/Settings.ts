const env = (document.baseURI||"").includes('localhost') ? 'development' : 'production';

// console.log(`Settings.ts: Referrer & resulting environment: ${document.baseURI}, ${env}`)

const settings = {
    production : {
        serverURL : 'https://wrl-projects.azurewebsites.net/api/'
    },
    development : {
        serverURL : 'http://localhost:8080/api/'
    }
}

export const Settings = { 
    environment : env,
    serverURL : settings[env].serverURL 
};