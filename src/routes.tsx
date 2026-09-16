import { createBrowserRouter } from "react-router";
import { Shell } from "./components/layout/Shell";
import { Home } from "./pages/Home";
import { Listening } from "./pages/Listening";
import { Result } from "./pages/Result";
import { Profile } from "./pages/Profile";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Shell,
    children: [
      { index: true, Component: Home },
      { path: "listening", Component: Listening },
      { path: "result", Component: Result },
      { path: "profile", Component: Profile },
    ],
  },
]);
