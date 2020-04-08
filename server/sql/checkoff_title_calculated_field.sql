--
-- Not sure how to compose a custom field in Knex Schema, so apply
-- this custom script...
--
alter table checkoff
add checkoff_title 
as cast(checkoff_completed_timestamp as varchar(10)) 
	+ case when checkoff_hours_spent  is null then '' 
		else ' - Time spent: '+cast(checkoff_hours_spent as varchar(3))+' hour(s)'
		end;
