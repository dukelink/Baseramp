
declare @user_role int = (select role_id from [role] where role_title='User')

update AppTable
set AppTable_role_id = @user_role
where AppTable_role_id is null

update [user]
set user_role_id = @user_role
where user_role_id is null

go

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
ALTER TABLE dbo.[user]
	DROP CONSTRAINT user_user_role_id_foreign
GO
ALTER TABLE dbo.AppTable
	DROP CONSTRAINT apptable_apptable_role_id_foreign
GO
ALTER TABLE dbo.role SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.role', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.role', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.role', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
CREATE TABLE dbo.Tmp_AppTable
	(
	AppTable_id int NOT NULL IDENTITY (1, 1),
	AppTable_title nvarchar(50) NOT NULL,
	AppTable_description nvarchar(MAX) NULL,
	AppTable_rank int NULL,
	AppTable_table_name nvarchar(128) NOT NULL,
	AppTable_role_id int NOT NULL
	)  ON [PRIMARY]
	 TEXTIMAGE_ON [PRIMARY]
GO
ALTER TABLE dbo.Tmp_AppTable SET (LOCK_ESCALATION = TABLE)
GO
SET IDENTITY_INSERT dbo.Tmp_AppTable ON
GO
IF EXISTS(SELECT * FROM dbo.AppTable)
	 EXEC('INSERT INTO dbo.Tmp_AppTable (AppTable_id, AppTable_title, AppTable_description, AppTable_rank, AppTable_table_name, AppTable_role_id)
		SELECT AppTable_id, AppTable_title, AppTable_description, AppTable_rank, AppTable_table_name, AppTable_role_id FROM dbo.AppTable WITH (HOLDLOCK TABLOCKX)')
GO
SET IDENTITY_INSERT dbo.Tmp_AppTable OFF
GO
ALTER TABLE dbo.AppColumn
	DROP CONSTRAINT appcolumn_appcolumn_apptable_id_foreign
GO
ALTER TABLE dbo.audit
	DROP CONSTRAINT audit_audit_apptable_id_foreign
GO
DROP TABLE dbo.AppTable
GO
EXECUTE sp_rename N'dbo.Tmp_AppTable', N'AppTable', 'OBJECT' 
GO
ALTER TABLE dbo.AppTable ADD CONSTRAINT
	PK__AppTable__7166EDA716BDC98C PRIMARY KEY CLUSTERED 
	(
	AppTable_id
	) WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]

GO
ALTER TABLE dbo.AppTable ADD CONSTRAINT
	apptable_apptable_role_id_foreign FOREIGN KEY
	(
	AppTable_role_id
	) REFERENCES dbo.role
	(
	role_id
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
COMMIT
select Has_Perms_By_Name(N'dbo.AppTable', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.AppTable', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.AppTable', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.AppColumn WITH NOCHECK ADD CONSTRAINT
	appcolumn_appcolumn_apptable_id_foreign FOREIGN KEY
	(
	AppColumn_AppTable_id
	) REFERENCES dbo.AppTable
	(
	AppTable_id
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.AppColumn SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.AppColumn', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.AppColumn', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.AppColumn', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.[user]
	DROP CONSTRAINT DF__user__user_activ__6E8B6712
GO
CREATE TABLE dbo.Tmp_user
	(
	user_id int NOT NULL IDENTITY (1, 1),
	user_title nvarchar(80) NOT NULL,
	user_login nvarchar(80) NOT NULL,
	user_password_hash nvarchar(100) NOT NULL,
	user_active bit NOT NULL,
	user_email nvarchar(80) NULL,
	user_phone nvarchar(30) NULL,
	user_role_id int NOT NULL
	)  ON [PRIMARY]
GO
ALTER TABLE dbo.Tmp_user SET (LOCK_ESCALATION = TABLE)
GO
ALTER TABLE dbo.Tmp_user ADD CONSTRAINT
	DF__user__user_activ__6E8B6712 DEFAULT ('0') FOR user_active
GO
SET IDENTITY_INSERT dbo.Tmp_user ON
GO
IF EXISTS(SELECT * FROM dbo.[user])
	 EXEC('INSERT INTO dbo.Tmp_user (user_id, user_title, user_login, user_password_hash, user_active, user_email, user_phone, user_role_id)
		SELECT user_id, user_title, user_login, user_password_hash, user_active, user_email, user_phone, user_role_id FROM dbo.[user] WITH (HOLDLOCK TABLOCKX)')
GO
SET IDENTITY_INSERT dbo.Tmp_user OFF
GO
ALTER TABLE dbo.audit
	DROP CONSTRAINT audit_audit_user_id_foreign
GO
DROP TABLE dbo.[user]
GO
EXECUTE sp_rename N'dbo.Tmp_user', N'user', 'OBJECT' 
GO
ALTER TABLE dbo.[user] ADD CONSTRAINT
	PK__user__B9BE370F95401337 PRIMARY KEY CLUSTERED 
	(
	user_id
	) WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]

GO
CREATE UNIQUE NONCLUSTERED INDEX user_user_title_unique ON dbo.[user]
	(
	user_title
	) WHERE ([user_title] IS NOT NULL)
 WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE UNIQUE NONCLUSTERED INDEX user_user_login_unique ON dbo.[user]
	(
	user_login
	) WHERE ([user_login] IS NOT NULL)
 WITH( STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
ALTER TABLE dbo.[user] ADD CONSTRAINT
	user_user_role_id_foreign FOREIGN KEY
	(
	user_role_id
	) REFERENCES dbo.role
	(
	role_id
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
COMMIT
select Has_Perms_By_Name(N'dbo.[user]', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.[user]', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.[user]', 'Object', 'CONTROL') as Contr_Per BEGIN TRANSACTION
GO
ALTER TABLE dbo.audit ADD CONSTRAINT
	audit_audit_user_id_foreign FOREIGN KEY
	(
	audit_user_id
	) REFERENCES dbo.[user]
	(
	user_id
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.audit ADD CONSTRAINT
	audit_audit_apptable_id_foreign FOREIGN KEY
	(
	audit_AppTable_id
	) REFERENCES dbo.AppTable
	(
	AppTable_id
	) ON UPDATE  NO ACTION 
	 ON DELETE  NO ACTION 
	
GO
ALTER TABLE dbo.audit SET (LOCK_ESCALATION = TABLE)
GO
COMMIT
select Has_Perms_By_Name(N'dbo.audit', 'Object', 'ALTER') as ALT_Per, Has_Perms_By_Name(N'dbo.audit', 'Object', 'VIEW DEFINITION') as View_def_Per, Has_Perms_By_Name(N'dbo.audit', 'Object', 'CONTROL') as Contr_Per 