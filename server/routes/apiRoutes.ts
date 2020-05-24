/*
    Baseramp - A database for end users enabling personal and private data ownership,
    built as a Progressive Web Application (PWA) using
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

import express, { Request, Response } from 'express';
export const apiRoutes = express.Router();
import { addApiReadDataRoutes } from './apiReadDataRoutes';
import { addApiWriteDataRoutes } from './apiWriteDataRoutes';
import { addApiAuthRoutes } from './apiAuthRoutes';

type AuthenticatedRequest = Request & { user : any, isAuthenticated: any };

//
// Custom Authentication Middleware...
//

export const loggedInOnly = (req:AuthenticatedRequest, res:Response, next) =>
{
    if (req.isAuthenticated()) {
        if (req.user.user_id === req.query['user_id'])
            next();
        else {
            console.log(`HTTP 403 Forbidden user: ${JSON.stringify(req.user)}`)
            console.log(`HTTP 403 Forbidden params: ${JSON.stringify(req.query)}`)
            // HTTP 403 - Forbidden:
            // Appropriate for failed assertin where
            // request user no longer matches auth user.
            // (User probably signed in as another user in another tab.)
            res.status(403).end(); 
        }
    } else 
        res.status(401).end();
};

export const loggedOutOnly = (req, res, next) =>
{
    if (req.isUnauthenticated()) 
        next();
    else 
        res.end();
};

// auth routes must come before api routes because,
// at present, the POST /login route is ambiguous and
// also matches our POST /:table route....
addApiAuthRoutes(apiRoutes);
addApiReadDataRoutes(apiRoutes);
addApiWriteDataRoutes(apiRoutes);

/*
** REVIEW: This approach does NOT work, WHY????
**

//
// Authentication Middleware...
//

export function loggedInOnly(req, res, next)
{
    if (req.isAuthenticated()) 
        next();
    else 
        res.status(401).end();
}

export function loggedOutOnly(req, res, next) 
{
    if (req.isUnauthenticated()) 
        next();
    else 
        res.end();
}
*/