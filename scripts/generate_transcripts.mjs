import fsp from 'fs/promises';
import { exec } from 'child_process';
import assert from 'assert';

// assert(process.env.PYTORCH_ENABLE_MPS_FALLBACK === 1, "Must set environment variable PYTORCH_ENABLE_MPS_FALLBACK using\nexport PYTORCH_ENABLE_MPS_FALLBACK=1")
await prepare_directories();

const metadata_file_text_lines = (await fsp.readFile('./metadata.jsonl', { encoding: 'utf8' })).split('\n')
const regex = /{\"id\":(\d+),\"File Name\":"([^"]+)",/g

let matches = []
for (let line of metadata_file_text_lines) {
    let content = regex.exec(line)
    if (!content) continue
    matches.push([content[1], content[2]])
}

const keywords = ["news", "country", "the_project", "sunday", "maori", "q+a", "tagata", "te_karere", "kai_time", "morning_report", "bbc", "seven_sharp", "breakfast", "am_three"]
// filter out matches that dont include keywords
matches = matches.filter(([id, file_name]) => {
    return keywords.some(keyword => file_name.toLowerCase().includes(keyword))
})

for (let [id, file_name] of matches) {
    // chech if any transcripts already exist for this video
    const transcript_large_path = `./transcripts/${id}.json`
    const transcript_small_path = `./transcripts/${id}_small.json`
    const exists = await anyFileExists([transcript_large_path, transcript_small_path])

    if (exists) {
        console.log(`- TRANSCRIPT FILE ALREADY EXISTS FOR VIDEO ${id}, ${exists}`);
        continue;
    }
    console.log(`+ TRANSCRIPT FILE DOES NOT EXIST FOR VIDEO ${id}, STARTING`);

    const video_url_1 = `https://cdn.etv.org.nz/${file_name}_768k.mp4`;
    const video_url_2 = `https://cdn.etv.org.nz/${file_name}.mp4`;
    let video_buffer = await fetchBackups([video_url_1, video_url_2]);
    if (!video_buffer) {
        console.log(`- ERROR: COULD NOT DOWNLOAD VIDEO ${id}`);
        continue;
    }
    await fsp.writeFile(`./temp/${id}.mp4`, Buffer.from(video_buffer));

    const audio_command = `ffmpeg -y -i ./temp/${id}.mp4 ./temp/${id}.wav`;
    await execp(audio_command);
    await fsp.unlink(`./temp/${id}.mp4`);
    // const transcribe_command = `insanely-fast-whisper --device-id mps --model-name distil-whisper/distil-large-v3  --batch-size 4 --file-name ./temp/${id}.wav --transcript-path ${transcript_large_path}`;
    const transcribe_command = `insanely-fast-whisper --device-id mps --model-name distil-whisper/distil-small.en  --batch-size 4 --file-name ./temp/${id}.wav --transcript-path ${transcript_small_path}`;
    await execp(transcribe_command);
    await fsp.unlink(`./temp/${id}.wav`);
}

async function fetchBackups(urls) {
    for (let url of urls) {
        let request = await fetch(url);
        if (request.status !== 200) continue;
        let buffer = await request.arrayBuffer();
        if (buffer.byteLength === 0) continue;
        return buffer;
    }
}

function anyFileExists(files) {
    return new Promise((resolve) => {
        let promises = []
        for (let file of files) {
            promises.push(
                fsp.stat(file)
                    .then(() => resolve(file))
                    .catch(() => { })
            )
        }
        Promise.all(promises).then(() => {
            resolve(false)
        })
    })
}
async function prepare_directories() {
    return Promise.all(['./temp', './transcripts'].map(x => fsp.mkdir(x).catch(() => { })));
}




function execp(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(stdout);
        });
    });
}