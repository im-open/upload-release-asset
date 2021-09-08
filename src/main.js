const core = require('@actions/core');
const { GitHub } = require('@actions/github');
const fs = require('fs');

const requiredArgOptions = {
  required: true,
  trimWhitespace: true
};

const token = core.getInput('github-token', requiredArgOptions);
const uploadUrl = core.getInput('upload-url', requiredArgOptions);
const assetPath = core.getInput('asset-path', requiredArgOptions);
const assetName = core.getInput('asset-name', requiredArgOptions);
const assetContentType = core.getInput('asset-content-type', requiredArgOptions);

const github = new GitHub(token);

async function run() {
  try {
    core.info(`Starting upload of ${assetName}...`);

    const contentLength = filePath => fs.statSync(filePath).size; // Calculates content-length for file passed in.  Used in header to upload asset.

    // Setup headers for API call, see Octokit Documentation: https://octokit.github.io/rest.js/#octokit-routes-repos-upload-release-asset for more information
    const headers = {
      'content-type': assetContentType,
      'content-length': contentLength(assetPath)
    };

    // Upload a release asset
    // API Documentation: https://developer.github.com/v3/repos/releases/#upload-a-release-asset
    // Octokit Documentation: https://octokit.github.io/rest.js/#octokit-routes-repos-upload-release-asset
    const uploadAssetResponse = await github.repos.uploadReleaseAsset({
      url: uploadUrl,
      headers,
      name: assetName,
      data: fs.readFileSync(assetPath)
    });

    // Get the browser_download_url for the uploaded release asset from the response
    const {
      data: { browser_download_url: browserDownloadUrl }
    } = uploadAssetResponse;

    // Set the output variable for use by other actions: https://github.com/actions/toolkit/tree/master/packages/core#inputsoutputs
    core.setOutput('asset-browser-download-url', browserDownloadUrl);
    core.info(`Finished uploading ${assetName} to the release.`);
  } catch (error) {
    core.setFailed(`An error occurred uploading the asset: ${error.message}`);
  }
}
run();
