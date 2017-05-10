# @prometheusresearch/react-scripts

This is a fork of original `react-scripts` package customized for Prometheus
Research projects.

Few things are changed:

* Added `react-scripts watch` command for watching source code changes and
  writing bundle to filesystem.
* `babel-preset-prometheusresearch` is used instead of `babel-preset-react-app`
  (still the former is based on the latter but with added support for decorator
  syntax and export extensions).
* Changed module resolution to allow symlinked packages to resolve their
  dependencies properly.
* Few cosmetic changes like less nested default bundle names.

The following environment variables are introduced:

* `REACT_SCRIPTS_BUILD` (optional) is used to control the bundle output
  directory.
* `REACT_SCRIPTS_NON_INTERACTIVE` (optional) is used to suppress interactive CLI
  interface (for example disabling clearing terminal).

# react-scripts

This package includes scripts and configuration used by [Create React App](https://github.com/facebookincubator/create-react-app).<br>
Please refer to its documentation:

* [Getting Started](https://github.com/facebookincubator/create-react-app/blob/master/README.md#getting-started) – How to create a new app.
* [User Guide](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md) – How to develop apps bootstrapped with Create React App.
