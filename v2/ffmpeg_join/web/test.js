var ffmpeg = require("ffmpeg.js/ffmpeg-mp4.js");
var fs = require("fs");

// Encode test video to VP8.
var result = ffmpeg({
  MEMFS: [
	{name: "base.mp4", data: new Uint8Array(fs.readFileSync("base.mp4"))},
	{name: "mylist.txt", data: new Uint8Array(fs.readFileSync("mylist.txt"))}
],
  arguments: ["-f", "concat", "-vbsf", "h264_mp4toannexb", "-i", "mylist.txt", "-c", "copy", "-vbsf", "h264_mp4toannexb", "out.mp4"],
  //arguments: ["-i", "base.mp4", "-codec", "copy", "out.mp4"],
  stdin: function() {},
});

// Write out.webm to disk.
var out = result.MEMFS[0];
fs.writeFileSync(out.name, Buffer(out.data));
