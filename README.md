[![build status](https://img.shields.io/travis/Dorokhov/AzureTools/master.svg?style=flat-square)](https://travis-ci.org/Dorokhov/AzureTools)

# Azure Tools Desktop

### Building the installer

#### OSX

```
npm run package:osx
```

Result: builds/Azure Tools-darwin-x64/azuretools.dmg.

#### Windows

```
grunt installerWindows32
grunt installerWindows64
```

Result:
builds/azuretools-win32-ia32
builds/azuretools-win32-x64

#### Linux

```
npm run package:linux
```

Result: builds/azuretools-linux-ia32.

