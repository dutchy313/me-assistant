import { google } from "googleapis";

function getGooglePrivateKey() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("GOOGLE_PRIVATE_KEY is missing");
  }

  return privateKey.replace(/\\n/g, "\n");
}

function createDriveClient() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_EMAIL is missing");
  }

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: getGooglePrivateKey(),
    scopes: ["https://www.googleapis.com/auth/drive.readonly"]
  });

  return google.drive({
    version: "v3",
    auth
  });
}

export async function listFilesInDriveFolder(folderId) {
  if (!folderId) {
    throw new Error("GOOGLE_DRIVE_FOLDER_ID is missing");
  }

  const drive = createDriveClient();

  const files = [];
  let pageToken = null;

  do {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields:
        "nextPageToken, files(id, name, mimeType, modifiedTime, size, webViewLink)",
      pageSize: 100,
      pageToken
    });

    files.push(...(response.data.files || []));
    pageToken = response.data.nextPageToken;
  } while (pageToken);

  return files;
}