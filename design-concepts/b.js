const { staff, appointments } = window.STUDIO;
const start = window.minutes("08:00");
const hour = 64;
const board = document.querySelector("#board");
const head = `<div class="gutter"></div>${staff
  .map((person) => `<div class="colhead"><i class="tick"></i>${person.name}</div>`)
  .join("")}`;

let times = "";
for (let hourOfDay = 8; hourOfDay < 18; hourOfDay += 1) {
  times += `<div class="time">${String(hourOfDay).padStart(2, "0")}:00</div>`;
}

const columns = staff
  .map((person) => {
    const [from, to] = person.shift.map(window.minutes);
    const before = ((from - start) / 60) * hour;
    const afterTop = ((to - start) / 60) * hour;
    const dayEnd = 10 * hour;
    const cards = appointments
      .filter((item) => item.staff === person.id)
      .map((item) => {
        const begin = window.minutes(item.start);
        const top = ((begin - start) / 60) * hour;
        const height = (item.dur / 60) * hour - 4;
        return `<article class="appt ${item.tone}" style="top:${top}px;height:${height}px"><small>${item.start}–${window.clock(begin + item.dur)}</small><b>${item.customer}</b><span>${item.service}</span></article>`;
      })
      .join("");
    return `<div class="track">${before > 0 ? `<div class="off" style="top:0;height:${before}px"></div>` : ""}${afterTop < dayEnd ? `<div class="off" style="top:${afterTop}px;height:${dayEnd - afterTop}px"></div>` : ""}${cards}</div>`;
  })
  .join("");

const nowTop = ((11 * 60 + 20 - start) / 60) * hour;
board.innerHTML = `<div class="grid">${head}<div class="time-col">${times}</div>${columns}<div class="now" style="top:${42 + nowTop}px"><i>11:20</i></div></div>`;
const fit = () => {
  const app = document.querySelector(".app");
  const scale = Math.min(window.innerWidth / 1680, window.innerHeight / 1000);
  app.style.transform = `scale(${scale})`;
};
fit();
window.addEventListener("resize", fit);
