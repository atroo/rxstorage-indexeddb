import React, { useEffect } from "react";
import "./App.css";

import { foo } from "isc-adapter";

function App() {
  useEffect(() => {
    foo();
  }, []);

  return <div className="App"></div>;
}

export default App;
