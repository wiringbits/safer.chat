# Contributing

This is an incomplete list of things to take care while contributing.


## Commits
- Every commit message should have this format `$project: title` being `$project` one of `server`, `web` or `infra`, see the [commit list](https://github.com/wiringbits/safer.chat/commits/master) to get a better idea, also, the message should be meaningful and describe what is changed.
- Don't touch files or pieces non-related to the commit message, create a different commit instead.
- Keep the commits simple to make the reviews easy.
- Merge commits will be rejected, use rebase instead, run `git config pull.rebase true` after cloning the repository to rebase automatically.
- Every commit should have working code with all tests passing.
- Every commit should include tests unless it is not practical.

## Code style
- We use [scalafmt](https://scalameta.org/scalafmt/) to format the code automatically, follow the [IntelliJ setup for scalafmt](https://scalameta.org/scalafmt/docs/installation.html#intellij).

## Pull requests
- The pull requests should go to the `master` branch.


## Environment
It is simpler to use the recommended developer environment.

### server
- IntelliJ with the Scala plugin.

### web
Use [TSLint](https://palantir.github.io/tslint/) to keep the code format consistent, please run `tslint -c tslint.json 'src/**/*.ts'` and fix the errors before every commit, or use [visual code](https://code.visualstudio.com/) with the `Angular Language Service` and `TSLint` plugin to see the errors while typing.
