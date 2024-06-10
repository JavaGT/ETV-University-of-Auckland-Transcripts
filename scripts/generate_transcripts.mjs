import fsp from 'fs/promises';
import { exec } from 'child_process';
import assert from 'assert';

// assert(process.env.PYTORCH_ENABLE_MPS_FALLBACK === 1, "Must set environment variable PYTORCH_ENABLE_MPS_FALLBACK using\nexport PYTORCH_ENABLE_MPS_FALLBACK=1")
await prepare_directories();

const metadata_file_text_lines = (await fsp.readFile('./metadata.jsonl', { encoding: 'utf8' })).split('\n')
console.log('metadata_file_text_lines:', metadata_file_text_lines)
const regex = /{\"id\":(\d+),\"File Name\":"([^"]+)",/g

const matches = []
for (let line of metadata_file_text_lines) {
    let content = regex.exec(line)
    if (!content) continue
    matches.push([content[1], content[2]])
    console.log('content:', content)
}
console.log('matches:', matches)


// // find all matches
// const matches = []
// let match = regex.exec(metadata_file_text)
// while (match !== null) {
//     const id = match[1]
//     const file_name = match[2]
//     matches.push({ id, file_name })
//     match = regex.exec(metadata_file_text)
// }


async function prepare_directories() {
    return Promise.all(['./temp'].map(x => fsp.mkdir(x).catch(() => { })));
}

// for (let num = 500000; num < 500000 + 1200; num++) {
//     // chech if the transcript file already exists
//     if (await fsp.stat(`./transcript/${num}.json`).catch(() => { }) !== undefined) {
//         console.log(`TRANSCRIPT FILE ALREADY EXISTS FOR VIDEO ${num}`);
//         continue;
//     }
//     // yyyy-mm-dd-hh-mm-ss
//     let ts_string = new Date().toISOString().replace("T", "-").slice(0, 19);
//     function log(...params) {
//         console.log(`[${ts_string}] ${params.join(" ")}`);
//     }
//     log(`REQUESTING VIDEO ${num}`);
//     const data = await fsp.readFile(`./metadata/${num}.html`, "utf-8");
//     // console.log(data);
//     const regex = /<tr><td align='left' valign='top'>(.*?)<\/td><td/g;
//     const match = regex.exec(data)?.[1];
//     // https://cdn.etv.org.nz/
//     log('match:', match)
//     const url = "https://cdn.etv.org.nz/" + match + "_768k.mp4";
//     log(url);
//     let request = await fetch(url);
//     if (request.status !== 200) {
//         log(`ERROR: STATUS CODE ${request.status} ON VIDEO ${num} FROM ${url}`);
//         // try again without the _768k
//         const url2 = "https://cdn.etv.org.nz/" + match + ".mp4";
//         log(url2);
//         request = await fetch(url2);
//         if (request.status !== 200) {
//             log(`ERROR: STATUS CODE ${request.status} ON VIDEO ${num} FROM ${url2}`);
//             continue;
//         }
//     }
//     const buffer = await request.arrayBuffer();
//     if (buffer.byteLength === 0) {
//         log(`ERROR: EMPTY VIDEO ${num}`);
//         continue;
//     }
//     await fsp.writeFile(`./video/${num}.mp4`, Buffer.from(buffer));


//     // ffmpeg -i input.mp4 output.wav
//     const command = `ffmpeg -y -i ./video/${num}.mp4 ./audio/${num}.wav`;
//     log(`making audio file ${num}`);
//     log(command);
//     await execp(command);
//     // insanely-fast-whisper --device-id mps --model-name distil-whisper/distil-large-v3  --batch-size 4 --file-name ./video/500001.wav --transcript-path ./transcript/500001.json
//     const whisper_command = `insanely-fast-whisper --device-id mps --model-name distil-whisper/distil-large-v3  --batch-size 4 --file-name ./audio/${num}.wav --transcript-path ./transcript/${num}.json`;
//     log(`transcribing audio file ${num}`);
//     log(whisper_command);
//     await execp(whisper_command);
//     // delete the video file
//     await fsp.unlink(`./video/${num}.mp4`);
//     // delete the audio file
//     await fsp.unlink(`./audio/${num}.wav`);
//     log(`SUCCESS: TRANSCRIBED VIDEO ${num}`);
// }

// function execp(command) {
//     return new Promise((resolve, reject) => {
//         exec(command, (error, stdout, stderr) => {
//             if (error) {
//                 reject(error);
//                 return;
//             }
//             resolve(stdout);
//         });
//     });
// }