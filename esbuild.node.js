import esbuild from "esbuild";

esbuild
    .build({
        entryPoints: [{ in: "src/node/translation/index.ts", out: "translation" }],
        bundle: true,
        sourcemap: false,
        minify: true, // 压缩代码
        outdir: "lib/node",
        target: "esnext",
        platform: "node",
        external: ["axios", "lodash"],
        format: "cjs",
    })
    .catch(() => process.exit(1));
