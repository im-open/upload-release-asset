# Tests

Force tests to run from a fork to see what happens

# upload-release-asset

This action can be used to upload an asset to the release.  This action is based on GitHub's [upload-release-asset] action which has been deprecated.  The [im-open/create-release] action can also upload a file as a release asset but this action may be used when the asset is not available when the release is created or if multiple files need to be uploaded as assets in the release.

This action needs an upload url which an [api call] will return in the response or the [im-open/create-release] action will return as an output.

## Index <!-- omit in toc -->

- [upload-release-asset](#upload-release-asset)
  - [Inputs](#inputs)
  - [Outputs](#outputs)
  - [Usage Examples](#usage-examples)
  - [Contributing](#contributing)
    - [Incrementing the Version](#incrementing-the-version)
    - [Source Code Changes](#source-code-changes)
    - [Recompiling Manually](#recompiling-manually)
    - [Updating the README.md](#updating-the-readmemd)
    - [Tests](#tests)
  - [Code of Conduct](#code-of-conduct)
  - [License](#license)

## Inputs

| Parameter            | Is Required | Description                                                                                                                                      |
|----------------------|-------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| `github-token`       | true        | A token with permission to create and delete releases.  Generally secrets.GITHUB_TOKEN.                                                          |
| `upload-url`         | true        | The URL for uploading assets to the release.  Can be taken from the outputs of an api call to create a release like in [im-open/create-release]. |
| `asset-path`         | true        | The path to the asset you want to upload.                                                                                                        |
| `asset-name`         | true        | The name of the asset you want to upload.                                                                                                        |
| `asset-content-type` | true        | The content-type of the asset you want to upload. See the [supported Media Types].                                                               |

## Outputs

| Output                       | Description                                                       |
|------------------------------|-------------------------------------------------------------------|
| `asset-browser-download-url` | URL users can navigate to in order to download the uploaded asset |

## Usage Examples

```yml
on: 
  pull_request:
    types: [opened, reopened, synchronize]

jobs:
  create-release:
    runs-on: ubuntu-latest
    outputs:
      upload_url: ${{ steps.create_release.outputs.asset-upload-url }}

    steps:
      - uses: actions/checkout@v3
        with: 
          fetch-depth: 0

      - name: Calculate next version
        id: version
        uses: im-open/git-version-lite@v2
        with:
          calculate-prerelease-version: true
          branch-name: ${{ github.head_ref }}

      - name: Create release
        id: create_release
        # You may also reference just the major or major.minor version
        uses: im-open/create-release@v3.1.1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          tag-name: ${{ steps.version.outputs.VERSION }}

  build-and-test:
    runs-on: ubuntu-latest
    needs: [create-release]
    env:
      PROJECT_ROOT: './src/MyProj'
      DEPLOY_ZIP: 'published_app.zip'
    steps:
      - name: Build, Publish and Zip App
        working-directory: ${{ env.PROJECT_ROOT }}
        run: |
          dotnet publish -c Release -o ./published_app 
          (cd published_app && zip -r ../${{env.DEPLOY_ZIP}} .)
      - name: Test
        ...
      
      - name: Upload published artifact
        uses: im-open/upload-release-asset@v1.1.3
        with: 
          github-token: ${{ secrets.GITHUB_TOKEN }}
          upload-url: ${{ needs.create-release.outputs.upload_url }}
          asset-path: ${{ env.PROJECT_ROOT }}/${{ env.DEPLOY_ZIP }}
          asset-name: ${{ env.DEPLOY_ZIP }}
          asset-content-type: application/zip
          
      

```

## Contributing

When creating PRs, please review the following guidelines:

- [ ] The action code does not contain sensitive information.
- [ ] At least one of the commit messages contains the appropriate `+semver:` keywords listed under [Incrementing the Version] for major and minor increments.
- [ ] The action has been recompiled.  See [Recompiling Manually] for details.
- [ ] The README.md has been updated with the latest version of the action.  See [Updating the README.md] for details.
- [ ] Any tests in the [build-and-review-pr] workflow are passing

### Incrementing the Version

This repo uses [git-version-lite] in its workflows to examine commit messages to determine whether to perform a major, minor or patch increment on merge if [source code] changes have been made.  The following table provides the fragment that should be included in a commit message to active different increment strategies.

| Increment Type | Commit Message Fragment                     |
|----------------|---------------------------------------------|
| major          | +semver:breaking                            |
| major          | +semver:major                               |
| minor          | +semver:feature                             |
| minor          | +semver:minor                               |
| patch          | *default increment type, no comment needed* |

### Source Code Changes

The files and directories that are considered source code are listed in the `files-with-code` and `dirs-with-code` arguments in both the [build-and-review-pr] and [increment-version-on-merge] workflows.  

If a PR contains source code changes, the README.md should be updated with the latest action version and the action should be recompiled.  The [build-and-review-pr] workflow will ensure these steps are performed when they are required.  The workflow will provide instructions for completing these steps if the PR Author does not initially complete them.

If a PR consists solely of non-source code changes like changes to the `README.md` or workflows under `./.github/workflows`, version updates and recompiles do not need to be performed.

### Recompiling Manually

This command utilizes [esbuild] to bundle the action and its dependencies into a single file located in the `dist` folder.  If changes are made to the action's [source code], the action must be recompiled by running the following command:

```sh
# Installs dependencies and bundles the code
npm run build
```

### Updating the README.md

If changes are made to the action's [source code], the [usage examples] section of this file should be updated with the next version of the action.  Each instance of this action should be updated.  This helps users know what the latest tag is without having to navigate to the Tags page of the repository.  See [Incrementing the Version] for details on how to determine what the next version will be or consult the first workflow run for the PR which will also calculate the next version.

### Tests

The build and review PR workflow includes tests which are linked to a status check. That status check needs to succeed before a PR is merged to the default branch.  When a PR comes from a branch, there should not be any issues running the tests. When a PR comes from a fork, tests may not have the required permissions or access to run since the `GITHUB_TOKEN` only has `read` access set for all scopes. Also, forks cannot access other secrets in the repository.  In these scenarios, a fork may need to be merged into an intermediate branch by the repository owners to ensure the tests run successfully prior to merging to the default branch.

## Code of Conduct

This project has adopted the [im-open's Code of Conduct](https://github.com/im-open/.github/blob/main/CODE_OF_CONDUCT.md).

## License

Copyright &copy; 2023, Extend Health, LLC. Code released under the [MIT license](LICENSE).

<!-- Links -->
[Incrementing the Version]: #incrementing-the-version
[Recompiling Manually]: #recompiling-manually
[Updating the README.md]: #updating-the-readmemd
[source code]: #source-code-changes
[usage examples]: #usage-examples
[build-and-review-pr]: ./.github/workflows/build-and-review-pr.yml
[increment-version-on-merge]: ./.github/workflows/increment-version-on-merge.yml
[esbuild]: https://esbuild.github.io/getting-started/#bundling-for-node
[git-version-lite]: https://github.com/im-open/git-version-lite
[upload-release-asset]: https://github.com/actions/upload-release-asset
[im-open/create-release]: https://github.com/im-open/create-release
[api call]: https://docs.github.com/en/rest/reference/repos#create-a-release
[supported Media Types]: https://www.iana.org/assignments/media-types/media-types.xhtml
