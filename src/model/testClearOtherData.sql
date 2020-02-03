
delete from story 
where story_id 
not in (
	select id from
	(values (210),(215),(217),(220),(225)) as x(id)
)

delete from project
where project_id not in (select story_project_id from story)

delete from category
where category_id not in (select project_category_id from project)

delete from sprint
where sprint_id not in (select story_sprint_id from story)

