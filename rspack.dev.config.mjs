import { defineConfig } from "@rspack/cli";
import rspack from "@rspack/core";
import NodePolyfillPlugin from "node-polyfill-webpack-plugin";
import { fileURLToPath } from "node:url";
import pkg from "./package.json" with { type: "json" };

export default defineConfig({
    entry: {
        request: "./src/request.dev.js",
        response: "./src/response.dev.js",
    },
    output: {
        chunkFormat: false,
        filename: "[name].bundle.js",
        library: {
            type: "module",
        },
    },
    optimization: {
        minimize: false,
    },
    resolve: {
        alias: {
            "@nsnanocat/util$": fileURLToPath(new URL("./src/vendor/nsnanocat-util/index.mjs", import.meta.url)),
            "@nsnanocat/util/getStorage.mjs$": fileURLToPath(new URL("./src/vendor/nsnanocat-util/getStorage.mjs", import.meta.url)),
        },
    },
    plugins: [
        new NodePolyfillPlugin({
            //additionalAliases: ['console'],
        }),
        new rspack.BannerPlugin({
            banner: `console.log('Date: ${new Date().toLocaleString("zh-CN", { timeZone: "PRC" })}');`,
            raw: true,
        }),
        new rspack.BannerPlugin({
            banner: `console.log('Version: ${pkg.version}');`,
            raw: true,
        }),
        new rspack.BannerPlugin({
            banner: "console.log('[file]');",
            raw: true,
        }),
        new rspack.BannerPlugin({
            banner: `console.log('${pkg.displayName} β');`,
            raw: true,
        }),
        new rspack.BannerPlugin({
            banner: pkg.homepage,
        }),
    ],
    devtool: false,
    performance: false,
});
