/* To prevent any potential data loss issues, you should review this script in detail before running it outside the context of the database designer.*/
BEGIN TRANSACTION
SET QUOTED_IDENTIFIER ON
SET ARITHABORT ON
SET NUMERIC_ROUNDABORT OFF
SET CONCAT_NULL_YIELDS_NULL ON
SET ANSI_NULLS ON
SET ANSI_PADDING ON
SET ANSI_WARNINGS ON
COMMIT
BEGIN TRANSACTION
GO
ALTER TABLE dbo.challenge
	DROP CONSTRAINT challenge_challenge_category_id_foreign
GO
ALTER TABLE dbo.category SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.category', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.category', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.category', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.challenge
	DROP CONSTRAINT challenge_challenge_status_id_foreign
GO
ALTER TABLE dbo.status SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.status', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.status', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.status', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.challenge
	DROP CONSTRAINT challenge_challenge_competency_id_foreign
GO
ALTER TABLE dbo.competency SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.competency', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.competency', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.competency', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
CREATE TABLE dbo.Tmp_challenge
	(
	challenge_id int NOT NULL IDENTITY (1, 1),
	challenge_rank int NULL,
	challenge_competency_id int NULL,
	challenge_prompt nvarchar(MAX) NOT NULL,
	challenge_hints nvarchar(MAX) NULL,
	challenge_solution nvarchar(MAX) NOT NULL,
	challenge_status_id int NOT NULL,
	challenge_title  AS (left([challenge_prompt],(150))+case when len([challenge_prompt])>=(150) then '...' else '' end),
	challenge_category_id int NULL
	)  ON [PRIMARY]
	 TEXTIMAGE_ON [PRIMARY]
GO
ALTER TABLE dbo.Tmp_challenge SET (LOCK_ESCALATION = TABLE)
GO
SET IDENTITY_INSERT dbo.Tmp_challenge ON
GO
IF EXISTS(SELECT * FROM dbo.challenge)
	 EXEC('INSERT INTO dbo.Tmp_challenge (challenge_id, challenge_rank, challenge_competency_id, challenge_prompt, challenge_hints, challenge_solution, challenge_status_id, challenge_category_id)
		SELECT challenge_id, challenge_rank, challenge_competency_id, challenge_prompt, challenge_hints, challenge_solution, challenge_status_id, challenge_category_id FROM dbo.challenge WITH (HOLDLOCK TABLOCKX)')
GO
SET IDENTITY_INSERT dbo.Tmp_challenge OFF
GO
ALTER TABLE dbo.response
	DROP CONSTRAINT response_response_challenge_id_foreign
GO
DROP TABLE dbo.challenge
GO
EXECUTE sp_rename N'dbo.Tmp_challenge', N'challenge', 'OBJECT' 
GO
ALTER TABLE dbo.challenge ADD CONSTRAINT
	PK__challeng__CF635191FAD61474 PRIMARY KEY CLUSTERED 
	(
	challenge_id
	) WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]

GO
ALTER TABLE dbo.challenge ADD CONSTRAINT
	challenge_challenge_competency_id_foreign FOREIGN KEY
	(
	challenge_competency_id
	) REFERENCES dbo.competency
	(
	competency_id
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.challenge ADD CONSTRAINT
	challenge_challenge_status_id_foreign FOREIGN KEY
	(
	challenge_status_id
	) REFERENCES dbo.status
	(
	status_id
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.challenge ADD CONSTRAINT
	challenge_challenge_category_id_foreign FOREIGN KEY
	(
	challenge_category_id
	) REFERENCES dbo.category
	(
	category_id
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
COMMIT
select Has_Perms_By_Name(N'dbo.challenge', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.challenge', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.challenge', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.response ADD CONSTRAINT
	response_response_challenge_id_foreign FOREIGN KEY
	(
	response_challenge_id
	) REFERENCES dbo.challenge
	(
	challenge_id
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.response SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.response', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.response', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.response', 'Object', 'CONTROL') as Contr_Per 