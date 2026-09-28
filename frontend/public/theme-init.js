(function () {
  try {
    var saved = localStorage.getItem("theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var dark = saved === "dark" || (saved !== "light" && prefersDark);
    document.documentElement.classList.toggle("dark", dark);
  } catch {
    // localStorage can throw in private browsing; leave the default light class
  }
})();
