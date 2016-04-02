'use strict';

class GoogleDriveFileStore {

    constructor(fileName, authorizedState) {
        this._fileName = fileName;
        this._authorizedState = authorizedState;
        this.updates = new DataSequence();

        authorizedState.onChange((state) => {
            if (state == "AUTHORIZED") {
                this._load().then( (data) => {
                    this.updates.add(data.body);
                });
            }
        })
    }

    get name() {
        return this._fileName;
    }

    _load() {
        return this._loadDriveApi().then( () => {
            return gapi.client.drive.files.list({
                fields: "files(id, name)",
                q: `name='${this._fileName}'`
            });
        }).then( (fileData) => {
            let fileId = fileData.result.files[0].id;
            return gapi.client.drive.files.get({
                fileId,
                alt: "media"
            })
        });
    }

    save(data) {
        if (this._authorizedState.value == "AUTHORIZED") {
            console.log("Saving data to Drive file", this._fileName);
            this._loadDriveApi().then( () => {
                this._saveDataToDrive(data) }
            ).then( () => console.log("Saved data") );
        } else {
            console.warn("Cannot save data - not authorized");
        }
    }

    _loadDriveApi() {
        return gapi.client.load('drive', 'v3');
    }

    _saveDataToDrive(data) {
        var request = gapi.client.drive.files.list({
            fields: "files(id, name)",
            q: `name='${this._fileName}'`
        });

        return request.then(function(fileData) {
            let fileId = fileData.result.files[0].id;
            let accessToken = gapi.auth.getToken().access_token;
            return new Promise(function(resolve, reject) {
                $.ajax(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
                    method: "PATCH",
                    contentType: "application/json",
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    },
                    data: data,
                    success: resolve,
                    error: reject
                })
            })
        });

    }
}