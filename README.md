# Transcoderr

![Docker Cloud Build Status](https://img.shields.io/docker/cloud/build/drkno/transcoderr?style=flat-square)

A transcoding pipeline designed to normalise file types into a common filetype. Dynamically configurable using plugins allowing highly customisable pipelines to be built.

### Installation

1. Install `docker`.
2. Start this servie in docker. You can use a command similar to `docker run -p 4300:4300/tcp --name transcoderr -ti drkno/transcoderr:latest`
3. Install plugins into the `plugins` directory.
4. Configure webhooks in Sonarr (`/api/v1/sonarr`), Radarr (`/api/v1/radarr`) or otherwise (`/api/v1/manual`). See below for more details.

### Webhook APIs

| API              | Description |
|------------------|-------------|
| `/api/v1/sonarr` | A webhook POST API for Sonarr, which should be called when a download completes. |
| `/api/v1/radarr` | A webhook POST API for Radarr, which should be called when a download completes. |
| `/api/v1/manual` | A webhook POST API for external/other consumers of Transcoderr. Accepts a JSON array of file paths, e.g. `["myfile.mkv"]`. |

### Building Plugins

#### Plugin Types

There are two different types of plugins supported by Transcoderr: directory and file. File plugins must be self contained, directory plugins are node modules.

##### File Plugins

File plugins are individual `.js` files. Each plugin must contain a `describe` method similar to the following:

```js
describe() {
    return {
        name: 'name-of-my-plugin',
        description: 'A description of the plugin',
        version: '1.0.0',
        types: ['filter'] // see plugin types below
    };
}
```

For example plugins, see the built in plugins at `src/backend/plugins`.

##### Directory Plugins

Directory plugins are self-contained node modules. They can consist of multiple files and can have dependencies in a `node_modules` directory. Each of these must be placed within their own folder in the `plugins` directory.

Each plugin must have a `package.json` consisting at minimum of the following:

```json
{
    "name": "name-of-my-plugin",
    "description": "A description of the plugin",
    "version": "1.0.0",
    "types": ["filter"],
    "main": "index.js"
}
```

#### Transcoder Pipeline

Transcoderr works in a pipeline, similar to GPU processing. The following are each of the types/stages of the pipeline.

| Type   | Description                      |
|--------|----------------------------------|
| meta   | Performs analysis on the files   |
| pre    | Generates transcoder options     |
| filter | Filters options and files        |
| exec   | Runs transcode operations        |
| post   | Performs post-execution analysis |

Each plugin at each stage of the pipeline must expose an asynchronous method named after the type with 'main' as a suffix. E.g for the 'meta' stage of the pipeline, the plugin must expose a method with the signature:

```js
async metamain(collector) {}
```

Collectors are passed to each main method and represent a way to get and pass state betweem each stage of the pipeline. Individual stages have different collectors, see `src/backend/model/collector` for a list of collectors and what each expose.

#### Loading / Updating Plugins

The plugins directory is monitored by Transcoderr, plugins will automatically be loaded/reloaded/unloaded when changes are detected.
