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
        $Claim = New-SPClaimsPrincipal -TrustedIdentityTokenIssuer "ADFS Staging" -Identity $UserLoginName;
        $User = $Web.EnsureUser($claim.ToEncodedString());        
    }
    catch
    {
        $Message = "$UserLoginName cannont be resolved." + $_.Exception.Message;
        WriteToLog -message $Message -section "SP" -category "ERROR";
    }
    return $User;
}

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
#>> END OF SP FUNCTIONS
