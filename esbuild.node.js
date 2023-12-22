import esbuild from "esbuild";

esbuild
    .build({
        entryPoints: [{ in: "src/index.ts", out: "index" }],
        bundle: true,
        sourcemap: false,
        minify: true, // 压缩代码
        outdir: "dist",
        target: "esnext",
        platform: "node",
        external: ["axios", "lodash"],
        format: "cjs",
    })
    .catch(() => process.exit(1));
