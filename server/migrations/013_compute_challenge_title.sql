--
-- Not sure how to compose a custom field in Knex Schema, so apply
-- this custom script to migration 005_competency_challenge_response.js...
--
alter table challenge
drop challenge_title;

alter table challenge
add challenge_title 
	as left(challenge_prompt, 150)
		+ case when len(challenge_prompt) >= 150
		then '...' else '' end 
