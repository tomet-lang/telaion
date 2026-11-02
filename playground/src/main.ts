import { mount } from "svelte";
import "@telaion/theme/tokens.css";
import "@telaion/theme/tailwind.css";
import "./playground.css";
import App from "./App.svelte";

mount(App, { target: document.getElementById("app")! });
