const choose_wad = document.getElementById("choose-wad");

choose_wad.addEventListener("change", () => {
  const file = choose_wad.files?.[0];

  if (file)
    load_file(file);
})

async function builtin_file(name) {
  const response = await fetch("/endooms/" + name);
  const blob = await response.blob();

  load_file(blob);
}

function load_file(file) {
  const reader = new FileReader();

  reader.onerror = () => {
    console.log("Error loading WAD");
  }

  reader.onload = () => {
    const bytes = new Uint8Array(reader.result);
    const endoom_offset = find_endoom(bytes);

    if (endoom_offset != -1)
      display_endoom(bytes, endoom_offset);
  }

  reader.readAsArrayBuffer(file);
}

function read4bytes(bytes, offset) {
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  ) >>> 0;
}

function decode_string(bytes, offset, size) {
  var res = "";
  for (var i = 0; i < size; i++) {
    res += String.fromCharCode(bytes[offset + i])
  }
  return res.replace(/\0/g, "").trim();
}

function find_endoom(bytes) {
  const header = decode_string(bytes, 0, 4);
  if (header != "IWAD" && header != "PWAD")
    return 0; // this isnt a wad, simply a ENDOOM lump

  const numlumps = read4bytes(bytes, 4);
  const infotableofs = read4bytes(bytes, 8);
  var offset = infotableofs;

  for (var i = 0; i < numlumps; i++) {
    const name = decode_string(bytes, offset+8, 8);
    if (name == "ENDOOM" || name == "ENDBOOM" || name == "ENDTEXT" || name == "ENDSTRF")
      return read4bytes(bytes, offset);

    offset += 16;
  }

  return -1;
}

const colors = [
  "#000000", // 0 black
  "#0000AA", // 1 blue
  "#00AA00", // 2 green
  "#00AAAA", // 3 cyan
  "#AA0000", // 4 red
  "#AA00AA", // 5 magenta
  "#AAAA00", // 6 yellow/brown
  "#AAAAAA", // 7 white
  "#555555", // 8 dark gray
  "#5555FF", // 9 bright blue
  "#55FF55", // A bright green
  "#55FFFF", // B bright cyan
  "#FF5555", // C bright red
  "#FF55FF", // D bright magenta
  "#FFFF55", // E bright yellow
  "#FFFFFF"  // F bright white
];
const cp437_to_utf8 = [
  "\u0000","\u263A","\u263B","\u2665","\u2666","\u2663","\u2660","\u2022",
  "\u25D8","\u25CB","\u25D9","\u2642","\u2640","\u266A","\u266B","\u263C",
  "\u25BA","\u25C4","\u2195","\u203C","\u00B6","\u00A7","\u25AC","\u21A8",
  "\u2191","\u2193","\u2192","\u2190","\u221F","\u2194","\u25B2","\u25BC",
  " ","!","\"","#","$","%","&","'","(",")","*","+",",","-",".","/",
  "0","1","2","3","4","5","6","7","8","9",":",";","<","=" ,">","?",
  "@","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O",
  "P","Q","R","S","T","U","V","W","X","Y","Z","[","\\","]","^","_",
  "`","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o",
  "p","q","r","s","t","u","v","w","x","y","z","{","|","}","~","\u2302",
  "\u00C7","\u00FC","\u00E9","\u00E2","\u00E4","\u00E0","\u00E5","\u00E7",
  "\u00EA","\u00EB","\u00E8","\u00EF","\u00EE","\u00EC","\u00C4","\u00C5",
  "\u00C9","\u00E6","\u00C6","\u00F4","\u00F6","\u00F2","\u00FB","\u00F9",
  "\u00FF","\u00D6","\u00DC","\u00A2","\u00A3","\u00A5","\u20A7","\u0192",
  "\u00E1","\u00ED","\u00F3","\u00FA","\u00F1","\u00D1","\u00AA","\u00BA",
  "\u00BF","\u2310","\u00AC","\u00BD","\u00BC","\u00A1","\u00AB","\u00BB",
  "\u2591","\u2592","\u2593","\u2502","\u2524","\u2561","\u2562","\u2556",
  "\u2555","\u2563","\u2551","\u2557","\u255D","\u255C","\u255B","\u2510",
  "\u2514","\u2534","\u252C","\u251C","\u2500","\u253C","\u255E","\u255F",
  "\u255A","\u2554","\u2569","\u2566","\u2560","\u2550","\u256C","\u2567",
  "\u2568","\u2564","\u2565","\u2559","\u2558","\u2552","\u2553","\u256B",
  "\u256A","\u2518","\u250C","\u2588","\u2584","\u258C","\u2590","\u2580",
  "\u03B1","\u00DF","\u0393","\u03C0","\u03A3","\u03C3","\u00B5","\u03C4",
  "\u03A6","\u0398","\u03A9","\u03B4","\u221E","\u03C6","\u03B5","\u2229",
  "\u2261","\u00B1","\u2265","\u2264","\u2320","\u2321","\u00F7","\u2248",
  "\u00B0","\u2219","\u00B7","\u221A","\u207F","\u00B2","\u25A0","\u00A0"
];

async function display_endoom(bytes, offset) {
  const cols = 80, rows = 25;
  const cw = 8, ch = 16;

  const endoom_display = document.getElementById("endoom-display");
  endoom_display.innerHTML = "";

  const canvas = document.createElement("canvas");
  canvas.width = cols * cw;
  canvas.height = rows * ch;
  const ctx = canvas.getContext("2d");
  ctx.font = "16px 'Px437_IBM_VGA_8x16', monospace";
  ctx.textBaseline = "top";

  for (var y = 0; y < rows; y++) {
    for (var x = 0; x < cols; x++) {
      const of = offset + (y * cols + x) * 2;
      const char = cp437_to_utf8[bytes[of]];
      const info = bytes[of + 1];
      const front_color = colors[info & 0b1111];
      const back_color = colors[info >> 4 & 0b111];

      ctx.fillStyle = back_color;
      ctx.fillRect(x * cw, y * ch, cw, ch);

      ctx.fillStyle = front_color;
      ctx.fillText(char, x * cw, y * ch);
    }
  }

  endoom_display.appendChild(canvas);
}
