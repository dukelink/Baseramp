/*
    Baseramp Project Manager - An open source Project Management software built
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

import express from 'express';
export const apiRoutes = express.Router();
import { addApiReadDataRoutes } from './apiReadDataRoutes';
import { addApiWriteDataRoutes } from './apiWriteDataRoutes';
import { addApiAuthRoutes } from './apiAuthRoutes';

// auth routes must come before api routes because,
// at present, the POST /login route is ambiguous and
// also matches our POST /:table route....
addApiAuthRoutes(apiRoutes);
addApiReadDataRoutes(apiRoutes);
addApiWriteDataRoutes(apiRoutes);


