export default () => {
  const isDark = useState("theme-dark", () => false);

  // Pick up whatever the no-flash head script decided before hydration.
  const sync = () => {
    if (!import.meta.client) return;
    isDark.value = document.documentElement.classList.contains("dark");
  };

  const toggle = () => {
    if (!import.meta.client) return;
    isDark.value = !isDark.value;
    document.documentElement.classList.toggle("dark", isDark.value);
    try {
      localStorage.setItem("griot-theme", isDark.value ? "dark" : "light");
    } catch {
      // localStorage unavailable (private mode) — theme still toggles for the session.
    }
  };

  return { isDark, sync, toggle };
};
