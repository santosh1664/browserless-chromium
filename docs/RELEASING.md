# Releasing

Releases are automated with [release-please](https://github.com/googleapis/release-please).
Merging the **Release PR** publishes the npm package and the Chromium Docker
image for linux/amd64 and linux/arm64.

## The flow

```text
commits land on main (Conventional Commits)
        |
        v
release-please.yml -> opens / updates a draft Release PR
        |                bumps package.json and updates the changelog
        v
merge Release PR -> GitHub Release + tag vX.Y.Z
        |
        +--> npm-publish.yml           -> npm publish + Slack
        +--> docker-publish-stable.yml -> base + Chromium multi-arch images
```

`docker-publish-latest.yml` publishes the `latest` base and Chromium images
on pushes to `main` in the upstream publishing repository.

## Versioning

release-please derives versions from Conventional Commit messages:

| Commit prefix                                      | Changelog section          | Version bump |
| -------------------------------------------------- | -------------------------- | ------------ |
| `feat:`                                            | Features                   | minor        |
| `fix:`                                             | Bug Fixes                  | patch        |
| `perf:`                                            | Performance Improvements   | patch        |
| `revert:`                                           | Reverts                    | patch        |
| `feat!:` / `BREAKING CHANGE:`                      | highlighted                | major        |
| `build:`, `chore:`, `ci:`, `docs:`, `style:`, `refactor:`, `test:` | hidden | none |

Use squash-merge with a Conventional Commit PR title.

## Chromium version block

The `browser-versions` script reads the pinned Puppeteer and Playwright
versions from `package.json`, launches Chromium from the published image, and
prints the versions for the release changelog.

```bash
npm run changelog:versions
node scripts/changelog-browser-versions.js --image ghcr.io/browserless/chromium:v2.65.0 --platform linux/amd64
```

## Required repository configuration

| Secret / variable                             | Used by            | Purpose                                |
| ---------------------------------------------- | ------------------ | -------------------------------------- |
| `vars.BROWSERLESS_ACTIONS_CLIENT_ID`           | release-please.yml | GitHub App client ID                   |
| `secrets.BROWSERLESS_ACTIONS_APP_PRIVATE_KEY`  | release-please.yml | GitHub App private key                 |
| npm trusted publishing (OIDC)                  | npm-publish.yml    | Authenticate npm publishing            |
| `secrets.SLACK_RELEASES_WEBHOOK`               | npm-publish.yml    | Release notification                   |
| GHCR package access                            | docker-publish.yml | Write access to `base` and `chromium` images |

The GitHub App used by release-please needs contents:write and
pull-requests:write permissions.

## First release

The release manifest records the last published package version. release-please
preserves existing changelog history while prepending new release entries.
