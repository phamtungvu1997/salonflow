const { staff, appointments } = window.STUDIO;
const start = window.minutes("08:00");
const hour = 64;
const board = document.querySelector("#board");

const head = document.createElement("div");
head.className = "grid";
head.innerHTML = `<div class="head"></div>${staff
  .map((person) => `<div class="colhead"><i class="avatar">${person.name.slice(0, 1)}</i>${person.name}</div>`)
  .join("")}<div class="wait"></div>${staff
  .map(() => `<div class="waitcell">Warteliste</div>`)
  .join("")}`;

const body = document.createElement("div");
body.className = "grid";
let times = "";
for (let hourOfDay = 8; hourOfDay < 18; hourOfDay += 1) {
  times += `<div class="time">${String(hourOfDay).padStart(2, "0")}:00</div>`;
}
const columns = staff
  .map((person) => {
    const [from, to] = person.shift.map(window.minutes);
    const cards = appointments
      .filter((item) => item.staff === person.id)
      .map((item) => {
        const begin = window.minutes(item.start);
        const top = ((begin - start) / 60) * hour;
        const height = (item.dur / 60) * hour - 3;
        return `<article class="appt ${item.tone}" style="top:${top}px;height:${height}px"><small>${item.start}–${window.clock(begin + item.dur)}</small><b>${item.customer}</b><span>${item.service}</span></article>`;
      })
      .join("");
    const hatchTop = ((from - start) / 60) * hour;
    const before = ((from - start) / 60) * hour;
    const afterTop = ((to - start) / 60) * hour;
    const dayEnd = ((18 * 60 - start) / 60) * hour;
    return `<div class="track">${before > 0 ? `<div class="off" style="top:0;height:${before}px"></div>` : ""}${afterTop < dayEnd ? `<div class="off" style="top:${afterTop}px;height:${dayEnd - afterTop}px"></div>` : ""}${cards}</div>`;
  })
  .join("");

const nowTop = ((11 * 60 + 20 - start) / 60) * hour;
body.innerHTML = `<div class="time-col">${times}</div>${columns}<div class="now" style="top:${nowTop}px"><i>11:20</i></div>`;
board.append(head, body);
const fit = () => {
  const app = document.querySelector(".app");
  const scale = Math.min(window.innerWidth / 1680, window.innerHeight / 1000);
  app.style.transform = `scale(${scale})`;
};
fit();
window.addEventListener("resize", fit);

const style = document.createElement("style");
style.textContent = `.off{position:absolute;left:0;right:0;background:repeating-linear-gradient(-45deg,transparent,transparent 4px,rgba(120,134,150,.16) 4px,rgba(120,134,150,.16) 8px)}.time-col{position:relative}`;
document.head.append(style);
void hatchTop;
