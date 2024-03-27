import esbuild from "esbuild";

esbuild
    .build({
        entryPoints: [{ in: "src/index.ts", out: "index" }],
        bundle: true,
        sourcemap: false,
        minify: true, // 压缩代码
        outdir: "dist",
        target: "es2020",
        platform: "node",
        external: ["axios", "lodash"],
        format: "esm",
    })
    .catch(() => process.exit(1));
