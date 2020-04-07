--
-- Not sure how to compose a custom field in Knex Schema, so apply
-- this custom script to migration 005_competency_challenge_response.js...
--
alter table requirement
add requirement_title 
	as left(requirement_identifier + ' - ' + requirement_description, 70)
		+ case when len(requirement_identifier + ' - ' + requirement_description) + 3 >= 70 
		then '...' else '' end 
