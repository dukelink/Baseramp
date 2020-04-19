insert into AppColumn
select 
	'story_'+AppColumn_title, -- ..._title
	AppColumn_description, 
	AppColumn_rank, 
	(select AppTable_id from AppTable 
		where AppTable_title='story'), 
	AppColumn_ui_hidden, 
	AppColumn_ui_minwidth, 
	AppColumn_read_only,
	'story_'+AppColumn_title, -- ..._column_name
	AppColumn_is_nullable, 
	AppColumn_data_type, 
	AppColumn_character_maximum_length, 
	AppColumn_column_default, 
	AppColumn_related_pk_id
from AppColumn
where AppColumn_AppTable_id in (
	select AppTable_id
	from AppTable 
	where AppTable_title in ( 'StoryStory', 'StoryRequirement')
		and AppColumn_title not in ('StoryStory_id', 'StoryRequirement_id')
)

insert into AppColumn
select 
	'requirement_'+AppColumn_title, -- ..._title
	AppColumn_description, 
	AppColumn_rank, 
	(select AppTable_id from AppTable 
		where AppTable_title='requirement'), 
	AppColumn_ui_hidden, 
	AppColumn_ui_minwidth, 
	AppColumn_read_only,
	'requirement_'+AppColumn_title, -- ..._column_name
	AppColumn_is_nullable, 
	AppColumn_data_type, 
	AppColumn_character_maximum_length, 
	AppColumn_column_default, 
	AppColumn_related_pk_id
from AppColumn
where AppColumn_AppTable_id in (
	select AppTable_id
	from AppTable 
	where AppTable_title in ( 'StoryRequirement')
		and AppColumn_title not in ('StoryRequirement_id')
)

-- select * from AppColumn
update AppColumn set AppColumn_AppTable_junction_id = (select AppTable_id from AppTable where AppTable_title = 'StoryStory')
where AppColumn_title like '%_StoryStory_%'

-- select * from AppColumn
update AppColumn set AppColumn_AppTable_junction_id = (select AppTable_id from AppTable where AppTable_title = 'StoryRequirement')
where AppColumn_title like '%_StoryRequirement_%'

insert into AppColumn
(
AppColumn_title,	
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
AppColumn_column_default,
AppColumn_related_pk_id,
AppColumn_AppTable_junction_id
) values (
'AppColumn_AppTable_junction_id',
null,
10100,
1,
0,
null,
1,
'AppColumn_AppTable_junction_id',
'YES',
'Integer',
NULL,
NULL,
1175, -- select * from AppColumn where AppColumn_title = 'AppTable_id' -- 1175
NULL
)
