module.exports = async (github, core, releaseId, assetName) => {
  core.info(`\nAsserting that the '${assetName}' exists on Release '${releaseId}'.`);

  const sanitizedAssetName = assetName.replace(/\s/g, '.');
  core.info(`Asset Name: ${assetName}`);
  core.info(`Sanitized Asset Name: ${sanitizedAssetName}`);

  await github.rest.repos
    .getRelease({
      owner: 'im-open',
      repo: 'upload-release-asset',
      release_id: releaseId
    })
    .then(response => {
      const releaseAssets = response.data.assets;

      const asset = releaseAssets.find(asset => asset.name === sanitizedAssetName);
      if (asset) {
        core.info(`\tAsset '${sanitizedAssetName}' exists.`);
        core.setOutput('ACTUAL_BROWSER_DOWNLOAD_URL', asset.browser_download_url);
      } else {
        core.setFailed(`\tAsset '${sanitizedAssetName}' does not exist.`);
      }
    })
    .catch(e => {
      core.setFailed(`\tRelease '${releaseId}' does not appear to exist: ${e.message}`);
    });
};
