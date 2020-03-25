drop view ProjectSprint

go
create view ProjectSprint as
select distinct
	cast(sprint_id as varchar(20)) + '-' 
	+ cast(project_id as varchar(20)) as ProjectSprint_id,
	sprint_id as ProjectSprint_sprint_id,
	project_id as ProjectSprint_project_id,
	project_title as ProjectSprint_title,
	project_description as ProjectSprint_description,
	project_rank as ProjectSprint_rank,
	project_status_id as ProjectSprint_status_id,
	project_category_id as ProjectSprint_category_id
from project
inner join story on story_project_id = project_id
inner join sprint on sprint_id = story_sprint_id

go

drop view _Story
go

create view _Story as
select
	cast(sprint_id as varchar(20)) + '-' 
	+ cast(project_id as varchar(20)) as story_ProjectSprint_id,
	story.*
from project
inner join story on story_project_id = project_id
inner join sprint on sprint_id = story_sprint_id

go

select * from ProjectSprint
select * from _Story
