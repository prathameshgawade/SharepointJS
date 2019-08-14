/**
 * 
 */
var $SP = Window.$SP || {};
(function () {
    //<<< Start of Private Functions region

    /**
     * Reads the input file as Buffer Array
     * @param { File } file
     * @returns { Promise } 
     */
    function _getFileBuffer(file) {
        var deferred = $.Deferred();
        var reader = new FileReader();

        reader.onload = function (e) {
            deferred.resolve(e.target.result);
        }

        reader.onerror = function (e) {
            deferred.reject(e.target.error);
        }

        reader.readAsArrayBuffer(file);

        return deferred.promise();
    }

    // End of Private Functions region >>>

    // Init commonly used prototype functions
    (function () {
        // String Format
        if (typeof String.prototype.format !== 'function') {
            String.prototype.format = function (args) {
                var a = this;
                for (var k in arguments) {
                    a = a.replace(new RegExp("\\{" + k + "\\}", 'g'), arguments[k]);
                }
                return a
            };
        }
    })()

    $SP.Configuration = {
        RESULT_METADATA: {
            VERBOSE: "application/json; odata=verbose",
            MINIMAL_METADATA: "application/json; odata=minimalmetadata",
            NO_METADATA: "application/json; odata=nometadata"
        },
        CHECKIN_TYPE: {
            MINOR_CHECKIN: 0,
            MAJOR_CHECKIN: 1,
            OVER_WRITE_CHECKIN: 2
        }
    }

    $SP.HTTP = function () {
        function Get(url, acceptFormat) {
            var deferred = $.Deferred();
            acceptFormat = acceptFormat || $SP.Configuration.RESULT_METADATA.VERBOSE;

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

        function Post(url, data) {
            var deferred = $.Deferred();
            var acceptFormat = $SP.Configuration.RESULT_METADATA.VERBOSE;

            $.ajax({
                url: url,
                type: "POST",
                headers: {
                    "accept": acceptFormat,
                    "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                    "content-Type": $SP.Configuration.RESULT_METADATA.VERBOSE
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
            var acceptFormat = $SP.Configuration.RESULT_METADATA.VERBOSE;
            etag = etag || "*";

            $.ajax({
                url: url,
                type: "POST",
                headers: {
                    "accept": acceptFormat,
                    "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                    "content-Type": $SP.Configuration.RESULT_METADATA.VERBOSE,
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

        function Delete(url, etag) {
            var deferred = $.Deferred();
            var acceptFormat = $SP.Configuration.RESULT_METADATA.VERBOSE;
            etag = etag || "*";

            $.ajax({
                url: url,
                type: "DELETE",
                headers: {
                    "accept": acceptFormat,
                    "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                    "If-Match": etag
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
            Get: Get,
            Post: Post,
            Update: Update,
            Delete: Delete
        }
    }();

    $SP.List = function () {
        function _getAllItems(url, data) {
            var def = $.Deferred();
            var data = data || [];

            $SP.HTTP.Get(url, $SP.Configuration.RESULT_METADATA.NO_METADATA)
                .done(function (response) {
                    console.log(response);
                    if (response.value && response.value.length > 0) {
                        data = $.merge(data, response.value);
                    }

                    // Recursion
                    if (response['odata.nextLink']) {
                        _getAllItems(response['odata.nextLink'], data)
                            .done(function (response1) {
                                def.resolve(response1);
                            })
                            .fail(function (error) {
                                def.reject(error);
                            });
                    } else {
                        def.resolve(data);
                    }
                })
                .fail(function (error) {
                    def.reject(error);
                })

            return def.promise();
        }

        /**
         * Gets list items with url for next item results, filtered according to query string 
         * @param {string} listName 
         * @param {string} queryString 
         * @returns {Promise}
         */
        function GetItems(listName, queryString) {
            var def = $.Deferred();
            var url = "{0}/_api/web/lists/getByTitle('{1}')/items{2}";
            url = url.format(_spPageContextInfo.webAbsoluteUrl, listName, (queryString ? queryString : ""));

            $SP.HTTP.Get(url, $SP.Configuration.RESULT_METADATA.NO_METADATA)
                .done(function (response) {
                    if (response && response.value)
                        def.resolve(response.value);
                    else
                        def.resolve([]);
                })
                .fail(function (error) {
                    def.reject(error);
                });

            return def.promise();
        }

        /**
         * Gets all list items filtered according to query string
         * @param {string} listName 
         * @param {string} queryString 
         * @returns {Promise}
         */
        function GetAllItems(listName, queryString) {
            var url = "{0}/_api/web/lists/getByTitle('{1}')/items{2}";
            url = url.format(_spPageContextInfo.webAbsoluteUrl, listName, (queryString ? queryString : ""));

            return _getAllItems(url);
        }

        /**
         * Returns Particular List Item
         * @param {string} listName Name of the list
         * @param {number} id ID of the list item to be returned
         * @returns {Promise}
         */
        function GetItem(listName, id, queryString) {
            var def = $.Deferred();
            var url = "{0}/_api/web/lists/getByTitle('{1}')/items({2}){3}";
            url = url.format(_spPageContextInfo.webAbsoluteUrl, listName, id, (queryString ? queryString : ""));

            $SP.HTTP.Get(url, $SP.Configuration.RESULT_METADATA.NO_METADATA)
                .done(function (response) {
                    def.resolve(response);
                })
                .fail(function (error) {
                    def.reject(error);
                });

            return def.promise();
        }

        /**
         * Adds list item
         * @param {string} listName 
         * @param {object} data 
         * @returns {Promise}
         */
        function AddItem(listName, data) {
            var def = $.Deferred();

            //Get List Item Entity Type Name
            var url = "{0}/_api/web/lists/getByTitle('{1}')";
            url = url.format(_spPageContextInfo.webAbsoluteUrl, listName);
            $SP.HTTP.Get(url, $SP.Configuration.RESULT_METADATA.NO_METADATA)
                .done(function (response) {
                    data["__metadata"] = {
                        type: response.ListItemEntityTypeFullName
                    };

                    // Add List Item
                    url = "{0}/_api/web/lists/getByTitle('{1}')/items";
                    url = url.format(_spPageContextInfo.webAbsoluteUrl, listName);
                    $SP.HTTP.Post(url, data)
                        .done(function (response) {
                            def.resolve(response)
                        })
                        .fail(function (error) {
                            def.reject(error)
                        });
                })
                .fail(function (error) {
                    deferred.reject(error);
                })

            return def.promise();
        }

        /**
         * Updates list item
         * @param {string} listName 
         * @param {number} id 
         * @param {object} data 
         * @param {string} etag 
         * @returns {Promise}
         */
        function UpdateItem(listName, id, data, etag) {
            var def = $.Deferred();
            etag = etag || "*";

            //Get List Item Entity Type Name
            var url = "{0}/_api/web/lists/getByTitle('{1}')";
            url = url.format(_spPageContextInfo.webAbsoluteUrl, listName);
            $SP.HTTP.Get(url, $SP.Configuration.RESULT_METADATA.NO_METADATA)
                .done(function (response) {
                    data["__metadata"] = {
                        type: response.ListItemEntityTypeFullName
                    };

                    // Update List Item
                    var url = "{0}/_api/web/lists/getByTitle('{1}')/items({2})";
                    url = url.format(_spPageContextInfo.webAbsoluteUrl, listName, id);
                    $SP.HTTP.Update(url, data, etag)
                        .done(function (response) {
                            def.resolve(response)
                        })
                        .fail(function (error) {
                            def.reject(error)
                        });
                })
                .fail(function (error) {
                    deferred.reject(error);
                });

            return def.promise();
        }

        /**
         * Deletes list item
         * @param {string} listName 
         * @param {number} id 
         * @param {string} etag 
         */
        function DeleteItem(listName, id, etag) {
            var def = $.Deferred();
            var url = "{0}/_api/web/lists/getByTitle('{1}')/items({2})";
            url = url.format(_spPageContextInfo.webAbsoluteUrl, listName, id);

            $SP.HTTP.Delete(url, etag)
                .done(function (response) {
                    def.resolve(response)
                })
                .fail(function (error) {
                    def.reject(error)
                });

            return def.promise();
        }

        /**
         * Adds input file as list item attachment
         * @param {string} listName 
         * @param {number} id 
         * @param {File} file 
         * @param {string} fileName 
         * @returns {Promise}
         */
        function AddAttachement(listName, id, file, fileName) {
            var def = $.Deferred();

            _getFileBuffer(file)
                .then(function (buffer) {
                    var url = "{0}/_api/web/lists/getByTitle('{1}')/items({2})/AttachmentFiles/add(FileName='{3}')";
                    url = url.format(_spPageContextInfo.webAbsoluteUrl, listName, id, fileName);

                    $SP.HTTP.Post(url, buffer)
                        .done(function (response) {
                            def.resolve(response)
                        })
                        .fail(function (error) {
                            def.reject(error)
                        });
                });

            return def.promise();
        }

        function GetAttachements(listName, id) {
            var def = $.Deferred();

            var url = "{0}/_api/web/lists/getByTitle('{1}')/items({2})/AttachmentFiles";
            url = url.format(_spPageContextInfo.webAbsoluteUrl, listName, id);

            $SP.HTTP.Get(url, $SP.Configuration.RESULT_METADATA.NO_METADATA)
                .done(function (response) {
                    if (response && response.value) {
                        def.resolve(response.value)
                    } else {
                        def.resolve([]);
                    }
                })
                .fail(function (error) {
                    def.reject(error)
                });

            return def.promise();
        }

        function DeleteAttachment(listName, id, fileName) {
            var def = $.Deferred();

            var url = "{0}/_api/web/lists/getByTitle('{1}')/items({2})/AttachmentFiles/getByFileName('{3}')";
            url = url.format(_spPageContextInfo.webAbsoluteUrl, listName, id, encodeURIComponent(fileName));

            $SP.HTTP.Delete(url)
                .done(function (response) {
                    def.resolve(response)
                })
                .fail(function (error) {
                    def.reject(error)
                });

            return def.promise();
        }

        return {
            GetItems: GetItems,
            GetAllItems: GetAllItems,
            GetItem: GetItem,
            AddItem: AddItem,
            UpdateItem: UpdateItem,
            DeleteItem: DeleteItem,
            AddAttachement: AddAttachement,
            GetAttachements: GetAttachements,
            DeleteAttachment: DeleteAttachment
        }
    }();

    $SP.Document = function () {
        function Get(fileServerRelativeURL, acceptFormat) {
            var url = "{0}/_api/web/GetFileByServerRelativeUrl('{1}')";
            url = url.format(_spPageContextInfo.webAbsoluteUrl, fileServerRelativeURL);

            acceptFormat = acceptFormat || $SP.Configuration.RESULT_METADATA.VERBOSE;

            return $SP.HTTP.Get(url, acceptFormat);
        }

        function GetData(fileServerRelativeURL, acceptFormat) {
            var url = "{0}/_api/web/GetFileByServerRelativeUrl('{1}')/$value";
            url = url.format(_spPageContextInfo.webAbsoluteUrl, fileServerRelativeURL);

            acceptFormat = acceptFormat || $SP.Configuration.RESULT_METADATA.VERBOSE;

            return $SP.HTTP.Get(url, acceptFormat);
        }

        function GetVersions(fileServerRelativeURL) {
            var url = "{0}/_api/web/GetFileByServerRelativeUrl('{1}')/versions";
            url = url.format(_spPageContextInfo.webAbsoluteUrl, fileServerRelativeURL);

            return $SP.HTTP.Get(url);
        }

        function GetVersion(fileServerRelativeURL, versionID) {
            var url = "{0}/_api/web/GetFileByServerRelativeUrl('{1}')/versions({2})";
            url = url.format(_spPageContextInfo.webAbsoluteUrl, fileServerRelativeURL, versionID);

            return $SP.HTTP.Get(url);
        }

        function CheckOut(fileServerRelativeURL) {
            var url = "{0}/_api/web/GetFileByServerRelativeUrl('{1}')/CheckOut()",
                url = url.format(_spPageContextInfo.webAbsoluteUrl, fileServerRelativeURL);

            return $SP.HTTP.Post(url);
        }

        function DiscardCheckOut(fileServerRelativeURL) {
            var url = "{0}/_api/web/GetFileByServerRelativeUrl('{1}')/undocheckout()",
                url = url.format(_spPageContextInfo.webAbsoluteUrl, fileServerRelativeURL);

            return $SP.HTTP.Post(url);
        }

        function CheckIn(fileServerRelativeURL, comments, checkInType) {
            comments = comments || "";
            checkInType = $SP.Common.IsNullOrUndefined(checkInType) ? $SP.Configuration.CHECKIN_TYPE.MINOR_CHECKIN : checkInType;

            var url = "{0}/_api/web/GetFileByServerRelativeUrl('{1}')/CheckIn(comment='{2}',checkintype={3})";
            url = url.format(_spPageContextInfo.webAbsoluteUrl, fileServerRelativeURL, comments, checkInType);

            return $SP.HTTP.Post(url);
        }

        function Delete(fileServerRelativeURL, etag) {
            var def = $.Deferred();

            var url = "{0}/_api/web/GetFileByServerRelativeUrl('{1}')";
            url = url.format(_spPageContextInfo.webAbsoluteUrl, fileServerRelativeURL);
            etag = etag || "*";

            $SP.HTTP.Delete(url, etag)
                .done(function (response) {
                    def.resolve(response);
                })
                .fail(function (error) {
                    def.reject(error);
                });

            return def.promise();
        }

        function UpdateContentType(fileServerRelativeURL, contentTypeName) {

        }

        function UpdateMetadata(fileServerRelativeURL, data) {

        }

        return {
            Get: Get,
            GetData: GetData,
            GetVersions: GetVersions,
            GetVersion: GetVersion,
            CheckOut: CheckOut,
            DiscardCheckOut: DiscardCheckOut,
            CheckIn: CheckIn,
            Delete: Delete,
            UpdateContentType: UpdateContentType,
            UpdateMetadata: UpdateMetadata
        }
    }();

    $SP.Folder = function () {
        function Get(folderServerRelativeURL, acceptFormat) {
            var def = $.Deferred();

            var url = "{0}/_api/web/GetFolderByServerRelativeUrl('{1}')";
            url = url.format(_spPageContextInfo.webAbsoluteUrl, folderServerRelativeURL);

            acceptFormat = acceptFormat || $SP.Configuration.RESULT_METADATA.NO_METADATA;

            $SP.HTTP.Get(url)
                .done(function (response) {
                    def.resolve(response)
                })
                .fail(function (error) {
                    def.reject(error)
                });

            return def.promise();
        }

        function Rename(folderServerRelativeURL, name) {
            var def = $.Deferred();

            var url = "{0}/_api/web/GetFolderByServerRelativeUrl('{1}')/ListItemAllFields";
            url = url.format(_spPageContextInfo.webAbsoluteUrl, folderServerRelativeURL);

            // GET Folder Entity Type Name
            $SP.HTTP.Get(url, $SP.Configuration.RESULT_METADATA.MINIMAL_METADATA)
                .done(function (response) {
                    // Rename Folder
                    var data = {
                        "__metadata": {
                            "type": response["odata.type"]
                        },
                        "Title": name,
                        "FileLeafRef": name
                    }

                    $SP.HTTP.Update(url, data)
                        .done(function (response) {
                            def.resolve(response);
                        })
                        .fail(function (error) {
                            def.reject(error);
                        })
                })
                .fail(function (error) {
                    def.reject(error);
                });

            return def.promise();
        }

        function AddFolder(folderServerRelativeURL, folderName) {
            var def = $.Deferred();

            var url = "{0}/_api/web/folders";
            url = url.format(_spPageContextInfo.webAbsoluteUrl);

            var data = {
                '__metadata': {
                    'type': 'SP.Folder'
                },
                'ServerRelativeUrl': "{0}/{1}".format(folderServerRelativeURL, folderName)
            }

            $SP.HTTP.Post(url, data)
                .done(function (response) {
                    def.resolve(response)
                })
                .fail(function (error) {
                    def.reject(error)
                });

            return def.promise();
        }

        function AddFile(folderServerRelativeURL, file, fileName, override) {
            var def = $.Deferred();

            override = override || false;
            var url = "{0}/_api/web/GetFolderByServerRelativeUrl('{1}')/Files/add(url='{2}',overwrite={3})";
            url = url.format(_spPageContextInfo.webAbsoluteUrl, folderServerRelativeURL, fileName, override);

            _getFileBuffer(file)
                .then(function (buffer) {
                    $SP.HTTP.Post(url, buffer)
                        .done(function (response) {
                            def.resolve(response);
                        })
                        .fail(function (error) {
                            def.reject(error);
                        });
                });

            return def.promise();
        }

        function Delete(folderServerRelativeURL) {
            var def = $.Deferred();

            var url = "{0}/_api/web/GetFolderByServerRelativeUrl('{1}')";
            url = url.format(_spPageContextInfo.webAbsoluteUrl, folderServerRelativeURL);

            $SP.HTTP.Delete(url)
                .done(function (response) {
                    def.resolve(response);
                })
                .fail(function (error) {
                    def.reject(error);
                });

            return def.promise();
        }

        function GetFolders(folderServerRelativeURL) {
            var def = $.Deferred();

            var url = "{0}/_api/web/GetFolderByServerRelativeUrl('{1}')/Folders";
            url = url.format(_spPageContextInfo.webAbsoluteUrl, folderServerRelativeURL);

            $SP.HTTP.Get(url, $SP.Configuration.RESULT_METADATA.NO_METADATA)
                .done(function (response) {
                    if (response && response.value) {
                        def.resolve(response.value)
                    } else {
                        def.resolve([]);
                    }
                })
                .fail(function (error) {
                    def.reject(error)
                });

            return def.promise();
        }

        function GetFiles(folderServerRelativeURL) {
            var def = $.Deferred();

            var url = "{0}/_api/web/GetFolderByServerRelativeUrl('{1}')/Files";
            url = url.format(_spPageContextInfo.webAbsoluteUrl, folderServerRelativeURL);

            $SP.HTTP.Get(url, $SP.Configuration.RESULT_METADATA.NO_METADATA)
                .done(function (response) {
                    if (response && response.value) {
                        def.resolve(response.value)
                    } else {
                        def.resolve([]);
                    }
                })
                .fail(function (error) {
                    def.reject(error)
                });

            return def.promise();
        }

        return {
            Get: Get,
            Rename: Rename,
            AddFolder: AddFolder,
            AddFile: AddFile,
            Delete: Delete,
            GetFolders: GetFolders,
            GetFiles: GetFiles
        }
    }();

    $SP.User = function () {
        function Ensure(loginName) {
            var data = {
                'logonName': loginName
            };

            var url = "{0}/_api/web/ensureuser";
            url = url.format(_spPageContextInfo.webAbsoluteUrl);

            return $SP.HTTP.Post(url, data);
        }

        function GetInfo(userId) {
            var url = "{0}/_api/Web/GetUserById({1})";
            url = url.format(_spPageContextInfo.webAbsoluteUrl, userId);

            return $SP.HTTP.Get(url, $SP.Configuration.RESULT_METADATA.NO_METADATA);
        }

        function GetGroupMemberships(userId) {
            var def = $.Deferred();

            var url = "{0}/_api/Web/GetUserById({1})/Groups";
            url = url.format(_spPageContextInfo.webAbsoluteUrl, userId);

            $SP.HTTP.Get(url, $SP.Configuration.RESULT_METADATA.NO_METADATA)
                .done(function (response) {
                    var result = (response && response.value) ? response.value : [];
                    def.resolve(result);
                })
                .fail(function (error) {
                    def.reject(error);
                });

            return def.promise();
        }

        return {
            Ensure: Ensure,
            GetInfo: GetInfo,
            GetGroupMemberships: GetGroupMemberships
        }
    }();

    $SP.Groups = function () {
        function AddUserToGroup(groupName, userID) {

        }

        function RemoveUserFromGroup(groupName, userID) {

        }

        return {
            AddUserToGroup: AddUserToGroup,
            RemoveUserFromGroup: RemoveUserFromGroup
        }
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

        function GenerateRandomAlphaNum(len) {
            var rdmString = "";
            for (; rdmString.length < len; rdmString += Math.random().toString(36).substr(2));
            return rdmString.substr(0, len);
        }

        function ConvertDateTOISO(date) {
            return ((date instanceof Date) ? date.toISOString() : new Date(date).toISOString());
        }

        function IsNullOrUndefined(value) {
            return value == null || value == undefined;
        }

        return {
            GetNewRequestDigestValue: GetNewRequestDigestValue,
            GenerateRandomAlphaNum: GenerateRandomAlphaNum,
            ConvertDateTOISO: ConvertDateTOISO,
            IsNullOrUndefined: IsNullOrUndefined
        }
    }();

    $SP.UI = function () {
        function InitializePeoplePicker(peoplePickerElementId, AllowMultipleValues) {
            // Create a schema to store picker properties, and set the properties.  
            var schema = {};
            schema['SearchPrincipalSource'] = 15;
            schema['ResolvePrincipalSource'] = 15;
            schema['MaximumEntitySuggestions'] = 50;
            schema['Width'] = '280px';
            schema['AllowMultipleValues'] = AllowMultipleValues;
            schema['PrincipalAccountType'] = 'User';

            // Render and initialize the picker.  
            // Pass the ID of the DOM element that contains the picker, an array of initial  
            // PickerEntity objects to set the picker value, and a schema that defines  
            // picker properties.  
            window.SPClientPeoplePicker_InitStandaloneControlWrapper(peoplePickerElementId, null, schema);
        }

        function ReadPeoplePicker() {

        }

        function ClearPeoplePicker(peoplePickerElementId) {
            var peoplePicker = SPClientPeoplePicker.SPClientPeoplePickerDict[peoplePickerElementId + '_TopSpan'];
            var resovledListElmId = peoplePicker.ResolvedListElementId;
            $('#' + resovledListElmId).children().each(function (index, element) {
                peoplePicker.DeleteProcessedUser(element);
            });
        }

        function SetPeoplePicker(peoplePickerElementId, userLoginNames) {
            if (!$SP.Common.IsNullOrUndefined(userLoginNames)) {
                $(userLoginNames).each(function (i, userLoginName) {
                    SPClientPeoplePicker.SPClientPeoplePickerDict[peoplePickerElementId + "_TopSpan"].AddUserKeys(userLoginName);
                });
            }
        }

        function EnablePeoplePicker(peoplePickerElementId) {
            SPClientPeoplePicker.SPClientPeoplePickerDict[peoplePickerElementId + "_TopSpan"].SetEnabledState(true);
        }

        function DisablePeoplePicker(peoplePickerElementId) {
            SPClientPeoplePicker.SPClientPeoplePickerDict[peoplePickerElementId + "_TopSpan"].SetEnabledState(false);
        }

        function InitializeCascadedDropdown() {

        }

        function IntializeChoiceDropdown() {

        }

        function IntializeLookupControl() {

        }

        return {
            InitializePeoplePicker: InitializePeoplePicker,
            ClearPeoplePicker: ClearPeoplePicker,
            ReadPeoplePicker: ReadPeoplePicker,
            SetPeoplePicker: SetPeoplePicker,
            EnablePeoplePicker: EnablePeoplePicker,
            DisablePeoplePicker: DisablePeoplePicker,

            InitializeCascadedDropdown: InitializeCascadedDropdown,

            IntializeChoiceDropdown: IntializeChoiceDropdown,

            IntializeLookupControl: IntializeLookupControl
        }
    }();
})();
