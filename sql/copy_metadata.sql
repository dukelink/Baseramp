--
-- Copy Table/Column meta data from dbo to guest schema.
--

delete from guest.[AppColumn]
delete from guest.[AppTable]

--

set identity_insert guest.AppTable on
go
insert into guest.AppTable
	(AppTable_id, AppTable_title, AppTable_description, AppTable_rank, AppTable_table_name)
	select * from dbo.AppTable
go
set identity_insert guest.AppTable off

--

set identity_insert guest.AppColumn on
go
insert into guest.AppColumn
	(AppColumn_id,AppColumn_title,AppColumn_description,
	 AppColumn_rank,AppColumn_AppTable_id,AppColumn_ui_hidden,
	 AppColumn_ui_minwidth,AppColumn_read_only,AppColumn_column_name,
	 AppColumn_is_nullable,AppColumn_data_type,AppColumn_character_maximum_length,
	 AppColumn_column_default,AppColumn_related_pk_id)
	select 
	 AppColumn_id,AppColumn_title,AppColumn_description,
	 AppColumn_rank,AppColumn_AppTable_id,AppColumn_ui_hidden,
	 AppColumn_ui_minwidth,AppColumn_read_only,AppColumn_column_name,
	 AppColumn_is_nullable,AppColumn_data_type,AppColumn_character_maximum_length,
	 AppColumn_column_default,AppColumn_related_pk_id
	from dbo.AppColumn
go
set identity_insert guest.AppColumn off

--

update targ
	set AppColumn_related_pk_id = src.AppColumn_related_pk_id
	from guest.AppColumn targ
	inner join dbo.AppColumn src
	on targ.AppColumn_id = src.AppColumn_id;

--

set identity_insert guest.[user] on
go
insert into guest.[user]
(user_id,user_title,user_login,user_password_hash,user_active,user_email,user_phone)
select
user_id,user_title,user_login,user_password_hash,user_active,user_email,user_phone
from dbo.[user]
go
set identity_insert guest.[user] off
