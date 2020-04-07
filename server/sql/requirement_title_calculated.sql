--
-- Not sure how to compose a custom field in Knex Schema, so apply
-- this custom script to migration 005_competency_challenge_response.js...
--
alter table requirement
add requirement_title 
	as left(requirement_identifier + ' - ' + requirement_description, 50)
		+ case when len(requirement_identifier + ' - ' + requirement_description) + 3 >= 50 
		then '...' else '' end 
