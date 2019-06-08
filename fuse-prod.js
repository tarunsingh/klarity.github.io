const { FuseBox, WebIndexPlugin, CSSPlugin } = require("fuse-box");
const fuse = FuseBox.init({
    homeDir : "src",
    target : 'browser@es6',
    output : "deploy/$name.js",
    allowSyntheticDefaultImports: true,
    plugins : [
        WebIndexPlugin({
            template:'src/index.html',
            useTypescriptCompiler: true
        }),
        [
            CSSPlugin({
                group:'bundle.css',
                outFile:`deploy/bundle.css`,
            }),
        ]
    ]
});
fuse.bundle("app").instructions(" > index.js");
fuse.run();