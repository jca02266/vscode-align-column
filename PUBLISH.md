# Step to publish

## build

  ```
  npm install
  npm run compile
  npx vsce package
  code --install-extension=align-columns-X.X.X.vsix
  ```

## debug
  ```
  vscode .
    (debug) Press [F5]
  ```

## publish

  see. https://code.visualstudio.com/api/working-with-extensions/publishing-extension#get-a-personal-access-token

  ```
  https://dev.azure.com/jca02266/_usersSettings/tokens

  npx vsce login jca02266
  npx vsce publish
  ```
