const fs = require("fs");
const {google} = require('googleapis');

const CONTAINING_FOLDER_ID = '1STeeU8X3gH0OHDtS9ia_jjmBUI8V3lks';

const scopes = [
  'https://www.googleapis.com/auth/drive'
];

const credentials = require('./credentials.json');

const auth = new google.auth.JWT(
  credentials.client_email, null,
  credentials.private_key, scopes
);

const drive = google.drive({ version: "v3", auth });

function uploadFileToDrive(filename, folderId) {

  var fileMetadata = {
    'name': filename,
    parents: [folderId]
  };
  var media = {
    mimeType: 'application/pdf',
    body: fs.createReadStream(filename)
  };
  return drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id'
  });
}

async function createFolder(folderName) {

  var fileMetadata = {
    'name': folderName,
    'mimeType': 'application/vnd.google-apps.folder',
    'parents': [CONTAINING_FOLDER_ID]
  };
  return drive.files.create({
    
    resource: fileMetadata,
    fields: 'id'
  })
  .then( (response) => {

    return response.data.id;
  });
}

// returns link
async function addSignedPODocToDrive(filePath, folderName, targetFileName) {

  var folderID = await createFolder(folderName);

  uploadFileToDrive(targetFileName, folderID);

  return "https://drive.google.com/drive/folders/" + folderID;
}

module.exports = { addSignedPODocToDrive };