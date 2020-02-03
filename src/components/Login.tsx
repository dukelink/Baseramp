import { Settings } from '../Settings';

export const credentials = {
    // Node Express server will bypass login requirement for localhost development, hence N/A...
    _auth_name : Settings.environment==='development' ? 'N/A' : undefined,
    _auth_pw : Settings.environment==='development' ? 'N/A' : undefined,

    //
    // TODO: A proper login form would be nice...
    //

    get auth_name() {
        this._auth_name = this._auth_name || prompt("User name?") || '';
        return this._auth_name;
    },
    get auth_pw() {
        this._auth_pw = this._auth_pw || prompt("Password?") || '';
        return this._auth_pw;
    }
}
