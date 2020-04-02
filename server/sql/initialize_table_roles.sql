declare @AdminRoleID int = (select role_id from role where role_title = 'Admin');

declare @UserRoleID int = (select role_id from role where role_title = 'User');

update AppTable 
	set AppTable_role_id = @AdminRoleID
	where AppTable_title in ('AppTable','AppColumn','user','status','audit','role')
	and AppTable_role_id is null

update AppTable 
	set AppTable_role_id = @UserRoleID
	where AppTable_title not in ('AppTable','AppColumn','user','status','audit','role')
	and AppTable_role_id is null

