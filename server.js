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

const start = async () => {

    await server.register([
        require('inert')
    ]);


    /* serve a single file using the response toolkit */
    // server.route({
    //     method: 'GET',
    //     path: '/picture',
    //     handler: function (request, h) {

    //         return h.file('lib/public/images/hapi-logo.png');
    //     }
    // });

    /* serve a single file using the file handler */

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

    server.route({
        method: 'GET',
        path: '/picture',
        handler: {
            file: 'images/hapi-logo.png' /* using relative path */
            // file: 'lib/public/images/hapi-logo.png' /* using standard path */

        }
    });

    server.route({
        method: 'GET',
        path: '/example-page',
        handler: function (request, h) {

            return h.file('used-picture.html'); /* using relative path */
            // return h.file('lib/public/used-picture.html'); /* using standard path */
        }
    });



    /* load routes */
    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
}

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

start();