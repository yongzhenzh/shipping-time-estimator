# Shipping Time Estimator

Feel free to add to this `README.md` as needed.

## prerequisites

This project requires Node version `22.14.0` and npm version `10.9.2`.

[download from the nodejs website.](https://nodejs.org/en/download)

### using nvm

If you're on OSX or linux, you can use `nvm` to manage your node version:

https://github.com/nvm-sh/nvm

Once you have `nvm` installed, you can run the command:

```
nvm use
```

to install the version of node we have defined in the `.nvmrc` file.

## installing dependencies

After you have `node v22.14.0` installed, you can then use the command:

```
npm ci
```

To install the dependencies as defined in our `package-lock.json` file. If you are installing new dependencies please use the `npm i` syntax.

## working in the project

### setting up and using biome

We're using `biomejs` to act as our formatter and linter for the project:

https://biomejs.dev/

We have a `biome.json` file that sets our formatting and linting standards. It's using the prebuilt definitions.

You can find the [VS Code extension here](https://marketplace.visualstudio.com/items?itemName=biomejs.biome).

If you're using VS Code please be sure to following the instructions here:

https://biomejs.dev/reference/vscode/#default-formatter

To set biomejs as the formatter.

**Please note:** we aren't going to be strict about the linting. Just try to use it as guidance when writing code.
![1](https://github.com/user-attachments/assets/2d085d18-934d-4772-9ef1-bf5f663425c1)
![2](https://github.com/user-attachments/assets/78d7d3f9-be22-486f-8829-b16d3cd9f811)


