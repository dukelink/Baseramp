/*
    Baseramp Tracker - An open source Project Management software built
    as a Single Page Application (SPA) and Progressive Web Application (PWA) using
    Typescript, React, and an extensible SQL database model.

    Copyright (C) 2019-2020  William R. Lotherington, III

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import passport from 'passport';
import { cacheTable } from './cacheAppTables';

export const addApiAuthRoutes = (router) => 
{
    router.post('/login', 
        (req, res, next) => 
        {
            if (req.isAuthenticated()) 
                req.logout(); 

            passport.authenticate('local', function(err, user) {
                if (err) {
                    console.log(`ERROR ${JSON.stringify(err)}`) 
                    return next(err) }
                if (!user) { 
                    // TODO: Should never occur, but more research on need and proper form indicated...
                    console.log("NO USER FOUND ERROR!!!!")
                    // TODO: Return http 401 - unauthenticated, can we provide a message too?
                    return res.status(401).end(); 
                }

                // make passportjs setup the user object, serialize the user, ...
                req.login(user, {}, function(err) {
                    if (err) 
                    { 
                        console.log("LOGIN ERROR!!!!")
                        return next(err);
                    } 
                    else // Successful login
                    {
                        cacheTable('AppTable').load(req,res);
                        cacheTable('role').load(req,res);
                        const { user_id, user_title, user_login, user_active, user_role_id, role_title } 
                            = user; // reflect a subset of user attributes
                        return res.json({user_id, user_title, user_login, user_active, user_role_id, role_title});
                    }
                });
            })(req, res, next);
        }
    );

    // Logout Handler
    router.get("/logout", function(req, res) {
        if (req.isAuthenticated()) 
            req.logout();
        res.status(200).end();
    });
}

