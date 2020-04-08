
-- quick hack to query table column names from an empty table
select requirement.* 
from requirement
right join (select 1 as a) as x on 1=1

-- Main example to query and save JSON data back to table...
insert into requirement
(requirement_identifier,requirement_category,requirement_description,requirement_priority,requirement_rank,requirement_status_id,requirement_project_id,requirement_requirement_id)
select 
--JSON_VALUE(cast(audit_field_changes as varchar(max)),'$.requirement_id') as requirement_id
JSON_VALUE(cast(audit_field_changes as varchar(max)),'$.requirement_identifier') as requirement_identifier
,JSON_VALUE(cast(audit_field_changes as varchar(max)),'$.requirement_category') as requirement_category
,JSON_VALUE(cast(audit_field_changes as varchar(max)),'$.requirement_description') as requirement_description
,JSON_VALUE(cast(audit_field_changes as varchar(max)),'$.requirement_priority') as requirement_priority
,JSON_VALUE(cast(audit_field_changes as varchar(max)),'$.requirement_rank') as requirement_rank
,JSON_VALUE(cast(audit_field_changes as varchar(max)),'$.requirement_status_id') as requirement_status_id
,JSON_VALUE(cast(audit_field_changes as varchar(max)),'$.requirement_project_id') as requirement_project_id
,JSON_VALUE(cast(audit_field_changes as varchar(max)),'$.requirement_requirement_id') as requirement_requirement_id
--,JSON_VALUE(cast(audit_field_changes as varchar(max)),'$.requirement_title') as requirement_title
from requirements
where audit_update_type = 'INSERT'
order by audit_table_id

-- restore extracted and delete audit entries:
declare @new_audit_AppTable_id int = 2037
insert into audit
(audit_user_id,audit_AppTable_id,audit_table_id,audit_update_type,audit_update_time,audit_field_changes)
select 
audit_user_id,@new_audit_AppTable_id,audit_table_id,audit_update_type,audit_update_time,audit_field_changes
from requirements