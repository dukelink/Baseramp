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
