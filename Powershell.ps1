if ((Get-PSSnapin "Microsoft.SharePoint.PowerShell" -ErrorAction SilentlyContinue) -eq $null) 
{
    Add-PSSnapin "Microsoft.SharePoint.PowerShell"
}

#>> DB FUNCTIONS
function Create-DB-Connection() 
{
    param (
        [Parameter(Mandatory = $true)]
        [string]
        $ServerName,

        [Parameter(Mandatory = $true)]
        [string] 
        $DBName, 

        [Parameter(Mandatory = $true)]
        [string]
        $UserName, 

        [Parameter(Mandatory = $true)]
        [string]
        $Password
    )

    $Conn = New-Object System.Data.SqlClient.SqlConnection;
    $Conn.ConnectionString = "Server=" + $ServerName + ";Database=" + $DBName + ";User Id=" + $UserName + ";Password=" + $Password;
    $Conn.Open();
    return $conn;
}

function Execute-Stored-Procedure()
{
    param (
        [Parameter(Mandatory = $true)]
        [string]
        $StoredProcedureName,

        [Parameter(Mandatory = $true)]
        [string] 
        $DBConnection, 

        [Parameter(Mandatory = $true)]
        [string]
        $Parameters
    )

    $SQLCmd = New-Object System.Data.SqlClient.SqlCommand;
    $SQLCmd.CommandType = [System.Data.CommandType]::StoredProcedure;
    $SQLCmd.Connection = $DBConnection;
    $SQLCmd.CommandText = $StoredProcedureName;

    foreach($Key in $Parameters.Keys) {
        $SQLCmd.Parameters.Add($Key, $Parameters[$Key]);
    }


    $ADP = New-Object System.Data.SqlClient.SqlDataAdapter $SQLCmd;
    $Data = New-Object System.Data.DataSet;
    $ADP.Fill($Data) | Out-Null;

    $SQLCmd.Dispose();

    return $Data
}
#>> END OF DB Functions

#<< SP FUNCTIONS
function Ensure-User() {
    param(
        [Parameter(Mandatory = $true)]
        [Microsoft.SharePoint.SPWeb]
        $Web,
        [Parameter(Mandatory = $true)]
        [string]
        $UserLoginName
    )

    $User = $null;
    try
    {
        [string]$TrustedIdentityTokenIssuer = "ADFS Staging"
        $Claim = New-SPClaimsPrincipal -TrustedIdentityTokenIssuer $TrustedIdentityTokenIssuer -Identity $UserLoginName;
        $User = $Web.EnsureUser($claim.ToEncodedString());        
    }
    catch
    {
        $Message = "$UserLoginName cannont be resolved." + $_.Exception.Message;
        WriteToLog -message $Message -section "SP" -category "ERROR";
    }
    return $User;
}

#Get Sharepoint list items using CAML Query
function Get-SPListItems() {
    param (
        [Parameter(Mandatory = $true)]
        [string]
        $WebUrl, 

        [Paramteter(Mandatory = $true)]
        [string]
        $ListName, 

        [Parameter(Mandatroy = $true)]
        [Microsoft.Sharepoint.SPQuery]
        $SPQuery
    )

    $ListItems = $null;
    try
    {
        $Web = Get-SPWeb -Identity $WebUrl;
        $List = $Web.Lists[$ListName];
        if($SPQuery -eq $null) 
        {
            $ListItems = $List.Items;
        }
        else
        {       
            $ListItems = $List.GetItems($SPQuery);
        }
    }
    catch
    {
        $ListItems = $null;
    }

    return $ListItems;
}

function Assign-Unique-Permissions-On-Folder() {
    param(
        [Parameter(Mandatory = $true)]
        [Microsoft.SharePoint.SPFolder]
        $SPFolder
    )

    $Processed = $true

    try
    {
        if($SPFolder.Item.HasUniqueRoleAssignments -eq $false)
        {
            $SPFolder.Item.BreakRoleInheritance($false)
        }
    }
    catch
    {
        $Processed = $false

        $message = "Failed while assigning unique permissions to folder.Error: " + $_.Exception.Message 
        Write-To-Console -message $message -section $CONFIG.LOGGING.SECTIONS.SP -category $CONFIG.LOGGING.CATEGORIES.ERROR

    }

    return $Processed
}

function Assign-Unique-Permissions-On-List() {
    param(
        [Parameter(Mandatory = $true)]
        [Microsoft.SharePoint.SPList]
        $SPList
    )

    $Processed = $true

    try
    {
        if($SPList.HasUniqueRoleAssignments -eq $false)
        {
            $SPList.BreakRoleInheritance($false)
        }
    }
    catch
    {
        $Processed = $false

        $message = "Failed while assigning unique permissions to list: '" + $SPList.Title + "'.Error: " + $_.Exception.Message 
        Write-To-Console -message $message -section $CONFIG.LOGGING.SECTIONS.SP -category $CONFIG.LOGGING.CATEGORIES.ERROR

    }

    return $Processed
}

function Create-SPGroup() {
    param(
       [Parameter(Mandatory = $true)]
       [Microsoft.SharePoint.SPWeb]
       $SPWeb,
       
       [Parameter(Mandatory = $true)]
       [string]
       $Group_Name,
       
       [Parameter(Mandatory = $true)]
       [Microsoft.SharePoint.SPUser]
       $Owner,

       [Parameter(Mandatory = $true)]
       [Microsoft.SharePoint.SPUser]
       [AllowNull()]
       $Default_Member,

       [Parameter(Mandatory = $true)]
       [string]
       $Description
    )

    $SPGroup = $null

    try
    {
        $SPGroup = $SPWeb.SiteGroups[$Group_Name]

        if($SPGroup -eq $null)
        {
            $SPWeb.SiteGroups.Add($Group_Name, $Owner, $Default_Member, $Description)

            $message = "Created group '" + $Group_Name + "'"
            Write-To-Console -message $message -section $CONFIG.LOGGING.SECTIONS.SP -category $CONFIG.LOGGING.CATEGORIES.INFO

            $SPGroup = $SPWeb.SiteGroups[$Group_Name]
        }
    }
    catch
    {
        $message = "Failed while creating group: '" + $Group_Name + "'. Error: '" + $_.Exception.Message + "'"
        Write-To-Console -message $message -section $CONFIG.LOGGING.SECTIONS.SP -category $CONFIG.LOGGING.CATEGORIES.ERROR
    }

    return $SPGroup
}

function Assign-Group-List-Permissions() {
    param(
        [Parameter(Mandatory = $true)]
        [Microsoft.SharePoint.SPList]
        $SPList,

        [Parameter(Mandatory = $true)]
        [Microsoft.SharePoint.SPGroup]
        $SPGroup,

        [Parameter(Mandatory = $true)]
        [string]
        $Permission_Level
    )

    $Processed = $true;

    try {
        $SPWeb = Get-SPWeb -Identity $SPList.ParentWeb.Url

        $SPRoleAssignement = New-Object Microsoft.SharePoint.SPRoleAssignment($SPGroup)
        $SPRoleDefinition = $SPWeb.RoleDefinitions[$Permission_Level]
        $SPRoleAssignement.RoleDefinitionBindings.Add($SPRoleDefinition)
        $SPList.RoleAssignments.Add($SPRoleAssignement)
        $SPList.Update()

        $Message = "Assigned '" + $Permission_Level + "' to '" + $SPGroup.Name + "' on '" + $SPList.Title + "'"
        Write-To-Console -message $Message -section $CONFIG.LOGGING.SECTIONS.SP -category $CONFIG.LOGGING.CATEGORIES.INFO
    }
    catch {
        $Processed = $false

        $Message = "Error occured while assigning permissions on '" + $SPList.Title + "' " + " to: '" + $SPGroup.Name + "'. Error: " + $_.Exception.Message
        Write-To-Console -message $Message -section $CONFIG.LOGGING.SECTIONS.SP -category $CONFIG.LOGGING.CATEGORIES.ERROR 
    }

    return $Processed
}

function Assign-Group-Folder-Permission() {
    param(
        [Parameter(Mandatory = $true)]
        [Microsoft.SharePoint.SPFolder]
        $SPFolder,

        [Parameter(Mandatory = $true)]
        [Microsoft.SharePoint.SPGroup]
        $SPGroup,


        [Parameter(Mandatory = $true)]
        [string]
        $Permission_Level
    )

    $Processed = $true

    try
    {
        $SPWeb = Get-SPWeb -Identity $SPFolder.ParentWeb.Url.ToString()

        $SPRoleAssignement = New-Object Microsoft.SharePoint.SPRoleAssignment($SPGroup)
        $SPRoleDefinition = $SPWeb.RoleDefinitions[$Permission_Level]
        $SPRoleAssignement.RoleDefinitionBindings.Add($SPRoleDefinition)
        $SPFolder.Item.RoleAssignments.Add($SPRoleAssignement)
        $SPFolder.Item.Update()

        $Message = "Assigned permissions on folder to group: '" + $SPGroup.Name + "'"
        Write-To-Console -message $Message -section $CONFIG.LOGGING.SECTIONS.SP -category $CONFIG.LOGGING.CATEGORIES.INFO
    }
    catch
    {
        $Processed = $false

        $Message = "Failed to assign permissions on folder to group: '" + $SPGroup.Name + "'. Error: " + $_.Exception.Message
        Write-To-Console -message $Message -section $CONFIG.LOGGING.SECTIONS.SP -category $CONFIG.LOGGING.CATEGORIES.ERROR 
    }

    return $Processed
}

function Assign-User-Folder-Permission() {
    param(
        [Parameter(Mandatory = $true)]
        [Microsoft.SharePoint.SPFolder]
        $SPFolder,

        [Parameter(Mandatory = $true)]
        [Microsoft.SharePoint.SPUser]
        $SPUser,


        [Parameter(Mandatory = $true)]
        [string]
        $Permission_Level
    )

    $Processed = $true

    try
    {
        $SPWeb = Get-SPWeb -Identity $SPFolder.ParentWeb.Url.ToString()

        $SPRoleAssignement = New-Object Microsoft.SharePoint.SPRoleAssignment($SPUser)
        $SPRoleDefinition = $SPWeb.RoleDefinitions[$Permission_Level]
        $SPRoleAssignement.RoleDefinitionBindings.Add($SPRoleDefinition)
        $SPFolder.Item.RoleAssignments.Add($SPRoleAssignement)
        $SPFolder.Item.Update()

        $Message = "Assigned permissions on folder to user: '" + $SPUser.DisplayName + "'"
        Write-To-Console -message $Message -section $CONFIG.LOGGING.SECTIONS.SP -category $CONFIG.LOGGING.CATEGORIES.INFO 
    }
    catch
    {
        $Processed = $false

        $Message = "Failed to assign permissions on folder to user: '" + $SPUser.Email + "'. Error: " + $_.Exception.Message
        Write-To-Console -message $Message -section $CONFIG.LOGGING.SECTIONS.SP -category $CONFIG.LOGGING.CATEGORIES.ERROR 
    }

    return $Processed
}

function Remove-User-Folder-Permissions() {
    param(
        [Parameter(Mandatory = $true)]
        [Microsoft.SharePoint.SPFolder]
        $SPFolder,

        [Parameter(Mandatory = $true)]
        [Microsoft.SharePoint.SPUser]
        $SPUser
    )

    $Processed = $true;

    try
    {
         $Role_Assignments = $SPFolder.Item.RoleAssignments

         foreach($Role_Assignment in $Role_Assignments)
         {
            $Member = $Role_Assignment.Member;

            if($Member.GetType().Name -eq "SPUser" -and $Member.Email -eq $SPUser.Email)
            {
                RemoveAll-RoleBindings -RoleAssignment $Role_Assignment
            }
         }
    }
    catch
    {
        $Processed = $false
        $message = "Failed to remove folder permissions for user: '" + $SPUser.Email + "'"
        Write-To-Console -message $message -section $CONFIG.LOGGING.SECTIONS.SP -category $CONFIG.LOGGING.CATEGORIES.ERROR
    }

    return $Processed
}
#>> END OF SP FUNCTIONS
