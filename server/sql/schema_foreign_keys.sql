/*
    Baseramp - An end user database system, 
    enabling personal data usage and private data ownership,
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

DROP TABLE IF EXISTS TABLE_RELATIONSHIPS;

SELECT 
    FK.TABLE_NAME as FK_TABLE, 
    CU.COLUMN_NAME as FK_Column, 
    PK.TABLE_NAME as PK_Table, 
    PT.COLUMN_NAME as PK_Column, 
    C.CONSTRAINT_NAME 
INTO TABLE_RELATIONSHIPS
FROM 
    INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS C 
    INNER JOIN 
    INFORMATION_SCHEMA.TABLE_CONSTRAINTS FK 
        ON C.CONSTRAINT_NAME = FK.CONSTRAINT_NAME 
    INNER JOIN 
    INFORMATION_SCHEMA.TABLE_CONSTRAINTS PK 
        ON C.UNIQUE_CONSTRAINT_NAME = PK.CONSTRAINT_NAME 
    INNER JOIN 
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE CU 
        ON C.CONSTRAINT_NAME = CU.CONSTRAINT_NAME 
    INNER JOIN 
    ( 
        SELECT 
            i1.TABLE_NAME, i2.COLUMN_NAME 
        FROM 
            INFORMATION_SCHEMA.TABLE_CONSTRAINTS i1 
            INNER JOIN 
            INFORMATION_SCHEMA.KEY_COLUMN_USAGE i2 
            ON i1.CONSTRAINT_NAME = i2.CONSTRAINT_NAME 
            WHERE i1.CONSTRAINT_TYPE = 'PRIMARY KEY' 
    ) PT 
    ON PT.TABLE_NAME = PK.TABLE_NAME;

