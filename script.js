const themes = ["theme1", "theme2", "theme3", "theme4", "theme5"];
let currentThemeIndex = 0;

document.getElementById("themeSwitcher").addEventListener("click", switchTheme);
document.querySelectorAll(".theme-button").forEach((button) => {
  button.addEventListener("click", function () {
    const selectedTheme = this.getAttribute("data-theme");
    setTheme(selectedTheme);
  });
});

function switchTheme() {
  currentThemeIndex = (currentThemeIndex + 1) % themes.length;
  setTheme(themes[currentThemeIndex]);
}

function setTheme(theme) {
  document.body.className = theme;
  document.querySelector("nav").className = theme;
  document.querySelectorAll(".theme-button").forEach((button) => {
    button.className = `theme-button ${theme}`;
  });
}
