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

-- Knex.raw() call must pass a single parameter
-- with a string listing tables to refresh using 
-- syntax like '[user]|[audit]' (e.g. MSSQL t-sql syntax)
-- (TODO: Postgres may require different syntax)
DECLARE @TablesToRefresh varchar(200) = ?; 

DROP TABLE IF EXISTS TABLE_COLUMNS;

/*
**
** Tested compatible for MS SQL and Postgresql for common use-cases,
** although column_default values may vary.
**
*/
SELECT 
	table_name,
	column_name,
	is_nullable,
	ordinal_position,
	case data_type
		when 'nvarchar' then 'character varying'
		when 'int' then 'integer'
		else data_type
	end as data_type,
	case character_maximum_length
		when -1 then null
		else character_maximum_length
	end as character_maximum_length,
	column_default
INTO TABLE_COLUMNS
FROM INFORMATION_SCHEMA.COLUMNS
where table_catalog=DB_NAME() /* mssql function */
	and table_schema in ('public'/*Postgresql*/,'dbo'/*mssql*/)
	and table_name not like 'knex_%'
	and table_name <> 'sysdiagrams'
ORDER BY TABLE_NAME,ORDINAL_POSITION;

ALTER TABLE AppColumn NOCHECK CONSTRAINT appcolumn_appcolumn_related_pk_id_foreign;
ALTER TABLE AppColumn NOCHECK CONSTRAINT appcolumn_appcolumn_apptable_id_foreign;

DELETE FROM AppColumn
WHERE AppColumn_AppTable_id in (
	SELECT AppTable_id 
	FROM AppTable
	WHERE @TablesToRefresh='*' 
		or charindex('['+AppTable_table_name+']',@TablesToRefresh) > 0
)

ALTER TABLE AppColumn CHECK CONSTRAINT appcolumn_appcolumn_related_pk_id_foreign;
ALTER TABLE AppColumn CHECK CONSTRAINT appcolumn_appcolumn_apptable_id_foreign;


DELETE FROM AppTable
WHERE @TablesToRefresh='*' 
		or charindex('['+AppTable_table_name+']',@TablesToRefresh) > 0

INSERT INTO AppTable (
	AppTable_Title,
	AppTable_Description,
	AppTable_Rank,
	AppTable_table_name
)
SELECT DISTINCT
	case 
		when tm.table_metadata_title is null 
			then tc.table_name 
		else tm.table_metadata_title 
	end,
	tm.table_metadata_description,
	tm.table_metadata_rank,
	tc.table_name
from TABLE_COLUMNS tc
left join table_metadata tm
on tc.table_name = tm.table_metadata_table_name
where tc.table_name NOT IN ( 'TABLE_COLUMNS', 'TABLE_RELATIONSHIPS', 'TABLE_METADATA', 'COLUMN_METADATA' )
and (@TablesToRefresh='*' 
		or charindex('['+tc.table_name+']',@TablesToRefresh) > 0)

INSERT INTO AppColumn
(	AppColumn_title,
	AppColumn_description,
	AppColumn_rank,
	AppColumn_AppTable_id,
	AppColumn_ui_hidden,
	AppColumn_ui_minwidth,
	AppColumn_read_only,
	AppColumn_column_name,
	AppColumn_is_nullable,
	AppColumn_data_type,
	AppColumn_character_maximum_length,
	AppColumn_column_default
)
SELECT -- TODO: Test/fixup for Postgresql or use Knex select query...
	ISNULL(cm_exact.column_metadata_title, 
			ISNULL(cm_domain.column_metadata_title, tc.column_name))
		as title,
	ISNULL(cm_exact.column_metadata_description, 
			cm_domain.column_metadata_description)
		as description,
	ISNULL(cm_exact.column_metadata_rank, 
			ISNULL(cm_domain.column_metadata_rank, tc.ordinal_position+10000))
		as rank,
	AppTable_id 
		as id,
	ISNULL(cm_exact.column_metadata_ui_hidden, 
			cm_domain.column_metadata_ui_hidden)
		as ui_hidden,
	ISNULL(cm_exact.column_metadata_ui_minwidth, 
			cm_domain.column_metadata_ui_minwidth)
		as ui_minwidth,
	ISNULL(cm_exact.column_metadata_read_only, 
			cm_domain.column_metadata_read_only)
		as read_only,
	tc.column_name,
	tc.is_nullable,
	tc.data_type,
	tc.character_maximum_length,
	tc.column_default
FROM TABLE_COLUMNS tc
INNER JOIN AppTable
ON tc.table_name = AppTable_table_name
AND (@TablesToRefresh='*' 
		or charindex('['+tc.table_name+']',@TablesToRefresh) > 0)
LEFT JOIN column_metadata cm_exact
on substring(tc.column_name,len(AppTable_table_name)+1,999) = cm_exact.column_metadata_general_column_name
	and cm_exact.column_metadata_table_name = AppTable_table_name
LEFT JOIN column_metadata cm_domain
on substring(tc.column_name,len(AppTable_table_name)+1,999) = cm_domain.column_metadata_general_column_name 
	and cm_exact.column_metadata_id is null;

with AppTblCol as (
	select at.AppTable_table_name, ac.AppColumn_id, ac.AppColumn_column_name
	from AppColumn ac
	inner join AppTable at
		on at.AppTable_id = ac.AppColumn_AppTable_id
), FKs as (
	select FK_TABLE, FK_Column, AppColumn_id as AppColumn_pk_id
	from TABLE_RELATIONSHIPS tr
	inner join AppTblCol tc
		on tr.PK_TABLE = tc.AppTable_table_name 
			and tr.PK_Column = tc.AppColumn_column_name
)
UPDATE AppColumn
	SET AppColumn_related_pk_id = AppColumn_pk_id
FROM AppColumn
INNER JOIN AppTblCol atc
	ON AppColumn.AppColumn_id = atc.AppColumn_id
INNER JOIN FKs
	ON atc.AppTable_table_name = FKs.FK_TABLE
		and atc.AppColumn_column_name = FKs.FK_Column;
