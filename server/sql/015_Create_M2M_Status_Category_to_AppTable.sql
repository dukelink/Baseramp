insert into AppColumn
select 
	'status_'+AppColumn_title, -- ..._title
	AppColumn_description, 
	AppColumn_rank, 
	(select AppTable_id from AppTable 
		where AppTable_title='status'), 
	AppColumn_ui_hidden, 
	AppColumn_ui_minwidth, 
	AppColumn_read_only,
	'status_'+AppColumn_title, -- ..._column_name
	AppColumn_is_nullable, 
	AppColumn_data_type, 
	AppColumn_character_maximum_length, 
	AppColumn_column_default, 
	AppColumn_related_pk_id,
	(select AppTable_id from AppTable 
		where AppTable_title='StatusAppTable') 
from AppColumn
where AppColumn_AppTable_id in (
	select AppTable_id
	from AppTable 
	where AppTable_title in ( 'StatusAppTable')
		and AppColumn_title not in ('StatusAppTable_id')
)

insert into AppColumn
select 
	'category_'+AppColumn_title, -- ..._title
	AppColumn_description, 
	AppColumn_rank, 
	(select AppTable_id from AppTable 
		where AppTable_title='category'), 
	AppColumn_ui_hidden, 
	AppColumn_ui_minwidth, 
	AppColumn_read_only,
	'category_'+AppColumn_title, -- ..._column_name
	AppColumn_is_nullable, 
	AppColumn_data_type, 
	AppColumn_character_maximum_length, 
	AppColumn_column_default, 
	AppColumn_related_pk_id,
	(select AppTable_id from AppTable 
		where AppTable_title='CategoryAppTable') 
from AppColumn
where AppColumn_AppTable_id in (
	select AppTable_id
	from AppTable 
	where AppTable_title in ( 'CategoryAppTable')
		and AppColumn_title not in ('CategoryAppTable_id')
)


-- select * from AppColumn
update AppColumn 
set AppColumn_AppTable_junction_id = (
	select AppTable_id 
	from AppTable 
	where AppTable_title = 'StatusAppTable'
)
where AppColumn_title like '%_StatusAppTable_%'

-- select * from AppColumn
update AppColumn 
set AppColumn_AppTable_junction_id = (
	select AppTable_id 
	from AppTable 
	where AppTable_title = 'CategoryAppTable'
)
where AppColumn_title like '%_CategoryAppTable_%'
