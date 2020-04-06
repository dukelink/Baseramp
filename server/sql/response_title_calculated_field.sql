--
-- Not sure how to compose a custom field in Knex Schema, so apply
-- this custom script to migration 005_competency_challenge_response.js...
--
alter table response
add response_title 
as cast(response_answer_timestamp as varchar(10)) 
	+ ' - Score: '+cast(response_score_percent as varchar(3))+'%';
