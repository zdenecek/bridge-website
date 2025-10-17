
var canvas = document.getElementById("jsdos");
emulators.pathPrefix = "";
var dos = Dos(canvas, {}); 
var running = false;
var displaystyle = canvas.style.display;

// Start automatically when document loads
document.addEventListener("DOMContentLoaded", () => {
  if(running) return; 
  canvas.style.visibility = "visible"; 
  canvas.style.display = displaystyle; 
  dos.run("/bridgemaster/BM.jsdos"); 
  running = true; 
  console.log("start");
});

canvas.style.visibility = "collapse";
canvas.style.display = "none";

document.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "ArrowLeft":
      case "ArrowRight":
      case "ArrowUp":
      case "ArrowDown":
        if (running) e.preventDefault();
        break;
    }
  });