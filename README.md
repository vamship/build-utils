# @vamship/grunt-utils

_Library of modules that are designed to construct an opinionated dev/build
toolchain for Javascript and Typescript projects._

> This library was originally intended for internal consumption, though the
> functionality provided by this library is fairly generic.

## API Documentation

API documentation can be found [here](https://vamship.github.io/build-utils).

## Motivation

In addition to writing code (and tests!), every project brings with it a common
set of tasks that comprise a _development workflow_ for the project. This
workflow includes common activities such as linting, formatting files, testing,
building, packaging, etc.

Having consistent way of performing these tasks makes it easier to switch from
one project to another, because all common tasks will be identical for a given
class of project (nodejs library, API server, etc.).

In order to ensure this consistency, a common task automation framework (Gulp)
is used, combined with a consistent configuration and development tool set for
that framework.

This library exports modules and classes that enable the creation of Gulpfiles,
ensuring that they can be ported from project to project with no changes.

All project specific parameters can be declared within a `buildMetdata` property
in package.json.

## Installation

This library can be installed using npm:

```
npm install @vamship/build-utils
```

## Usage

The classes and modules exported by this library are independent, and can be
used by importing them into the source code as follows:

```
const {Directory} = require('@vamship/grunt-utils');
...

const root = new Directory('./');
...

// Use the directory object as required
```
