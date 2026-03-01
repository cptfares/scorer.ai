import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
    const distPath = path.resolve(import.meta.dirname, "..", "public");

    if (!fs.existsSync(distPath)) {
        // In production, the public folder is in dist/public
        // But since this file is in server/, we need to adjust
        // dist/index.js is at the root of dist/
        // public is at dist/public
        const productionPath = path.resolve(import.meta.dirname, "public");
        if (fs.existsSync(productionPath)) {
            app.use(express.static(productionPath));
            app.use("*", (_req, res) => {
                res.sendFile(path.resolve(productionPath, "index.html"));
            });
            return;
        }

        throw new Error(
            `Could not find the build directory. Make sure to build the client first.`,
        );
    }

    app.use(express.static(distPath));

    // fall through to index.html if the file doesn't exist
    app.use("*", (_req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
    });
}
