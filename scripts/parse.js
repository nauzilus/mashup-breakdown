const fs = require("fs");
const path = require("path");

const input = process.argv.slice(2);
if (input.length === 0) {
  console.debug("usage ./parse.js file[ file2[ file3]]");
}

function mmss2s(mmss) {
  const [mm, ss] = mmss.split(":");
  const s = 60 * Number(mm) + Number(ss);
  if (isFinite(s)) {
    return s;
  }

  throw new Error(`Need mm:ss, got '${mmss}'`);
}

const TRACK_TITLE_RE = /^"(.+)"$/;
const SAMPLE_RE = new RegExp(
  `^(\\d+:\\d+)\\s+.\\s+(\\d+:\\d+)\\s+—\\s+(.*)\\s+–\\s+"(.+)"`
);

input.forEach((filename) => {
  if (fs.existsSync(filename)) {
    const lines = fs.readFileSync(filename, "utf-8");
    const parsed = lines
      .split(/[\r\n]/)
      .map((x) => x.trim())
      .reduce(
        (out, line) => {
          const m_track = TRACK_TITLE_RE.exec(line);
          if (m_track) {
            const [, title] = m_track;
            const offset = ((prev) => {
              if (prev) {
                const max = Math.max(...prev.samples.map((x) => x.end));
                if (max) {
                  return prev.offset + max;
                }
              }
              return 0;
            })(out.tracks.slice(-1)[0]);

            out.tracks.push({ title, samples: [], offset });

            return out;
          }

          if (out.tracks.length === 0) {
            return out;
          }

          const m_sample = SAMPLE_RE.exec(line);
          if (m_sample) {
            const [, start, end, artist, title] = m_sample;
            out.tracks.slice(-1)[0].samples.push({
              start: mmss2s(start),
              end: mmss2s(end),
              artist,
              title,
            });
            return out;
          }

          throw new Error(`Unknown line '${line}'`);
        },
        {
          filename,
          tracks: [],
        }
      );

    fs.writeFileSync(
      `${path.basename(filename, path.extname(filename))}.json`,
      JSON.stringify(parsed, null, 2),
      "utf-8"
    );
  }
});
