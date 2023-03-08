# upload-release-asset

This action can be used to upload an asset to the release.  This action is based on GitHub's [upload-release-asset] action which has been deprecated.  The [im-open/create-release] action can also upload a file as a release asset but this action may be used when the asset is not available when the release is created or if multiple files need to be uploaded as assets in the release.

This action needs an upload url which an [api call] will return in the response or the [im-open/create-release] action will return as an output.

## Index

- [Inputs](#inputs)
- [Outputs](#outputs)
- [Usage Examples](#usage-examples)
- [Contributing](#contributing)
  - [Recompiling](#recompiling)
  - [Incrementing the Version](#incrementing-the-version)
- [Code of Conduct](#code-of-conduct)
- [License](#license)
   
## Inputs
| Parameter            | Is Required | Description                                                                                                                                      |
| -------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `github-token`       | true        | A token with permission to create and delete releases.  Generally secrets.GITHUB_TOKEN.                                                          |
| `upload-url`         | true        | The URL for uploading assets to the release.  Can be taken from the outputs of an api call to create a release like in [im-open/create-release]. |
| `asset-path`         | true        | The path to the asset you want to upload.                                                                                                        |
| `asset-name`         | true        | The name of the asset you want to upload.                                                                                                        |
| `asset-content-type` | true        | The content-type of the asset you want to upload. See the [supported Media Types].                                                               |

## Outputs
| Output                       | Description                                                       |
| ---------------------------- | ----------------------------------------------------------------- |
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
        uses: im-open/upload-release-asset@v1.1.2
        with: 
          github-token: ${{ secrets.GITHUB_TOKEN }}
          upload-url: ${{ needs.create-release.outputs.upload_url }}
          asset-path: ${{ env.PROJECT_ROOT }}/${{ env.DEPLOY_ZIP }}
          asset-name: ${{ env.DEPLOY_ZIP }}
          asset-content-type: application/zip
          
      

```

## Contributing

When creating new PRs please ensure:

1. For major or minor changes, at least one of the commit messages contains the appropriate `+semver:` keywords listed under [Incrementing the Version](#incrementing-the-version).
1. The action code does not contain sensitive information.

When a pull request is created and there are changes to code-specific files and folders, the build workflow will run and it will recompile the action and push a commit to the branch if the PR author has not done so. The usage examples in the README.md will also be updated with the next version if they have not been updated manually. The following files and folders contain action code and will trigger the automatic updates:

- action.yml
- package.json
- package-lock.json
- src/\*\*
- dist/\*\*

There may be some instances where the bot does not have permission to push changes back to the branch though so these steps should be done manually for those branches. See [Recompiling Manually](#recompiling-manually) and [Incrementing the Version](#incrementing-the-version) for more details.

### Recompiling Manually

If changes are made to the action's code in this repository, or its dependencies, the action can be re-compiled by running the following command:

```sh
# Installs dependencies and bundles the code
npm run build

# Bundle the code (if dependencies are already installed)
npm run bundle
```

These commands utilize [esbuild](https://esbuild.github.io/getting-started/#bundling-for-node) to bundle the action and
its dependencies into a single file located in the `dist` folder.

### Incrementing the Version

Both the build and PR merge workflows will use the strategies below to determine what the next version will be.  If the build workflow was not able to automatically update the README.md action examples with the next version, the README.md should be updated manually as part of the PR using that calculated version.

This action uses [git-version-lite] to examine commit messages to determine whether to perform a major, minor or patch increment on merge.  The following table provides the fragment that should be included in a commit message to active different increment strategies.
| Increment Type | Commit Message Fragment                     |
| -------------- | ------------------------------------------- |
| major          | +semver:breaking                            |
| major          | +semver:major                               |
| minor          | +semver:feature                             |
| minor          | +semver:minor                               |
| patch          | *default increment type, no comment needed* |

## Code of Conduct

This project has adopted the [im-open's Code of Conduct](https://github.com/im-open/.github/blob/master/CODE_OF_CONDUCT.md).

## License

Copyright &copy; 2021, Extend Health, LLC. Code released under the [MIT license](LICENSE).

[git-version-lite]: https://github.com/im-open/git-version-lite
[upload-release-asset]: https://github.com/actions/upload-release-asset
[im-open/create-release]: https://github.com/im-open/create-release
[api call]: https://docs.github.com/en/rest/reference/repos#create-a-release
[supported Media Types]: https://www.iana.org/assignments/media-types/media-types.xhtml
