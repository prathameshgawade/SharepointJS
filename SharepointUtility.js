/**
 * 
 */
(function () {
    var $SP = Window.$SP || {};

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
                var str = this;
                return str.replace(String.prototype.format.regex, function (item) {
                    var intVal = parseInt(item.substring(1, item.length - 1));
                    var replace;
                    if (intVal >= 0) {
                        replace = args[intVal];
                    } else if (intVal === -1) {
                        replace = "{";
                    } else if (intVal === -2) {
                        replace = "}";
                    } else {
                        replace = "";
                    }
                    return replace;
                });
            };
            String.prototype.format.regex = new RegExp("{-?[0-9]+}", "g");
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

        function Post(url, data) {
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
            var acceptFormat = $SP.Configuration.VERBOSE;
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

        function Delete(url, etag) {
            var deferred = $.Deferred();
            var acceptFormat = $SP.Configuration.VERBOSE;
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

            $SP.Http.Get(url, $SP.Configuration.RESULT_METADATA.NO_METADATA)
                .done(function (response) {
                    if (response.value && response.value.length > 0) {
                        data = $.merge(data, response.value);
                    }

                    // Recursion
                    if (response['odata.nextLink']) {
                        _getAllItems(response['odata.nextLink'], data)
                            .done(function (response) {
                                data = $.merge(data, response);
                                def.resolve(data);
                            })
                            .fail(function (error) {
                                def.reject(error);
                            });
                    } else {
                        def.resolve(data);
                    }
                })
                .fail(function (error) {
                    def.resolve(error);
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
            var url = "{0}/_api/web/lists/getByTitle('{1}')/items{4}";
            url = url.format(_spPageContextInfo.webAbsoluteUrl, listName, queryString ? queryString : "");

            $SP.Http.Get(url, $SP.Configuration.RESULT_METADATA.NO_METADATA)
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
            var url = "{0}/_api/web/lists/getByTitle('{1}')/items{4}";
            url = url.format(_spPageContextInfo.webAbsoluteUrl, listName, queryString ? queryString : "");

            return _getAllItems(url);
        }

        function GetItem(listName, id) {
            var def = $.Deferred();
            var url = "{0}/_api/web/lists/getByTitle('{1}')/items({2})";
            url = url.format(_spPageContextInfo.webAbsoluteUrl, listName, id);

            $SP.Http.Get(url, $SP.Configuration.RESULT_METADATA.NO_METADATA)
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
            var url = "{0}/_api/web/lists/getByTitle('{1}')/items";
            url = url.format(_spPageContextInfo.webAbsoluteUrl, listName);

            $SP.Http.Post(url, data)
                .done(function (response) {
                    def.resolve(response)
                })
                .fail(function (error) {
                    def.reject(error)
                });

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
            var url = "{0}/_api/web/lists/getByTitle('{1}')/items({2})";
            url = url.format(_spPageContextInfo.webAbsoluteUrl, listName, id);

            $SP.HTTP.Update(url, data, etag)
                .done(function (response) {
                    def.resolve(response)
                })
                .fail(function (error) {
                    def.reject(error)
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

            $SP.HTTP.Update(url, etag)
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

                    $SP.Http.Post(url, buffer)
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

            $SP.Http.Get(url, $SP.Configuration.RESULT_METADATA.NO_METADATA)
                .done(function (response) {
                    def.resolve(response)
                })
                .fail(function (error) {
                    def.reject(error)
                });

            return def.promise();
        }

        function DeleteAttachment(listName, id, fileName) {
            var def = $.Deferred();

            var url = "{0}/_api/web/lists/getByTitle('{1}')/items({2})/AttachmentFiles/getByFileName('{3}')";
            url = url.format(_spPageContextInfo.webAbsoluteUrl, listName, id, fileName);

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
        function CheckOut(fileServerRelativeURL) {
            var url = "{0}/_api/web/GetFileByServerRelativeUrl('{1}')/CheckOut()",
                url = url.format(_spPageContextInfo.webAbsoluteUrl, fileServerRelativeURL);
        }

        function DiscardCheckOut(fileServerRelativeURL) {

        }

        function CheckIn(fileServerRelativeURL, comments, checkInType) {
            var url = "{0}/_api/web/GetFileByServerRelativeUrl('{1}')/CheckIn(comment={2},checkintype={3})";
            url = url.format(_spPageContextInfo.webAbsoluteUrl, fileServerRelativeURL, comments, checkInType);

        }

        function Delete(fileServerRelativeURL) {
            var url = "{0}/_api/web/GetFileByServerRelativeUrl('{1}')";
            url = url.format(_spPageContextInfo.webAbsoluteUrl, fileServerRelativeURL);
        }

        function UpdateContentType(fileServerRelativeURL, contentTypeName) {

        }

        function UpdateMetadata(fileServerRelativeURL, data) {

        }

        return {
            CheckOut: CheckOut,
            DiscardCheckOut: DiscardCheckOut,
            CheckIn: CheckIn,
            Delete: Delete,
            UpdateContentType: UpdateContentType,
            UpdateMetadata: UpdateMetadata
        }
    }();

    $SP.Folder = function () {
        function Get(folderServerRelativeURL) {
            var def = $.Deferred();

            var url = "{0}/_api/web/GetFolderByServerRelativeUrl('{1}')";
            url = url.format(_spPageContextInfo.webAbsoluteUrl, folderServerRelativeURL);

            $SP.Http.Get(url)
                .done(function (response) {
                    def.resolve(response)
                })
                .fail(function (error) {
                    def.reject(error)
                });

            return def.promise();
        }

        function Rename(folderServerRelativeURL, name) {

        }

        function GetFile(folderServerRelativeURL, fileName) {

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

            $SP.Http.Post(url, data)
                .done(function (response) {
                    def.resolve(response)
                })
                .fail(function (error) {
                    def.reject(error)
                });

            return def.promise();
        }

        function AddFile(folderServerRelativeURL, file, fileName, override) {

        }

        function Delete(folderServerRelativeURL) {
            var def = $.Deferred();

            var url = "{0}/_api/web/GetFolderByServerRelativeUrl('{1}')";
            url = url.format(_spPageContextInfo.webAbsoluteUrl, folderServerRelativeURL);

            $SP.HTTP.Delete(url)
                .done(function (response) {
                    def.resolve(response)
                })
                .fail(function (error) {
                    def.reject(error)
                });

            return def.promise();
        }

        function GetFolders(folderServerRelativeURL) {

        }

        function GetFiles(folderServerRelativeURL) {
            var def = $.Deferred();

            var url = "{0}/_api/web/GetFolderByServerRelativeUrl('{1}')/Files";
            url = url.format(_spPageContextInfo.webAbsoluteUrl, folderServerRelativeURL);

            $SP.HTTP.Get(url)
                .done(function (response) {
                    def.resolve(response)
                })
                .fail(function (error) {
                    def.reject(error)
                });

            return def.promise();
        }

        return {
            Get: Get,
            Rename: Rename,
            GetFile: GetFile,
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

            return $SP.Http.Post(url, data);
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
    }

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

        function IntializeLookupDropdown() {

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

            IntializeLookupDropdown: IntializeLookupDropdown
        }
    }();
})();
