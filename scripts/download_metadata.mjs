import fsp from 'fs/promises';
import fs from 'fs';
import assert from 'assert';
import zlib from 'zlib';

checkCookie();
await prepare_directories();
const REQUEST_OPTIONS = getRequestOptions();

// create a list with 20 random numbers between 0 and 500000
const random_numbers = Array.from({ length: 1200 }, () => Math.floor(Math.random() * 1000000));

[500000, 100050, 90090, 70090, 60050, 50090, 40050, 29940, ...random_numbers].reduce(async (prev, current) => {
    await prev;
    await download_all_metadata_from_index(current, true)
    await download_all_metadata_from_index(current-1, false)
    return Promise.resolve();
}, Promise.resolve());

// await download_all_metadata()
await compress_jsonl()

export async function download_all_metadata_from_index(i, forwards = true) {
    const writeStream = fs.createWriteStream('./metadata.jsonl', { flags: 'a' });
    let request, text, request_url, metadata_filepath;
    try {
        while (true) {
            metadata_filepath = `./metadata/${i}.html`

            if (await fileExists(metadata_filepath)) {
                console.log(`SKIPPING ENTRY ${i} BECAUSE METADATA ALREADY COLLECTED ${metadata_filepath}`);
                i = forwards ? i + 1 : i - 1;
                continue;
            }

            request_url = "https://uoa.etv.org.nz/tv/vod/download_metadata/" + (i);
            request = await fetch(request_url, REQUEST_OPTIONS);
            assert(requestOK(request), `ERROR: STATUS CODE ${request.status} ON ENTRY ${i}`);

            text = await request.text();
            assert(!isHTML(text), `ERROR: GOT HTML RESPONSE ON ENTRY ${i}`);

            await fsp.writeFile(metadata_filepath, text);
            writeStream.write(JSON.stringify({ id: i, ...parseMetadata(text) }) + '\n');
            console.log(`SUCCESS: SAVED ENTRY ${i}`);
            i = forwards ? i + 1 : i - 1;
            await wait(2)
        }
    } catch (e) {
        console.error(`ERROR: ${e} ON ENTRY ${i}`);
    }
}

function compress_jsonl() {
    return new Promise((resolve, reject) => {
        const readStream = fs.createReadStream('./metadata.jsonl');
        const writeStream = fs.createWriteStream('./metadata.jsonl.gz');
        const gzip = zlib.createGzip();
        readStream.pipe(gzip).pipe(writeStream);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
    })
}

function parseMetadata(text) {
    // <table border=0><tr bgcolor=999999><th>File Name</th><th>Name</th><th>Description</th><th>Duration</th><th>Type</th><th>Subject</th><th>Age Level</th><th>Channel</th><th>Recording Date</th><th>Recording Time</th></tr>
    // <tr><td align='left' valign='top'></td><td  align='left' valign='top'>Auto Increment placeholder</td><td align='left' valign='top'></td><td align='center' valign='top'></td><td align='center' valign='top'></td><td align='left' valign='top'></td><td align='left' valign='top'></td><td align='left' valign='top'></td><td align='center' valign='top'></td><td align='center' valign='top'></td></tr></table>

    // split only at first newline, not all newlines
    let newline_index = text.indexOf('\n');
    const lines = [text.slice(0, newline_index), text.slice(newline_index + 1)];
    const data = {}
    // loop first line for keys, second line for values
    const keys = lines[0].split('<th>').slice(1).map(x => x.split('</th>')[0]);
    const values = lines[1].split(/<td[^>]+>/).slice(1).map(x => x.split('</td>')[0]);

    for (let j = 0; j < keys.length; j++) {
        data[keys[j]] = values[j];
    }

    return data;
}

async function fileExists(filepath) {
    return fsp.access(filepath).then(() => true).catch(() => false);
}

function requestOK(request) {
    return request.status === 200;
}

function isHTML(text) {
    return text.startsWith("<!DOCTYPE html>") || text.startsWith("<html");
}

function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function checkCookie() {
    if (!process.env.COOKIE) {
        console.error(`COOKIE environment variable not set. Please set the COOKIE environment variable to the value of the cookie in your browser when accessing https://uoa.etv.org.nz/tv/vod/download_metadata/500001\nexport COOKIE="cookie_value_here"`);
        process.exit(1);
    }
}

async function prepare_directories() {
    return Promise.all(['./metadata'].map(x => fsp.mkdir(x).catch(() => { })));
}

function getRequestOptions() {
    return {
        "headers": {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "accept-language": "en-US,en;q=0.9",
            "sec-ch-ua": "\"Google Chrome\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"macOS\"",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "none",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "cookie": process.env.COOKIE
        },
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "GET"
    }
}