$SP = $SP || {};

$SP.Configuration = {
    RESULT_METADATA: {
        VERBOSE: "application/json; odata=verbose",
        MINIMAL_METADATA: "application/json; odata=minimalmetadata",
        NO_METADATA: "application/json; odata=nometadata"
    }
}

$SP.HTTP = function () {
    function Read(url, acceptFormat) {
        var deferred = $.Deferred();
        acceptFormat = acceptFormat || $SP.Configuration.VERBOSE;

        $.ajax({
            url: url,
            type: "GET",
            headers: {
                "accept": acceptFormat
            },
            success: function (response, status, xhr) {
                deferred.resolve(response);
            },
            error: function (error, status, xhr) {
                deferred.reject(error);
            }
        });

        return deferred.promise();
    }

    function Create(url, data) {
        var deferred = $.Deferred();
        var acceptFormat = $SP.Configuration.VERBOSE;

        $.ajax({
            url: url,
            type: "POST",
            headers: {
                "accept": acceptFormat,
                "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                "content-Type": $SP.Configuration.VERBOSE
            },
            data: JSON.stringify(data),
            success: function (data, status, xhr) {
                deferred.resolve(data)
            },
            error: function (error, status, xhr) {
                deferred.reject(error);
            }
        });

        return deferred.promise();
    }

    function Update(url, data, etag) {
        var deferred = $.Deferred();
        var acceptFormat = acceptFormat || $SP.Configuration.VERBOSE;
        etag = etag || "*";

        $.ajax({
            url: url,
            type: "POST",
            headers: {
                "accept": acceptFormat,
                "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                "content-Type": $SP.Configuration.VERBOSE,
                "X-Http-Method": "MERGE",
                "If-Match": etag
            },
            data: JSON.stringify(data),
            success: function (data, status, xhr) {
                deferred.resolve(data);
            },
            error: function (error, status, xhr) {
                deferred.reject(error);
            }
        });

        return deferred.promise();
    }

    function Delete(url) {
        var deferred = $.Deferred();
        var acceptFormat = acceptFormat || $SP.Configuration.VERBOSE;

        $.ajax({
            url: url,
            type: "DELETE",
            headers: {
                "accept": acceptFormat,
                "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                "If-Match": "*"
            },
            success: function (data, status, xhr) {
                deferred.resolve(data)
            },
            error: function (error, status, xhr) {
                deferred.reject(error);
            }
        });

        return deferred.promise();
    }

    return {
        Read: Read,
        Create: Create,
        Update: Update,
        Delete: Delete
    }
}();

$SP.List = function () {
    function GetItems(listName, queryString) {

    }

    function GetAllItems(listName) {

    }

    function GetItemById(listName, id) {

    }

    function AddItem(listName, data) {

    }

    function UpdateItem(listName, id, data) {

    }

    function DeleteItem(listName, id) {

    }

    function AddAttachement(listName, id, file) {

    }

    function GetAttachements(listName, id) {

    }

    function DeleteAttachment(listName, id, fileName) {

    }

    function UpdateItemContentType(listName, id, contentTypeName) {

    }

    function Start2010Workflow(listName, workflowName, itemId) {

    }

    function Start2013Workflow(listName, workflowName, itemId) {

    }

    function StopWorkflow(listName, workflowName, itemId) {

    }

    function GetContentTypes(listName) {

    }

    return {
        GetItems: GetItems,
        GetAllItems: GetAllItems,
        GetItemById: GetItemById,
        AddItem: AddItem,
        UpdateItem: UpdateItem,
        DeleteItem: DeleteItem,
        AddAttachement: AddAttachement,
        GetAttachements: GetAttachements,
        DeleteAttachment: DeleteAttachment,
        UpdateItemContentType: UpdateItemContentType,
        Start2010Workflow: Start2010Workflow,
        Start2013Workflow: Start2013Workflow,
        StopWorkflow: StopWorkflow,
        GetContentTypes: GetContentTypes
    }
}();

$SP.Document = function () {
    function Add(folderPath, file, override) {

    }

    function CheckOut(path) {

    }

    function DiscardCheckOut(path) {

    }

    function CheckIn(path, comments, publishMajorVersion) {

    }

    function Delete(path) {

    }

    function UpdateContentType(path, contentTypeName) {

    }

    function UpdateMetadata(path, data) {

    }

    return {
        Add: Add,
        CheckOut: CheckOut,
        DiscardCheckOut: DiscardCheckOut,
        CheckIn: CheckIn,
        Delete: Delete,
        UpdateContentType: UpdateContentType,
        UpdateMetadata: UpdateMetadata
    }
}();

$SP.Folder = function () {
    function Add(parentFolderPath, folderName) {

    }

    function Delete(folderPath) {

    }

    return {
        Add: Add,
        Delete: Delete
    }
}();

$SP.UI = function () {
    function InitializePeoplePicker() {

    }

    function ClearPeoplePicker() {

    }

    function ReadPeoplePicker() {

    }

    function SetPeoplePicker() {

    }

    function InitializeCascadedDropdown() {

    }

    function IntializeChoiceDropdown() {

    }

    function IntializeLookupDropdown() {

    }

    return {
        InitializePeoplePicker: InitializePeoplePicker,
        ClearPeoplePicker: ClearPeoplePicker,
        ReadPeoplePicker: ReadPeoplePicker,
        SetPeoplePicker: SetPeoplePicker,
        InitializeCascadedDropdown: InitializeCascadedDropdown,
        IntializeChoiceDropdown: IntializeChoiceDropdown,
        IntializeLookupDropdown: IntializeLookupDropdown
    }
}();

$SP.User = function () {
    function Ensure(loginName) {
        var payload = { 'logonName': loginName };
        var url = _spPageContextInfo.webAbsoluteUrl + "/_api/web/ensureuser";

        return $SP.HTTP.Create(url, payload)
    }


    return {
        Ensure: Ensure
    }
}();

$SP.Groups = function () {
    return {}
}();

$SP.Web = function () {
    return {}
}();

$SP.Site = function () {
    return {}
}();

$SP.Search = function () {
    return {}
}();

$SP.UserProfile = function () {
    return {}
}();

$SP.Common = function () {
    function GetNewRequestDigestValue() {

    }

    return {
        GetNewRequestDigestValue: GetNewRequestDigestValue
    }
}
