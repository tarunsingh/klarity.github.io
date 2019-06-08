const { FuseBox, WebIndexPlugin, CSSPlugin } = require("fuse-box");
const fuse = FuseBox.init({
    homeDir : "src",
    target : 'browser@es6',
    output : ".dev/$name.js",
    allowSyntheticDefaultImports: true,
    plugins : [
        WebIndexPlugin({
            template:'src/index.html',
            useTypescriptCompiler: true
        }),
        [
            CSSPlugin({
                group:'bundle.css',
                outFile:`.dev/bundle.css`,
            }),
        ]
    ]
});
fuse.dev(); // launch http server
fuse.bundle("app").instructions(" > index.js").hmr({reload:true}).watch();
fuse.run();