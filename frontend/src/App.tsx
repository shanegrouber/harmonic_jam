import "./App.css";

import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Page from "./components/Page";

const customTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#ff6600", // orange
    },
    background: {
      default: "#f7f8fa", // light gray
      paper: "#fff", // white
    },
    text: {
      primary: "#222",
      secondary: "#555",
    },
  },
  typography: {
    fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
  },
});

function App() {
  return (
    <ThemeProvider theme={customTheme}>
      <CssBaseline />
      <Page />
    </ThemeProvider>
  );
}

export default App;
