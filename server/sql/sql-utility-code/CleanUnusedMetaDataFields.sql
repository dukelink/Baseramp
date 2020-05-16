--
-- CAREFUL: Make sure to include virtual M2M junction table fields
-- in where clause exception tests...


ALTER TABLE AppColumn NOCHECK CONSTRAINT appcolumn_appcolumn_related_pk_id_foreign;
ALTER TABLE AppColumn NOCHECK CONSTRAINT appcolumn_appcolumn_apptable_id_foreign;

-- SELECT *
DELETE 
FROM AppColumn
WHERE AppColumn_column_name NOT IN (
	select column_name 
	from TABLE_COLUMNS
)
and AppColumn_column_name
	not like '%StoryRequirement%'
and AppColumn_column_name
	not like '%StoryStory%'
and AppColumn_column_name
	not like '%StatusAppTable%'
and AppColumn_column_name
	not like '%CategoryAppTable%'

ALTER TABLE AppColumn CHECK CONSTRAINT appcolumn_appcolumn_related_pk_id_foreign;
ALTER TABLE AppColumn CHECK CONSTRAINT appcolumn_appcolumn_apptable_id_foreign;
