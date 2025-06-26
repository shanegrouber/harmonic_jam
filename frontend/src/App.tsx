import "./App.css";

import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useEffect, useState } from "react";
import CompanyTable from "./components/CompanyTable";
import { getCollectionsMetadata } from "./utils/jam-api";
import useApi from "./utils/useApi";
import Sidebar from "./components/Sidebar";

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
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>();
  const { data: collectionResponse } = useApi(() => getCollectionsMetadata());

  useEffect(() => {
    setSelectedCollectionId(collectionResponse?.[0]?.id);
  }, [collectionResponse]);

  useEffect(() => {
    if (selectedCollectionId) {
      window.history.pushState({}, "", `?collection=${selectedCollectionId}`);
    }
  }, [selectedCollectionId]);

  return (
    <ThemeProvider theme={customTheme}>
      <CssBaseline />
      <div className="fixed inset-0 flex h-screen w-screen bg-[#f7f8fa] overflow-hidden">
        <Sidebar
          collections={collectionResponse || []}
          selectedCollectionId={selectedCollectionId}
          setSelectedCollectionId={setSelectedCollectionId}
        />
        {/* Main Content fills rest, only table scrolls */}
        <main className="flex-1 flex flex-col h-full">
          <div className="flex-1 h-full w-full overflow-y-auto p-8">
            {selectedCollectionId && (
              <CompanyTable
                selectedCollectionId={selectedCollectionId}
                collections={collectionResponse || []}
                currentCollectionId={selectedCollectionId}
                currentCollection={collectionResponse?.find(
                  (col) => col.id === selectedCollectionId
                )}
              />
            )}
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
