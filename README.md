---------------------------------------------------------------------------------------------------------------------
# SECTION 4: SERVING STATIC FILES
- [my github for this section](https://github.com/MostlyFocusedMike/hapi-notes-4)
- primary sources
    - https://hapijs.com/tutorials/serving-files?lang=en_US
    - https://futurestud.io/tutorials/hapi-how-to-serve-static-files-images-js-etc
    - https://github.com/hapijs/inert


---------------------------------------------------------------------------------------------------------------------
# Setting up the Inert plugin
 - to serve static files and assets like HTML, JS, CSS, JPG files, hapi relies on the [inert](https://github.com/hapijs/inert) plugin
- Inert serves files individually per path, or it can register a directory structure
- Load using Yarn or NPM:

```
npm install inert
# or
yarn add inert
```
- it is updated and ready for use with hapi 17, for hapi 16 use inert 4.X.X
- once it is installed, simply register it as a plugin:

```
FILE: server.js


const Hapi = require('hapi')

const server = new Hapi.server({
    host: 'localhost',
    port: '3104',
});

const start = async () => {

    await server.register([
        /* RIGHT HERE */
        require('inert')
    ]);

    /* load routes */
    server.route(require('./lib/routes/home'));
    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
}

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

start();
```



---------------------------------------------------------------------------------------------------------------------
# Serving a single static file
### File Structure
- lib
    - public
        - images
            -  all our images
        - style.css
        - index.html
        - used-picture.html
        - app.js
- server.js

# serving a single file
- the way inert works is that you will have routes that instead of just giving a response, will serve as a static file:
- when you register Inert, it decorates the 'h' response toolkit with the .file() method, which takes the path to file you would like to serve
- lets show this by serving a single image:

```
FILE: server.js

...
    server.route({
        method: 'GET',
        path: '/picture',
        handler: function (request, h) {

            return h.file('lib/public/images/hapi-logo.png');
        }
    });
...
```
- so now when we go to http://localhost:3104/picture we will just see the Hapi logo image, even though the image file is stored in lib/public/images
- If we want to access this file from within our site pages, you would go to the route path, not the actual file's path
- let's look at how a simple html page would use that image asset:

```
FILE: lib/public/used-picture.html

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>
    <h1>I'm using the static asset of the photo!</h1>
    <!-- the source is just hitting the picture route -->
    <img src="/picture" alt="hapi Logo" style="height: 100px;" />
</body>
</html>
```
- it loads the file from '/picture', even though the file's actual location is /lib/public/images
- **when loading an asset use the route path, not the file's path**
- and now lets actually serve up this html page itself with a new route:

```
FILE: server.js
...
    server.route({
        method: 'GET',
        path: '/picture',
        handler: function (request, h) {

            return h.file('lib/public/images/hapi-logo.png');
        }
    });

    server.route({
        method: 'GET',
        path: '/example-page',
        handler: function (request, h) {

            return h.file('lib/public/used-picture.html');
        }
    });
...

```

- if you go to http://localhost:3104/example-page, you will see the image inside the html document.

## file handler
- instead of using the response toolkit, you could also use the file handler:

```
FILE: server.js

...
    server.route({
        method: 'GET',
        path: '/picture',
        handler: {
            file: 'lib/public/images/hapi-logo.png'
        }
    });
...



FILE: copy from docs
/* use a function instead of an object to get access
   to the response object for things like parameters */
server.route({
    method: 'GET',
    path: '/files/{filename}',
    handler: {
        file: function (request) {
            return request.params.filename;
        }
    }
});
```

- check the docs [tutorial](https://hapijs.com/tutorials/serving-files?lang=en_US) for more on file handler
- check Inert's docs for info about the [options argument](https://github.com/hapijs/inert#hfilepath-options) as well

---------------------------------------------------------------------------------------------------------------------
# Using relative file paths
- putting 'lib/public/' in front of everything can get annoying, so you can tell files that there is a default relative path to start at
- in the server config object, just include the **routes** object (don't forget to add Node's path package):

```
FILE: server.js

const Hapi = require('hapi');
const Path = require ('path');

const server = new Hapi.server({
    host: 'localhost',
    port: '3104',
    routes: {
        files: {
            relativeTo: Path.join(__dirname, 'lib/public')
        }
    }
});
...
```
- this makes it so that any paths for static files do not need to start with 'lib/public', which is nice



---------------------------------------------------------------------------------------------------------------------
# Directory handler
- Assigning every asset their own route isn't necessary, you can also turn a folder into a static asset directory for your project
- do this with the **directory handler**:

```
FILE: server.js
    server.route({
        method: 'GET',
        path: '/{param*}',
        handler: {
            directory: {
                path: '.',
                redirectToSlash: true,
                /* if we weren't using a relative path */
                // path: 'lib/public',
                /* if you weren't using a standard index.html
                // index: 'default.html',
                /* if you wanted to see all your files instead of an index file */
                // listing: true,
                /* listing will now show hidden files */
                // showHidden: true,
                 /* param 'example' will also try example.html */
                // defaultExtension: 'html',
            }
        }
    });

```
- what this does is it looks for the param, like say 'style.css' and checks if that file is found in the given directory. If no file is found to match, it will then look for it on the other routes
    - this is why '/example-page' doesn't throw and error when there is no file in our public directory called 'example-page', it doesn't find a file so it just moves on
    - what's interesting though is that /images/hapi-logo.png will also work thanks to the wildcard in the param (see the Multi-segment parameters section)

- lets look at the three most common properties:
    - **path**: this is the path to the directory that we will use to store our assets, and it takes a string.
         - However, if you set the **routes.files.relativeTo** in the server object (as I have in these examples), then it assumes that is the starting directory, so it is perfectly fine to give a path of '.' as we have here
    - **index**: let's say the user just goes to http://localhost:3104, there will be no params given, so the directory will be default search for an index.html file. However, if you named your index something else, you can specify that here
        - it takes either a string, or an array of strings to search in order:
```
 index: ['default.hmlt', 'weird.html']
```
    - **listing**: if you don't want to use an index, and instead want a clickable directory of hyperlinks deplayed for http://localhost:3104, then be sure that you don't have an index.html file and you switch listing to true (default is false).
         - this can be useful when working on API's that don't actually have a home route
    - **showHidden**: if set to true, listing will show hidden dotfiles, the default is false
    - **defaultExtension**: a string that will be used as a default file extentsion if the path isn't found. So a request for /thing will try the file /thing.html.
    - **lookupCompressed**: allows you to serve precompressed files when possible.
   - **redirectToSlash**: requests without trailing slashes are treated as if they are, this is called “with slash pendant” BTW. You might need this for relative paths, so it's good to leave it on (it defaults to false)
--------------------------------------------------------------------------------------------------------------------
## Using assets from the directory
- so now that we saw what everything was set up to do, our static assets will now all work in our pages:

```
FILE: lib/public/index.html

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <link rel="stylesheet" href="/style.css">
    <script src="/app.js"></script>
    <title>Hapi Notes</title>
</head>
<body>
    <h1>I am the section 4 home page</h1>
    <h2>I am light blue thanks to the static css asset</h2>

    <p>Here is a picture loaded from our static directory: </p>
    <img src="/images/hapi-logo.png" alt="hapi Logo" style="height: 100px;" />

</body>
</html>
```
- look at the css, js, and image files all loading perfectly when you go to http://localhost:3104/, that directory does all the work of all the routes, and it is the preferred method of serving static assets in Hapi
