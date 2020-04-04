/*
-- tables to supplement & set default user...
select * from [AppTable]
where AppTable_role_id=2 -- role_id 1=Admin, 2=User; select * from [role]
*/

declare @default_user_id int = 1 -- select * from [user]

--
-- Delete deprecated 'topic' table
--

delete from [audit]
where audit_AppTable_id = 1020 -- deprecated topic table

delete from AppColumn
where AppColumn_AppTable_id = 1020

delete from AppTable
where AppTable_title = 'topic' and AppTable_id = 1020

--
-- Default ownership of all records to default user
--

update [audit] set audit_user_id = @default_user_id

--
-- Establish ownership by ensuring that all rows have at least one audit table entry...
--

declare @AppTableID int = (
	select AppTable_id from AppTable 
	where AppTable_title
		='category' -- *
)
insert into [audit]
( audit_user_id, audit_AppTable_id, audit_table_id, audit_update_type )
select @default_user_id, @AppTableID, 
		category_id,  -- *
		'UPDATE' 
	from category -- *
where category_id not in (
	select audit_table_id 
	from [audit]
	where audit_AppTable_id = @AppTableID
)

set @AppTableID = (
	select AppTable_id from AppTable 
	where AppTable_title
		='sprint' -- *
)
insert into [audit]
( audit_user_id, audit_AppTable_id, audit_table_id, audit_update_type )
select @default_user_id, @AppTableID, 
		sprint_id,  -- *
		'UPDATE' 
	from sprint -- *
where sprint_id -- *
not in (
	select audit_table_id 
	from [audit]
	where audit_AppTable_id = @AppTableID
)

set @AppTableID = (
	select AppTable_id from AppTable 
	where AppTable_title
		='story' -- *
)
insert into [audit]
( audit_user_id, audit_AppTable_id, audit_table_id, audit_update_type )
select @default_user_id, @AppTableID, 
		story_id,  -- *
		'UPDATE' 
	from story -- *
where story_id -- *
not in (
	select audit_table_id 
	from [audit]
	where audit_AppTable_id = @AppTableID
)

set @AppTableID = (
	select AppTable_id from AppTable 
	where AppTable_title
		='task' -- *
)
insert into [audit]
( audit_user_id, audit_AppTable_id, audit_table_id, audit_update_type )
select @default_user_id, @AppTableID, 
		task_id,  -- *
		'UPDATE' 
	from task -- *
where task_id -- *
not in (
	select audit_table_id 
	from [audit]
	where audit_AppTable_id = @AppTableID
)

set @AppTableID = (
	select AppTable_id from AppTable 
	where AppTable_title
		='project' -- *
)
insert into [audit]
( audit_user_id, audit_AppTable_id, audit_table_id, audit_update_type )
select @default_user_id, @AppTableID, 
		project_id,  -- *
		'UPDATE' 
	from project -- *
where project_id -- *
not in (
	select audit_table_id 
	from [audit]
	where audit_AppTable_id = @AppTableID
)

set @AppTableID = (
	select AppTable_id from AppTable 
	where AppTable_title
		='problem' -- *
)
insert into [audit]
( audit_user_id, audit_AppTable_id, audit_table_id, audit_update_type )
select @default_user_id, @AppTableID, 
		problem_id,  -- *
		'UPDATE' 
	from problem -- *
where problem_id -- *
not in (
	select audit_table_id 
	from [audit]
	where audit_AppTable_id = @AppTableID
)

set @AppTableID = (
	select AppTable_id from AppTable 
	where AppTable_title
		='quiz' -- *
)
insert into [audit]
( audit_user_id, audit_AppTable_id, audit_table_id, audit_update_type )
select @default_user_id, @AppTableID, 
		quiz_id,  -- *
		'UPDATE' 
	from quiz -- *
where quiz_id -- *
not in (
	select audit_table_id 
	from [audit]
	where audit_AppTable_id = @AppTableID
)

set @AppTableID = (
	select AppTable_id from AppTable 
	where AppTable_title
		='response' -- *
)
insert into [audit]
( audit_user_id, audit_AppTable_id, audit_table_id, audit_update_type )
select @default_user_id, @AppTableID, 
		response_id,  -- *
		'UPDATE' 
	from response -- *
where response_id -- *
not in (
	select audit_table_id 
	from [audit]
	where audit_AppTable_id = @AppTableID
)
